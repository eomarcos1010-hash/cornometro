const MODELOS = [
    process.env.GEMINI_MODEL || "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash"
];

const SYSTEM_PROMPT = `
Você é o CORNÔMETRO, um analisador de conversas por imagens.

Analise cuidadosamente os prints enviados pelo usuário.

REGRAS:

1. Analise SOMENTE o que estiver visível nas imagens.
2. Nunca invente mensagens, nomes, datas, horários ou acontecimentos.
3. Se algo estiver ilegível, diga que não foi possível identificar.
4. Diferencie fatos observáveis de interpretações.
5. Não trate suspeita ou possibilidade como prova.
6. Não afirme que houve traição apenas por causa de uma conversa.
7. Considere contexto, sequência das mensagens, convites, encontros,
   flertes, intimidade, ambiguidades e contradições somente quando
   existirem evidências visíveis.
8. Considere explicações alternativas quando forem plausíveis.
9. O índice de 0 a 100 NÃO representa uma probabilidade real de traição.
   Ele representa somente a intensidade dos sinais encontrados nos prints.
10. Seja direto, natural e fácil de entender.
11. Não faça julgamentos ofensivos.
12. Não invente contexto.

RESPONDA EXATAMENTE NESTE FORMATO:

RESUMO:
Resumo objetivo do que aparece nas conversas.

INDICE:
Número de 0 a 100.

SINAIS:
- Sinal observado nas imagens.
- Outro sinal observado, se existir.
- Não invente sinais.

CONTEXTO:
Explique o que pode ser entendido a partir das mensagens visíveis.
Diferencie fatos de interpretações e mencione possíveis explicações
alternativas quando necessário.

PERGUNTAS:
- Pergunta objetiva que pode ajudar a esclarecer a situação.
- Outra pergunta relevante.
- Outra pergunta, se necessário.

COMO AGIR:
Dê uma orientação prática e equilibrada baseada somente no conteúdo
visível. Incentive uma conversa direta antes de tirar conclusões.
`;

function erro(res, status, mensagem) {
    return res.status(status).json({
        erro: mensagem
    });
}

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return erro(res, 405, "Método não permitido.");
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        return erro(
            res,
            500,
            "A inteligência artificial ainda não está configurada."
        );
    }

    try {

        const body = req.body || {};
        const imagens = body.imagens;

        if (!Array.isArray(imagens) || imagens.length === 0) {
            return erro(res, 400, "Nenhuma imagem foi enviada.");
        }

        if (imagens.length > 3) {
            return erro(
                res,
                400,
                "Você pode enviar no máximo 3 imagens."
            );
        }

        const partesImagem = [];

        for (const imagem of imagens) {

            if (!imagem || typeof imagem.data !== "string") {
                return erro(
                    res,
                    400,
                    "Uma das imagens enviadas é inválida."
                );
            }

            if (!imagem.data.length) {
                return erro(
                    res,
                    400,
                    "Uma das imagens está vazia."
                );
            }

            const mimeType = imagem.mimeType || "image/jpeg";

            if (!mimeType.startsWith("image/")) {
                return erro(
                    res,
                    400,
                    "O arquivo enviado não é uma imagem."
                );
            }

            partesImagem.push({
                inlineData: {
                    mimeType,
                    data: imagem.data
                }
            });
        }

        const prompt = `
${SYSTEM_PROMPT}

Agora analise todas as imagens enviadas.

As imagens fazem parte da mesma conversa.

Leia as mensagens na ordem em que aparecem.

Retorne somente a análise final seguindo exatamente:

RESUMO:
INDICE:
SINAIS:
CONTEXTO:
PERGUNTAS:
COMO AGIR:
`;

        const conteudo = [
            {
                text: prompt
            },
            ...partesImagem
        ];

        let ultimoErro = null;

        for (const MODEL of MODELOS) {

            try {

                console.log(
                    `Tentando modelo: ${MODEL}`
                );

                const url =
                    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

                const resposta = await fetch(url, {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        contents: [
                            {
                                role: "user",
                                parts: conteudo
                            }
                        ],

                        generationConfig: {
                            temperature: 0.1,
                            maxOutputTokens: 1200
                        }
                    })
                });

                const dados = await resposta.json();

                if (resposta.ok) {

                    const analise =
                        dados
                            ?.candidates?.[0]
                            ?.content?.parts
                            ?.map(parte => parte.text || "")
                            .join("")
                            .trim();

                    if (analise) {

                        console.log(
                            `Modelo utilizado: ${MODEL}`
                        );

                        return res.status(200).json({
                            sucesso: true,
                            modelo: MODEL,
                            analise
                        });
                    }
                }

                ultimoErro =
                    dados?.error?.message ||
                    `Erro HTTP ${resposta.status}`;

                console.error(
                    `Erro no modelo ${MODEL}:`,
                    ultimoErro
                );

            } catch (error) {

                ultimoErro = error.message;

                console.error(
                    `Falha no modelo ${MODEL}:`,
                    error
                );
            }
        }

        return erro(
            res,
            503,
            "Os modelos de inteligência artificial estão temporariamente indisponíveis. Tente novamente em alguns segundos."
        );

    } catch (error) {

        console.error(
            "Erro interno CORNÔMETRO:",
            error
        );

        return erro(
            res,
            500,
            "Ocorreu um erro ao processar a análise."
        );
    }
}
