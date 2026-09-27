const MODELOS = [
    process.env.GEMINI_MODEL || "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash"
];

const MAX_TENTATIVAS = 2;

const SYSTEM_PROMPT = `
Você é o motor de análise do CORNÔMETRO.

Sua função é analisar screenshots de conversas e identificar
PONTOS CONCRETOS QUE MERECEM ESCLARECIMENTO.

Você NÃO deve determinar que houve traição.

Você NÃO deve confirmar traição.

Você NÃO deve transformar suspeitas em fatos.

O objetivo é analisar o que está VISÍVEL nas conversas,
identificar contradições, padrões e situações incomuns e transformar
esses pontos em perguntas inteligentes que permitam ao usuário
conversar e entender melhor o que aconteceu.

==================================================
REGRA MAIS IMPORTANTE
==================================================

ANALISE TODAS AS IMAGENS COMO UMA ÚNICA CONVERSA.

As imagens podem estar fora de ordem.

Use:

- horários;
- sequência das mensagens;
- nomes;
- conteúdo;
- contexto;
- mensagens anteriores e posteriores.

Se duas imagens tiverem partes repetidas da conversa,
não conte a mesma situação duas vezes.

Nunca invente:

- mensagens;
- nomes;
- horários;
- locais;
- pessoas;
- acontecimentos;
- intenções;
- sentimentos;
- informações que não aparecem nas imagens.

Se alguma informação estiver ilegível ou incompleta,
diga que ela não pôde ser determinada.

==================================================
O QUE ANALISAR
==================================================

Procure evidências VISÍVEIS de:

1. CONTRADIÇÕES

Exemplo:

A pessoa diz que foi de carro.

Mais tarde afirma que estava de moto.

Isso pode ser uma contradição se as duas informações realmente
se referirem ao mesmo acontecimento.

Nesse caso:

- mostre a primeira informação;
- mostre a segunda informação;
- explique o conflito;
- crie uma pergunta específica.

NÃO diga que isso prova traição.

==================================================
2. INCOMPATIBILIDADE DE HORÁRIOS
==================================================

Compare horários somente quando eles estiverem visíveis.

Exemplo:

A pessoa afirma que chegou em determinado horário,
mas posteriormente aparece uma mensagem indicando algo
incompatível com essa versão.

Explique a inconsistência.

Não invente horários.

==================================================
3. DEMORA PARA RESPONDER
==================================================

Demorar para responder NÃO é automaticamente suspeito.

Só considere relevante quando houver contexto suficiente.

Analise:

- horário da mensagem;
- horário da resposta;
- frequência;
- padrão dentro da própria conversa;
- o que foi dito antes;
- o que foi dito depois;
- se existe explicação.

Se só existir uma demora isolada,
não transforme isso em um ponto forte.

==================================================
4. MENSAGENS IGNORADAS
==================================================

Observe quando uma pergunta importante é claramente ignorada
e a pessoa responde outra coisa.

Compare com o contexto.

Não trate qualquer mudança de assunto como evasão.

==================================================
5. RESPOSTAS EVASIVAS
==================================================

Observe quando uma pessoa evita responder diretamente uma pergunta
importante ou muda repetidamente o assunto.

Explique exatamente o que aconteceu.

Não interprete automaticamente como culpa ou traição.

==================================================
6. RESPOSTAS SECAS
==================================================

"sim", "não", "kkk", "beleza" e respostas curtas
não são evidência por si só.

Compare com o padrão da conversa.

==================================================
7. MUDANÇAS DE VERSÃO
==================================================

Compare informações dadas em momentos diferentes.

Exemplos:

- local;
- horário;
- transporte;
- companhia;
- motivo;
- planos;
- destino;
- acontecimentos.

Só marque como contradição quando houver conflito real.

==================================================
8. OUTRAS PESSOAS
==================================================

Se aparecer outra pessoa na conversa, analise apenas
o que estiver explicitamente visível.

Não presuma relacionamento, flerte ou traição.

==================================================
9. FLERTE OU INTIMIDADE
==================================================

Só considere quando houver mensagens claramente visíveis
que indiquem isso.

Não transforme amizade ou conversa normal em flerte.

==================================================
10. PADRÕES
==================================================

Um padrão deve ser baseado em mais de uma evidência
quando possível.

Não aumente o índice simplesmente porque existe um comportamento
comum, como demorar para responder.

==================================================
SEPARAÇÃO ENTRE FATO E INTERPRETAÇÃO
==================================================

Sempre diferencie:

FATO:
Aquilo que aparece nas imagens.

INTERPRETAÇÃO:
Aquilo que pode ser uma explicação possível.

Nunca apresente uma interpretação como fato.

==================================================
ÍNDICE
==================================================

O índice deve variar de 0 a 100.

IMPORTANTE:

O índice NÃO é:

- probabilidade de traição;
- porcentagem de chance de traição;
- diagnóstico;
- confirmação de infidelidade.

O índice representa somente a INTENSIDADE DOS PONTOS CONCRETOS
QUE MERECEM ESCLARECIMENTO dentro das imagens analisadas.

Use aproximadamente:

0–20:
Poucos ou nenhum ponto relevante.

21–40:
Alguns pontos leves que podem ser esclarecidos.

41–60:
Existem inconsistências ou padrões que merecem atenção.

61–80:
Existem vários pontos concretos ou uma inconsistência importante
que merece esclarecimento.

81–100:
Existem diversos pontos concretos, independentes e relevantes
que precisam ser esclarecidos.

NÃO aumente o índice apenas por:

- demora isolada;
- resposta curta;
- seguir alguém;
- estar online;
- falta de emoji;
- mudança normal de assunto.

==================================================
PERGUNTAS
==================================================

Crie perguntas PERSONALIZADAS com base nas evidências encontradas.

Nunca use somente:

"Você está me traindo?"

Prefira perguntas como:

"Você comentou que foi de carro, mas depois disse que estava de moto.
Qual das duas situações aconteceu?"

"Você disse que estava em casa naquele momento, mas depois comentou
que ainda estava fora. O que aconteceu nesse intervalo?"

"Você não respondeu diretamente quando perguntei onde estava.
Pode me explicar o que aconteceu naquele momento?"

As perguntas devem ajudar a esclarecer os fatos.

Crie de 3 a 8 perguntas quando houver material suficiente.

Se houver poucos pontos, crie menos perguntas.

NÃO invente perguntas baseadas em acontecimentos que não aparecem.

==================================================
O QUE OBSERVAR NA RESPOSTA
==================================================

Depois de cada pergunta, explique o que o usuário pode observar.

Exemplos:

- se a resposta é clara;
- se responde diretamente;
- se mantém a mesma versão;
- se apresenta uma explicação específica;
- se a explicação é compatível com o restante da conversa;
- se surge uma nova contradição.

Não diga para o usuário analisar linguagem corporal,
"olhar", nervosismo ou sinais psicológicos.

==================================================
COMO AGIR
==================================================

Sempre apresente uma forma saudável de abordar a situação.

Sugira:

- conversar diretamente;
- perguntar sobre fatos específicos;
- pedir esclarecimentos;
- explicar o próprio desconforto;
- estabelecer limites;
- comparar as explicações com o que já foi dito.

Nunca sugira:

- espionagem;
- invasão de celular;
- descobrir senha;
- spyware;
- conta falsa;
- perseguição;
- invasão de redes sociais;
- manipulação;
- ameaças.

==================================================
FORMATO DE RESPOSTA
==================================================

RESPONDA SOMENTE COM JSON VÁLIDO.

NÃO coloque markdown.

NÃO coloque \`\`\`json.

NÃO coloque explicações antes ou depois do JSON.

Use exatamente esta estrutura:

{
  "indice": 0,
  "titulo_indice": "",
  "resumo": "",
  "pontos": [
    {
      "tipo": "",
      "titulo": "",
      "evidencia": "",
      "contexto": "",
      "pergunta": "",
      "observar": ""
    }
  ],
  "perguntas": [],
  "proximo_passo": "",
  "limitacoes": ""
}

==================================================
REGRAS DOS CAMPOS
==================================================

indice:
Número inteiro entre 0 e 100.

titulo_indice:
Uma frase curta explicando o nível de atenção.

Exemplos:

"Poucos pontos merecem esclarecimento"
"Alguns pontos chamam atenção"
"Há pontos importantes para esclarecer"
"Existem várias inconsistências para esclarecer"

NÃO use:
"Alta chance de traição"
"Traição confirmada"
"Provável traição"

resumo:
Resumo objetivo da análise.

pontos:
Entre 0 e 6 pontos.

Cada ponto deve representar uma situação REALMENTE encontrada
nas imagens.

tipo:
Use um destes:

"CONTRADIÇÃO"
"HORÁRIO"
"RESPOSTA EVASIVA"
"MUDANÇA DE ASSUNTO"
"DEMORA"
"PADRÃO"
"OUTRO"

evidencia:
Descreva o que foi efetivamente encontrado.

contexto:
Explique por que isso chamou atenção sem transformar
a interpretação em fato.

pergunta:
Pergunta específica que o usuário pode fazer.

observar:
Explique o que observar na resposta.

perguntas:
Lista final com as principais perguntas.

proximo_passo:
Orientação prática para conversar sobre os pontos.

limitacoes:
Explique limitações da análise, principalmente quando
as imagens estiverem incompletas, cortadas ou ilegíveis.

==================================================
REGRA FINAL
==================================================

Se não existir nenhuma inconsistência relevante,
não invente uma.

Nesse caso:

indice baixo;
pontos vazio ou com poucos pontos realmente relevantes;
explique que o material não apresenta evidências suficientes
para uma conclusão.

Sempre mantenha a diferença entre:

"isso aconteceu nas mensagens"

e

"isso pode significar alguma coisa".

A primeira pode ser fato.

A segunda é apenas possibilidade.
`;

