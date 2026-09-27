const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SYSTEM_PROMPT = `
Você é o CORNÔMETRO, um analisador de conversas por imagens.

Sua função é analisar cuidadosamente os prints enviados pelo usuário.

REGRAS IMPORTANTES:

1. Analise SOMENTE o que estiver visível nas imagens.
2. Nunca invente mensagens, nomes, datas, horários ou acontecimentos.
3. Se alguma parte estiver ilegível, informe que não foi possível identificar.
4. Diferencie claramente fatos observáveis de interpretações.
5. Não trate suspeita, possibilidade ou interpretação como prova.
6. Não afirme que houve traição apenas por causa de uma conversa.
7. Considere contexto, sequência das mensagens, mudanças de comportamento,
   convites, encontros, flertes, intimidade, ambiguidades e contradições
   somente quando existirem evidências visíveis nos prints.
8. Considere explicações alternativas quando forem plausíveis.
9. O índice de 0 a 100 NÃO representa uma probabilidade real de traição.
   Ele representa apenas a intensidade dos sinais que merecem atenção
   dentro do material enviado.
10. Seja direto, natural e fácil de entender.
11. Não faça julgamentos ofensivos sobre nenhuma pessoa.
12. Não invente contexto que não aparece nas imagens.

RESPONDA EXATAMENTE NESTE FORMATO:

RESUMO:
Um resumo objetivo do que aparece nas conversas.

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


// ======================================================
// RESPOSTA DE ERRO
// ======================================================

function erro(res, status, mensagem) {

    return res.status(status).json({
        erro: mensagem
    });

}


// ======================================================
// HANDLER
// ======================================================

export default async function handler(req, res) {

    // --------------------------------------------------
    // MÉTODO
    // --------------------------------------------------

    if (req.method !== "POST") {

        return erro(
            res,
            405,
            "Método não permitido."
        );

    }


    // --------------------------------------------------
    // API KEY
    // --------------------------------------------------

    const API_KEY =
        process.env.GEMINI_API_KEY;


    if (!API_KEY) {

        console.error(
            "GEMINI_API_KEY não configurada."
        );

        return erro(
            res,
            500,
            "A inteligência artificial ainda não está configurada no servidor."
        );

    }


    // --------------------------------------------------
    // RECEBER DADOS
    // --------------------------------------------------

    try {

        const body =
            req.body || {};


        const imagens =
            body.imagens;


        if (
            !Array.isArray(imagens) ||
            imagens.length === 0
        ) {

            return erro(
                res,
                400,
                "Nenhuma imagem foi enviada."
            );

        }


        // --------------------------------------------------
        // LIMITE DE IMAGENS
        // --------------------------------------------------

        if (
            imagens.length > 3
        ) {

            return erro(
                res,
                400,
                "Você pode enviar no máximo 3 imagens."
            );

        }


        // --------------------------------------------------
        // VALIDAR IMAGENS
        // --------------------------------------------------

        const partesImagem =
            [];


        for (
            const imagem of imagens
        ) {

            if (
                !imagem ||
                typeof imagem.data !== "string"
            ) {

                return erro(
                    res,
                    400,
                    "Uma das imagens enviadas é inválida."
                );

            }


            if (
                imagem.data.length === 0
            ) {

                return erro(
                    res,
                    400,
                    "Uma das imagens está vazia."
                );

            }


            const mimeType =
                imagem.mimeType ||
                "image/jpeg";


            if (
                !mimeType.startsWith(
                    "image/"
                )
            ) {

                return erro(
                    res,
                    400,
                    "Foi enviado um arquivo que não é uma imagem."
                );

            }


            partesImagem.push({

                inlineData: {

                    mimeType:
                        mimeType,

                    data:
                        imagem.data

                }

            });

        }


        // --------------------------------------------------
        // PROMPT
        // --------------------------------------------------

        const prompt = `
${SYSTEM_PROMPT}

Agora analise cuidadosamente todas as imagens enviadas.

As imagens fazem parte da mesma conversa e devem ser analisadas
em conjunto quando houver mais de uma.

Leia as mensagens na ordem em que aparecem.

Não invente informações que não estejam visíveis.

Retorne somente a análise final seguindo exatamente as seções:

RESUMO:
INDICE:
SINAIS:
CONTEXTO:
PERGUNTAS:
COMO AGIR:
`;


        // --------------------------------------------------
        // CORPO DA REQUISIÇÃO
        // --------------------------------------------------

        const conteudo = [

            {
                text: prompt
            },

            ...partesImagem

        ];


        // --------------------------------------------------
        // CHAMAR GEMINI
        // --------------------------------------------------

        const url =
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;


        const resposta =
            await fetch(
                url,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            contents: [

                                {
                                    role: "user",

                                    parts:
                                        conteudo
                                }

                            ],

                            generationConfig: {

                                temperature:
                                    0.1,

                                maxOutputTokens:
                                    1200

                            }

                        })

                }
            );


        // --------------------------------------------------
        // LER RESPOSTA
        // --------------------------------------------------

        const dados =
            await resposta.json();


        // --------------------------------------------------
        // ERRO GEMINI
        // --------------------------------------------------

        if (
            !resposta.ok
        ) {

            console.error(
                "Erro Gemini:",
                dados
            );


            const mensagem =
                dados?.error?.message ||
                "A inteligência artificial não conseguiu processar as imagens.";


            return erro(
                res,
                resposta.status,
                mensagem
            );

        }


        // --------------------------------------------------
        // EXTRAIR TEXTO
        // --------------------------------------------------

        const analise =
            dados
                ?.candidates?.[0]
                ?.content
                ?.parts
                ?.map(
                    parte =>
                        parte.text || ""
                )
                .join("")
                .trim();


        if (
            !analise
        ) {

            console.error(
                "Resposta sem texto:",
                dados
            );


            return erro(
                res,
                500,
                "A IA não retornou uma análise."
            );

        }


        // --------------------------------------------------
        // RETORNAR PARA O SITE
        // --------------------------------------------------

        return res.status(200).json({

            sucesso:
                true,

            analise:
                analise

        });


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