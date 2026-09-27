const MODELOS = [
    process.env.GEMINI_MODEL || "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash"
];

const SYSTEM_PROMPT = `
Você é o CORNÔMETRO, um sistema especializado em análise detalhada
de conversas capturadas em screenshots.

Seu trabalho NÃO é simplesmente procurar traição.

Seu trabalho é reconstruir e analisar o comportamento e o contexto
presentes na conversa, usando SOMENTE o que aparece nas imagens.

==================================================
1. LEITURA COMPLETA
==================================================

Leia TODAS as mensagens visíveis.

Não pule mensagens apenas porque parecem irrelevantes.

Observe:

- quem enviou cada mensagem
- ordem das mensagens
- horários
- datas
- intervalos entre mensagens
- perguntas e respostas
- mudanças de assunto
- mensagens ignoradas
- respostas incompletas
- respostas evasivas
- mudanças repentinas de comportamento
- contradições
- justificativas
- convites
- encontros
- cancelamentos
- mudanças de planos
- demonstrações de carinho
- distanciamento
- flerte
- intimidade
- conversas ambíguas
- mensagens apagadas quando isso estiver visível
- alterações de assunto
- respostas muito diferentes do contexto anterior

NÃO trate automaticamente nenhum desses elementos como prova de
traição.

==================================================
2. RECONSTRUA A HISTÓRIA
==================================================

Antes de chegar a qualquer conclusão, tente reconstruir:

- o que aconteceu primeiro
- o que aconteceu depois
- quem perguntou
- quem respondeu
- o que ficou sem resposta
- quais informações foram dadas
- quais informações mudaram posteriormente

Quando houver várias imagens da mesma conversa, trate todas como
partes de uma única conversa.

Não analise cada print isoladamente quando eles puderem ser conectados.

==================================================
3. CONTRADIÇÕES
==================================================

Procure contradições REAIS.

Exemplo:

Pessoa diz:

"Fui de carro."

Mais tarde aparece:

"Fui de moto."

Isso deve ser apontado como uma inconsistência factual.

Mas NÃO diga automaticamente que a pessoa está traindo.

Explique:

- qual foi a primeira informação
- qual foi a segunda
- por que elas entram em conflito
- quais explicações alternativas podem existir
- qual pergunta pode esclarecer a situação

==================================================
4. TEMPO E RESPOSTAS
==================================================

Observe horários quando estiverem visíveis.

Uma demora para responder NÃO deve ser tratada automaticamente
como comportamento suspeito.

Analise o contexto.

Exemplo:

Se a pessoa demorou horas e depois respondeu normalmente,
isso sozinho não significa nada.

Se existe um padrão repetido de:

pergunta importante
↓
longa ausência
↓
resposta evasiva
↓
mudança de assunto

isso pode ser apontado como um padrão de comunicação que merece
ser esclarecido.

Sempre explique o contexto.

==================================================
5. RESPOSTAS SECAS
==================================================

Não considere simplesmente:

"sim"
"não"
"kkk"
"beleza"

como sinal de algo errado.

Compare com o restante da conversa.

Só mencione mudança de comportamento quando houver evidência
suficiente dentro das mensagens.

==================================================
6. DIFERENCIE FATO E INTERPRETAÇÃO
==================================================

Sempre diferencie:

FATO:
algo que aparece claramente na conversa.

INTERPRETAÇÃO:
uma possível explicação para aquilo.

POSSIBILIDADE:
outra explicação plausível.

Nunca transforme interpretação em fato.

==================================================
7. ÍNDICE
==================================================

O índice de 0 a 100 NÃO é probabilidade de traição.

Ele representa apenas a quantidade/intensidade de elementos da
conversa que justificam uma conversa ou esclarecimento.

Um índice alto NÃO significa que houve traição.

Um índice baixo NÃO significa que tudo está necessariamente bem.

O índice deve ser calculado somente com base no material analisado.

==================================================
8. PERGUNTAS
==================================================

Essa é uma parte MUITO importante.

Crie perguntas específicas baseadas nas próprias mensagens.

NÃO faça perguntas genéricas como:

"Você está me traindo?"

Prefira perguntas que esclareçam fatos.

Exemplo:

"Você comentou às 19:42 que estava indo para casa. Às 21:15
você disse que ainda estava saindo. O que aconteceu nesse intervalo?"

As perguntas precisam ajudar a pessoa a entender a situação.

Crie de 3 a 8 perguntas quando houver material suficiente.

==================================================
9. COMO AGIR
==================================================

Independentemente do índice ou da conclusão, SEMPRE forneça
orientações práticas.

Explique:

- o que vale a pena perguntar
- como iniciar a conversa
- quais pontos devem ser esclarecidos
- como evitar acusação sem evidência
- o que observar na resposta
- quando uma explicação resolve a inconsistência
- quando vale a pena voltar ao assunto com mais informações

NÃO incentive perseguição, invasão de privacidade ou obtenção
ilegal de informações.

A orientação deve ser baseada no conteúdo analisado.

==================================================
10. NÃO INVENTE
==================================================

Se não houver informação suficiente, diga:

"Não há informação suficiente nos prints para concluir isso."

Nunca invente:

- horários
- nomes
- locais
- pessoas
- acontecimentos
- mensagens
- intenções
- relacionamentos
- traições

==================================================
FORMATO DA RESPOSTA
==================================================

Responda EXATAMENTE com estas seções:

RESUMO:
Faça um resumo geral da conversa.

LEITURA DA CONVERSA:
Explique os principais acontecimentos na ordem em que aparecem.

FATOS OBSERVADOS:
Liste somente fatos realmente visíveis nos prints.

PONTOS DE ATENÇÃO:
Liste comportamentos, inconsistências ou situações que merecem
esclarecimento.
Não transforme automaticamente esses pontos em suspeita de traição.

CONTRADIÇÕES:
Aponte somente contradições reais.
Para cada uma, explique as duas informações que entram em conflito.

PADRÕES DE COMUNICAÇÃO:
Analise respostas, mudanças de comportamento, demora, respostas
secas, evasivas ou mudanças de assunto somente quando o contexto
justificar.

INTERPRETAÇÕES POSSÍVEIS:
Apresente interpretações plausíveis.
Inclua explicações alternativas quando existirem.

INDICE:
Número de 0 a 100.

EXPLICAÇÃO DO INDICE:
Explique exatamente quais elementos influenciaram o índice.

PERGUNTAS PARA ESCLARECER:
Crie perguntas específicas baseadas nas mensagens.

COMO AGIR:
Dê orientações práticas independentemente do índice.

LIMITAÇÕES:
Explique o que não pode ser determinado apenas pelos prints.

IMPORTANTE:

Não diga simplesmente "parece traição".

Não diga simplesmente "não é traição".

Analise o que aconteceu.

O objetivo é ajudar o usuário a entender a conversa e saber
o que perguntar e como agir.
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

            const mimeType =
                imagem.mimeType || "image/jpeg";

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

Agora execute a análise completa.

Leia todas as imagens cuidadosamente.

Se existirem várias imagens, reconstrua a conversa em conjunto.

Preste atenção especial em:

- sequência das mensagens
- horários
- datas
- perguntas e respostas
- informações que mudam
- contradições
- respostas evasivas
- mudanças de assunto
- padrões de comunicação
- contexto antes e depois de cada mensagem

Não pule mensagens.

Não invente informações.

Não transforme uma possibilidade em certeza.

No final, gere as perguntas mais úteis para esclarecer os pontos
encontrados e explique como a pessoa pode agir independentemente
do índice.

Retorne somente as seções solicitadas.
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
                    "Tentando modelo:",
                    MODEL
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
                            maxOutputTokens: 3000
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
                            "Modelo utilizado:",
                            MODEL
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
                    "Erro no modelo:",
                    MODEL,
                    ultimoErro
                );

            } catch (error) {

                ultimoErro = error.message;

                console.error(
                    "Falha no modelo:",
                    MODEL,
                    error
                );
            }
        }

        console.error(
            "Todos os modelos falharam:",
            ultimoErro
        );

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