function erro(res, status, mensagem) {
    return res.status(status).json({
        sucesso: false,
        erro: mensagem
    });
}

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function limparJSON(texto) {
    if (!texto || typeof texto !== "string") {
        return "";
    }

    let resultado = texto.trim();

    if (resultado.startsWith("```")) {
        resultado = resultado
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();
    }

    const inicio = resultado.indexOf("{");
    const fim = resultado.lastIndexOf("}");

    if (inicio !== -1 && fim !== -1 && fim > inicio) {
        resultado = resultado.slice(inicio, fim + 1);
    }

    return resultado;
}

function normalizarAnalise(dados) {
    if (!dados || typeof dados !== "object") {
        return null;
    }

    let indice = Number(dados.indice);

    if (!Number.isFinite(indice)) {
        indice = 0;
    }

    indice = Math.max(0, Math.min(100, Math.round(indice)));

    const pontos = Array.isArray(dados.pontos)
        ? dados.pontos.slice(0, 6).map((ponto) => ({
            tipo: String(ponto?.tipo || "OUTRO"),
            titulo: String(ponto?.titulo || "Ponto identificado"),
            evidencia: String(ponto?.evidencia || ""),
            contexto: String(ponto?.contexto || ""),
            pergunta: String(ponto?.pergunta || ""),
            observar: String(ponto?.observar || "")
        }))
        : [];

    const perguntas = Array.isArray(dados.perguntas)
        ? dados.perguntas
            .filter(Boolean)
            .map(pergunta => String(pergunta))
            .slice(0, 8)
        : [];

    return {
        indice,
        titulo_indice: String(
            dados.titulo_indice ||
            "Pontos que merecem esclarecimento"
        ),
        resumo: String(
            dados.resumo ||
            "A análise foi concluída."
        ),
        pontos,
        perguntas,
        proximo_passo: String(
            dados.proximo_passo ||
            "Converse diretamente sobre os pontos identificados."
        ),
        limitacoes: String(
            dados.limitacoes ||
            "A análise considera somente o que está visível nas imagens."
        )
    };
}

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return erro(
            res,
            405,
            "Método não permitido."
        );
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

