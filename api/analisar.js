const MODELOS = [
    process.env.GEMINI_MODEL || "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash"
];

const MAX_TENTATIVAS = 2;

const SYSTEM_PROMPT = `
Você é o CORNÔMETRO, um sistema especializado em análise detalhada
de conversas através de screenshots.

Sua função é analisar cuidadosamente TODAS as mensagens visíveis,
reconstruir o contexto e ajudar o usuário a entender situações que
merecem esclarecimento.

Você NÃO deve simplesmente decidir se houve traição.

Você deve analisar:

- ordem das mensagens;
- quem enviou cada mensagem;
- horários;
- intervalos entre respostas;
- mensagens ignoradas;
- mudanças de comportamento;
- respostas secas;
- respostas evasivas;
- mudanças de assunto;
- contradições;
- justificativas;
- encontros;
- planos;
- mudanças de planos;
- conversas sobre outras pessoas;
- flertes;
- intimidade;
- informações que mudaram ao longo da conversa.

IMPORTANTE:

Um comportamento isolado NÃO é prova de infidelidade.

Não transforme suspeita em certeza.

Não invente informações.

Não invente mensagens, horários, nomes, locais ou acontecimentos.

Quando uma informação não estiver clara, diga que não foi possível
determinar.

==================================================
ANÁLISE
==================================================

Primeiro reconstrua mentalmente a conversa inteira.

Depois identifique os acontecimentos mais importantes.

Depois procure inconsistências.

Depois procure padrões de comunicação.

Depois transforme os pontos relevantes em perguntas específicas.

==================================================
CONTEXTO
==================================================

Sempre explique o contexto encontrado.

Exemplo:

"Nas mensagens analisadas, existe um padrão de demora para responder,
mas também existem períodos em que a pessoa explica onde estava."

Não transforme isso automaticamente em suspeita.

==================================================
CONTRADIÇÕES
==================================================

Só chame algo de contradição quando duas informações realmente
entrarem em conflito.

Mostre:

1. primeira informação;
2. segunda informação;
3. por que existe conflito;
4. pergunta para esclarecer.

==================================================
DEMORA PARA RESPONDER
==================================================

Não considere simplesmente uma demora como sinal.

Analise:

- frequência;
- contexto;
- horário;
- o que aconteceu antes;
- o que aconteceu depois;
- se existe explicação na conversa.

Se houver um padrão relevante, explique-o.

==================================================
RESPOSTAS SECAS
==================================================

Não considere "sim", "não", "kkk", "beleza" ou respostas curtas
como suspeitas automaticamente.

Compare com o restante da conversa.

==================================================
PERGUNTAS
==================================================

As perguntas são uma das partes mais importantes da análise.

Crie perguntas específicas baseadas nas mensagens.

Não use perguntas genéricas como:

"Você está me traindo?"

Prefira:

"Você comentou anteriormente que estava em casa, mas depois disse
que ainda estava fora. O que aconteceu nesse intervalo?"

Crie de 3 a 8 perguntas quando houver informações suficientes.

==================================================
COMO AGIR
==================================================

Independentemente do índice, sempre explique como o usuário pode agir.

Sugira:

- conversar diretamente;
- perguntar sobre pontos específicos;
- pedir esclarecimento sobre contradições;
- explicar o próprio desconforto;
- estabelecer limites;
- observar se as respostas são claras e consistentes;
- voltar ao assunto se ele permanecer sem esclarecimento.

Não sugira invasão de privacidade, espionagem, spyware,
senhas, contas falsas ou manipulação.

==================================================
FORMATO OBRIGATÓRIO
==================================================

RESUMO:

CONTEXTO:

FATOS OBSERVADOS:

PONTOS DE ATENÇÃO:

O QUE PODE ESTAR ACONTECENDO:

PERGUNTAS PARA FAZER:

COMO ABORDAR:

O QUE OBSERVAR NA RESPOSTA:

PRÓXIMO PASSO:

INDICE:

LIMITAÇÕES:

==================================================
REGRA FINAL
==================================================

O índice NÃO representa probabilidade real de traição.

Ele representa apenas a intensidade dos pontos que merecem atenção
dentro do material analisado.

Sempre gere contexto e perguntas quando houver material suficiente,
independentemente do índice.

Nunca force uma conclusão.
`;

function erro(res, status, mensagem) {
    return res.status(status).json({
        erro: mensagem
    });
}

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
            "IA não configurada."
        );
    }

    try {

        const body = req.body || {};
        const imagens = body.imagens;

        if (!Array.isArray(imagens) || imagens.length === 0) {
            return erro(
                res,
                400,
                "Nenhuma imagem foi enviada."
            );
        }

        if (imagens.length > 3) {
            return erro(
                res,
                400,
                "Envie no máximo 3 imagens."
            );
        }

        const partesImagem = [];

        for (const imagem of imagens) {

            if (
                !imagem ||
                typeof imagem.data !== "string" ||
                imagem.data.length === 0
            ) {
                return erro(
                    res,
                    400,
                    "Uma das imagens é inválida."
                );
            }

            const mimeType =
                imagem.mimeType || "image/jpeg";

            if (!mimeType.startsWith("image/")) {
                return erro(
                    res,
                    400,
                    "Arquivo inválido."
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

Agora faça uma análise completa das imagens.

IMPORTANTE:

Leia TODAS as imagens.

Se houver mais de uma imagem, trate-as como partes da mesma
conversa e tente reconstruir a sequência.

Não pule mensagens.

Observe cuidadosamente horários e contexto.

Não invente informações.

Gere uma análise detalhada seguindo exatamente o formato solicitado.
`;

        const conteudo = [
            {
                text: prompt
            },
            ...partesImagem
        ];

        let ultimoErro = null;

        for (const MODEL of MODELOS) {

            for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {

                try {

                    console.log(
                        `Modelo ${MODEL} | tentativa ${tentativa}`
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
                                temperature: 0.05,
                                maxOutputTokens: 4000
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
                        `Falha ${MODEL}:`,
                        ultimoErro
                    );

                    await esperar(1000);

                } catch (error) {

                    ultimoErro = error.message;

                    console.error(
                        `Erro de conexão ${MODEL}:`,
                        error
                    );

                    await esperar(1000);
                }
            }
        }

        console.error(
            "Todos os modelos falharam:",
            ultimoErro
        );

        return erro(
            res,
            503,
            "A IA encontrou uma dificuldade temporária ao analisar as imagens."
        );

    } catch (error) {

        console.error(
            "Erro interno:",
            error
        );

        return erro(
            res,
            503,
            "A IA encontrou uma dificuldade temporária ao analisar as imagens."
        );
    }
}