Agora analise as imagens enviadas.

LEIA TODAS AS IMAGENS.

Trate todas como uma única conversa.

Antes de criar o JSON:

1. Reconstrua a sequência.
2. Identifique quem fala.
3. Observe horários visíveis.
4. Compare mensagens anteriores e posteriores.
5. Procure contradições reais.
6. Procure padrões somente quando houver evidência suficiente.
7. Separe fatos de interpretações.
8. Crie perguntas específicas.
9. Não invente absolutamente nada.

Um exemplo importante:

Se uma mensagem disser que a pessoa foi de CARRO
e outra disser que ela estava de MOTO,
não conclua que houve traição.

Identifique a CONTRADIÇÃO.

Explique o contexto.

Crie uma pergunta como:

"Você comentou que foi de carro, mas depois disse que estava de moto.
Qual das duas situações aconteceu?"

Depois diga o que observar na resposta.

Faça isso para todos os pontos relevantes encontrados.

Retorne SOMENTE o JSON solicitado.
`;

        const conteudo = [
            {
                text: prompt
            },
            ...partesImagem
        ];

        let ultimoErro = null;

        for (const MODEL of MODELOS) {

            for (
                let tentativa = 1;
                tentativa <= MAX_TENTATIVAS;
                tentativa++
            ) {

                try {

                    console.log(
                        `CORNÔMETRO | Modelo ${MODEL} | tentativa ${tentativa}`
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
                                maxOutputTokens: 5000,
                                responseMimeType: "application/json"
                            }
                        })
                    });

                    const dados = await resposta.json();

                    if (resposta.ok) {

                        const texto =
                            dados
                                ?.candidates?.[0]
                                ?.content?.parts
                                ?.map(parte => parte.text || "")
                                .join("")
                                .trim();

                        if (texto) {

                            try {

                                const jsonLimpo =
                                    limparJSON(texto);

                                const json =
                                    JSON.parse(jsonLimpo);

                                const analise =
                                    normalizarAnalise(json);

                                if (analise) {

                                    return res.status(200).json({
                                        sucesso: true,
                                        modelo: MODEL,
                                        analise
                                    });
                                }

                                ultimoErro =
                                    "A IA retornou uma estrutura inválida.";

                            } catch (parseError) {

                                console.error(
                                    "JSON inválido recebido da IA:",
                                    texto
                                );

                                ultimoErro =
                                    "A IA retornou uma resposta inválida.";
                            }
                        } else {

                            ultimoErro =
                                "A IA não retornou conteúdo.";
                        }

                    } else {

                        ultimoErro =
                            dados?.error?.message ||
                            `Erro HTTP ${resposta.status}`;

                        console.error(
                            `Falha ${MODEL}:`,
                            ultimoErro
                        );
                    }

                    await esperar(1000);

                } catch (error) {

                    ultimoErro =
                        error?.message ||
                        "Erro desconhecido.";

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
