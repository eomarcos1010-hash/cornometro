const inputImagens = document.getElementById("inputImagens");
const areaUpload = document.getElementById("areaUpload");
const preview = document.getElementById("preview");
const contador = document.getElementById("contador");
const btnAnalisar = document.getElementById("btnAnalisar");
const resultado = document.getElementById("resultado");
const statusIA = document.getElementById("statusIA");

let arquivosSelecionados = [];

const MAX_IMAGENS = 3;
const MAX_LADO = 1280;
const QUALIDADE_JPEG = 0.68;


// ======================================================
// STATUS
// ======================================================

async function verificarServidor() {

    if (!statusIA) return;

    try {

        const resposta = await fetch("/api/status", {
            method: "GET",
            cache: "no-store"
        });

        if (!resposta.ok) {
            throw new Error();
        }

        const dados = await resposta.json();

        if (dados.online) {
            statusIA.textContent = "IA ONLINE";
            statusIA.classList.add("online");
        } else {
            statusIA.textContent = "IA OFFLINE";
            statusIA.classList.remove("online");
        }

    } catch (erro) {

        statusIA.textContent = "IA PRONTA";
        statusIA.classList.add("online");
    }
}

verificarServidor();


// ======================================================
// UPLOAD
// ======================================================

areaUpload.addEventListener("click", () => {
    inputImagens.click();
});

inputImagens.addEventListener("change", () => {

    adicionarImagens(
        Array.from(inputImagens.files)
    );

    inputImagens.value = "";
});


areaUpload.addEventListener("dragover", evento => {

    evento.preventDefault();

    areaUpload.classList.add("dragging");
});


areaUpload.addEventListener("dragleave", () => {

    areaUpload.classList.remove("dragging");
});


areaUpload.addEventListener("drop", evento => {

    evento.preventDefault();

    areaUpload.classList.remove("dragging");

    adicionarImagens(
        Array.from(evento.dataTransfer.files)
    );
});


// ======================================================
// ADICIONAR IMAGENS
// ======================================================

function adicionarImagens(imagens) {

    for (const imagem of imagens) {

        if (
            !imagem.type ||
            !imagem.type.startsWith("image/")
        ) {
            continue;
        }

        if (
            arquivosSelecionados.length >= MAX_IMAGENS
        ) {
            break;
        }

        const jaExiste =
            arquivosSelecionados.some(arquivo =>
                arquivo.name === imagem.name &&
                arquivo.size === imagem.size &&
                arquivo.lastModified === imagem.lastModified
            );

        if (jaExiste) continue;

        arquivosSelecionados.push(imagem);
    }

    atualizarPreview();
}


// ======================================================
// PREVIEW
// ======================================================

function atualizarPreview() {

    preview.innerHTML = "";

    arquivosSelecionados.forEach((arquivo, index) => {

        const container =
            document.createElement("div");

        container.className = "imagem-preview";

        const img =
            document.createElement("img");

        const url =
            URL.createObjectURL(arquivo);

        img.src = url;
        img.alt = `Print ${index + 1}`;

        img.onload = () => {
            URL.revokeObjectURL(url);
        };


        const numero =
            document.createElement("span");

        numero.textContent = index + 1;
        numero.className = "numero-imagem";


        const remover =
            document.createElement("button");

        remover.type = "button";
        remover.textContent = "×";
        remover.className = "remover-imagem";
        remover.title = "Remover imagem";


        remover.addEventListener("click", evento => {

            evento.preventDefault();
            evento.stopPropagation();

            arquivosSelecionados.splice(index, 1);

            atualizarPreview();
        });


        container.appendChild(img);
        container.appendChild(numero);
        container.appendChild(remover);

        preview.appendChild(container);
    });


    contador.textContent =
        `${arquivosSelecionados.length}/${MAX_IMAGENS}`;

    btnAnalisar.disabled =
        arquivosSelecionados.length === 0;
}


// ======================================================
// REDUZIR IMAGEM
// ======================================================

function reduzirImagem(arquivo) {

    return new Promise((resolve, reject) => {

        const imagem = new Image();

        const url =
            URL.createObjectURL(arquivo);

        imagem.onload = () => {

            URL.revokeObjectURL(url);

            let largura =
                imagem.naturalWidth;

            let altura =
                imagem.naturalHeight;

            const maiorLado =
                Math.max(largura, altura);


            if (maiorLado > MAX_LADO) {

                const escala =
                    MAX_LADO / maiorLado;

                largura =
                    Math.round(largura * escala);

                altura =
                    Math.round(altura * escala);
            }


            const canvas =
                document.createElement("canvas");

            canvas.width = largura;
            canvas.height = altura;


            const contexto =
                canvas.getContext("2d");

            if (!contexto) {

                reject(
                    new Error(
                        "Não foi possível processar a imagem."
                    )
                );

                return;
            }


            contexto.drawImage(
                imagem,
                0,
                0,
                largura,
                altura
            );


            canvas.toBlob(
                blob => {

                    if (!blob) {

                        reject(
                            new Error(
                                "Não foi possível converter a imagem."
                            )
                        );

                        return;
                    }


                    resolve(
                        new File(
                            [blob],
                            `print-${Date.now()}-${Math.random()
                                .toString(36)
                                .slice(2, 8)}.jpg`,
                            {
                                type: "image/jpeg"
                            }
                        )
                    );

                },
                "image/jpeg",
                QUALIDADE_JPEG
            );
        };


        imagem.onerror = () => {

            URL.revokeObjectURL(url);

            reject(
                new Error(
                    "Não foi possível carregar uma das imagens."
                )
            );
        };


        imagem.src = url;
    });
}


// ======================================================
// FILE → BASE64
// ======================================================

function arquivoParaBase64(arquivo) {

    return new Promise((resolve, reject) => {

        const leitor =
            new FileReader();

        leitor.onload = () => {

            const resultadoArquivo =
                leitor.result;

            if (
                typeof resultadoArquivo !== "string"
            ) {

                reject(
                    new Error(
                        "Não foi possível preparar a imagem."
                    )
                );

                return;
            }

            const base64 =
                resultadoArquivo.split(",")[1];

            resolve(base64);
        };


        leitor.onerror = () => {

            reject(
                new Error(
                    "Erro ao ler uma das imagens."
                )
            );
        };


        leitor.readAsDataURL(arquivo);
    });
}


// ======================================================
// ANALISAR
// ======================================================

btnAnalisar.addEventListener(
    "click",
    async () => {

        if (!arquivosSelecionados.length) {
            return;
        }

        btnAnalisar.disabled = true;

        btnAnalisar.innerHTML = `
            <span class="spinner"></span>
            Preparando...
        `;


        mostrarCarregamento(
            "Preparando os prints...",
            "Organizando as imagens para a análise."
        );


        try {

            const imagensProcessadas = [];


            for (
                let i = 0;
                i < arquivosSelecionados.length;
                i++
            ) {

                btnAnalisar.innerHTML = `
                    <span class="spinner"></span>
                    Preparando ${i + 1}/${arquivosSelecionados.length}...
                `;


                const imagem =
                    await reduzirImagem(
                        arquivosSelecionados[i]
                    );


                imagensProcessadas.push(imagem);
            }


            const imagensBase64 = [];


            for (const imagem of imagensProcessadas) {

                const base64 =
                    await arquivoParaBase64(imagem);

                imagensBase64.push({
                    mimeType: "image/jpeg",
                    data: base64
                });
            }


            btnAnalisar.innerHTML = `
                <span class="spinner"></span>
                Analisando conversa...
            `;


            mostrarCarregamento(
                "Analisando conversa...",
                "O CORNÔMETRO está reconstruindo a conversa e procurando contradições, padrões e pontos que merecem esclarecimento.",
                true
            );


            const resposta =
                await fetch(
                    "/api/analisar",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            imagens: imagensBase64
                        })
                    }
                );


            let json;

            try {

                json =
                    await resposta.json();

            } catch {

                throw new Error(
                    "A resposta da IA não pôde ser lida."
                );
            }


            if (!resposta.ok) {

                throw new Error(
                    json.erro ||
                    "Falha temporária na análise."
                );
            }


            if (!json.analise) {

                throw new Error(
                    "A IA não retornou uma análise."
                );
            }


            // ==================================================
            // IMPORTANTE:
            // O NOVO BACKEND RETORNA UM OBJETO JSON.
            // ==================================================

            mostrarResultado(json.analise);


            setTimeout(() => {

                resultado.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }, 200);


        } catch (erro) {

            console.error(
                "Erro CORNÔMETRO:",
                erro
            );

            mostrarErroAnalise();

        } finally {

            btnAnalisar.disabled =
                arquivosSelecionados.length === 0;

            btnAnalisar.innerHTML = `
                <span>🔍</span>
                Analisar conversa
            `;
        }
    }
);


// ======================================================
// CARREGAMENTO
// ======================================================

function mostrarCarregamento(
    titulo,
    texto,
    detalhado = false
) {

    resultado.innerHTML = `

        <div class="carregando">

            <div class="loader"></div>

            <span class="loading-badge">
                ✦ CORNÔMETRO AI
            </span>

            <h3>
                ${escaparHTML(titulo)}
            </h3>

            <p>
                ${escaparHTML(texto)}
            </p>

            ${
                detalhado
                    ? `
                        <div class="analise-detalhada">

                            <span class="ponto"></span>

                            <span>
                                Comparando mensagens,
                                horários, contexto,
                                respostas e contradições.
                            </span>

                        </div>
                    `
                    : ""
            }

        </div>
    `;
}


// ======================================================
// ERRO
// ======================================================

function mostrarErroAnalise() {

    resultado.innerHTML = `

        <div class="erro analise-erro">

            <div class="erro-icon">
                ✦
            </div>

            <span class="erro-tag">
                ANÁLISE TEMPORARIAMENTE INDISPONÍVEL
            </span>

            <h3>
                A IA encontrou uma dificuldade
            </h3>

            <p>
                Não foi possível concluir esta análise agora.
                Tente novamente.
            </p>

            <button
                type="button"
                class="btn-tentar"
                onclick="analisarNovamente()"
            >
                ✦ Tentar novamente
            </button>

        </div>
    `;
}


// ======================================================
// MOSTRAR RESULTADO
// ======================================================

function mostrarResultado(analise) {

    /*
        O backend agora retorna:

        {
            indice,
            titulo_indice,
            resumo,
            pontos: [],
            perguntas: [],
            proximo_passo,
            limitacoes
        }
    */

    const dados =
        normalizarAnalise(analise);


    const indice =
        dados.indice;


    const nivel =
        obterNivelIndice(indice);


    resultado.innerHTML = `

        <div class="resultado-premium">

            <!-- =========================================
                 HEADER
            ========================================== -->

            <div class="analise-header">

                <div class="analise-header-texto">

                    <span class="resultado-label">
                        ✦ ANÁLISE CONCLUÍDA
                    </span>

                    <h2>
                        O que o CORNÔMETRO encontrou
                    </h2>

                    <p>
                        A análise considera somente aquilo
                        que está visível nos prints enviados.
                    </p>

                </div>

                <div class="analise-status">

                    <span class="status-dot"></span>

                    ANÁLISE FINALIZADA

                </div>

            </div>


            <!-- =========================================
                 ÍNDICE
            ========================================== -->

            <div class="score-card">

                <div
                    class="score-ring"
                    style="--score:${indice}"
                >

                    <div class="score-ring-inner">

                        <span class="score-small">
                            ATENÇÃO
                        </span>

                        <strong>
                            ${indice}
                        </strong>

                        <span class="score-total">
                            /100
                        </span>

                    </div>

                </div>


                <div class="score-content">

                    <span class="score-label">
                        ÍNDICE DE ATENÇÃO
                    </span>

                    <h3>
                        ${escaparHTML(
                            analise.titulo_indice ||
                            nivel.titulo
                        )}
                    </h3>

                    <p>
                        ${escaparHTML(
                            nivel.descricao
                        )}
                    </p>

                    <div class="score-scale">

                        <span>0</span>

                        <div class="score-scale-line">

                            <div
                                class="score-scale-fill"
                                style="width:${indice}%"
                            ></div>

                        </div>

                        <span>100</span>

                    </div>

                    <small class="score-note">
                        Este índice mede pontos que merecem
                        esclarecimento. Não representa
                        probabilidade de traição.
                    </small>

                </div>

            </div>


            <!-- =========================================
                 RESUMO
            ========================================== -->

            ${criarResumoPremium(
                dados.resumo
            )}


            <!-- =========================================
                 PONTOS
            ========================================== -->

            <div class="secao-analise">

                <div class="secao-cabecalho">

                    <div class="secao-icone">
                        ✦
                    </div>

                    <div>

                        <span>
                            EVIDÊNCIAS
                        </span>

                        <h3>
                            Pontos encontrados
                        </h3>

                    </div>

                </div>

                <div class="timeline-analise">

                    ${
                        criarPontosPremium(
                            dados.pontos
                        )
                    }

                </div>

            </div>


            <!-- =========================================
                 PERGUNTAS
            ========================================== -->

            ${
                criarPerguntasPremium(
                    dados.perguntas
                )
            }


            <!-- =========================================
                 PRÓXIMO PASSO
            ========================================== -->

            ${
                dados.proximo_passo
                    ? `
                        <div class="orientacao-card proximo">

                            <div class="orientacao-icon">
                                →
                            </div>

                            <div class="orientacao-content">

                                <span>
                                    CORNÔMETRO
                                </span>

                                <h3>
                                    Próximo passo
                                </h3>

                                <small>
                                    Como continuar a conversa
                                </small>

                                <div class="orientacao-balao">

                                    ${formatarTexto(
                                        dados.proximo_passo
                                    )}

                                </div>

                            </div>

                        </div>
                    `
                    : ""
            }


            <!-- =========================================
                 LIMITAÇÕES
            ========================================== -->

            ${
                dados.limitacoes
                    ? `
                        <div class="indice-info-card">

                            <div class="indice-info-icon">
                                i
                            </div>

                            <div>

                                <span>
                                    LIMITAÇÕES
                                </span>

                                <h3>
                                    Sobre esta análise
                                </h3>

                                <p>
                                    ${escaparHTML(
                                        dados.limitacoes
                                    )}
                                </p>

                            </div>

                        </div>
                    `
                    : ""
            }


            <!-- =========================================
                 AVISO
            ========================================== -->

            <div class="aviso-premium">

                <div class="aviso-icon">
                    !
                </div>

                <div>

                    <strong>
                        Importante
                    </strong>

                    <p>
                        O CORNÔMETRO não confirma traição.
                        Ele identifica pontos visíveis que
                        podem merecer esclarecimento através
                        de uma conversa.
                    </p>

                </div>

            </div>

        </div>
    `;
}


// ======================================================
// NORMALIZAR NOVO JSON
// ======================================================

function normalizarAnalise(analise) {

    if (!analise) {

        return {
            indice: 0,
            titulo_indice: "",
            resumo: "",
            pontos: [],
            perguntas: [],
            proximo_passo: "",
            limitacoes: ""
        };
    }


    // Caso o backend tenha retornado string
    if (typeof analise === "string") {

        try {

            const convertido =
                JSON.parse(
                    analise
                        .replace(/^```json\s*/i, "")
                        .replace(/\s*```$/i, "")
                        .trim()
                );

            analise = convertido;

        } catch {

            return {
                indice: 0,
                titulo_indice: "",
                resumo: analise,
                pontos: [],
                perguntas: [],
                proximo_passo: "",
                limitacoes: ""
            };
        }
    }


    let indice =
        Number(analise.indice);


    if (!Number.isFinite(indice)) {
        indice = 0;
    }


    indice =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(indice)
            )
        );


    const pontos =
        Array.isArray(analise.pontos)
            ? analise.pontos
                .map(ponto => {

                    if (
                        typeof ponto === "string"
                    ) {

                        return {
                            tipo: "OUTRO",
                            titulo: "Ponto identificado",
                            evidencia: ponto,
                            contexto:
                                "Esse ponto apareceu na conversa e merece contexto.",
                            pergunta:
                                "Você pode me explicar melhor o que aconteceu nessa situação?",
                            observar:
                                "Observe se a explicação é clara e consistente."
                        };
                    }


                    return {

                        tipo:
                            String(
                                ponto?.tipo ||
                                "OUTRO"
                            ),

                        titulo:
                            String(
                                ponto?.titulo ||
                                "Ponto identificado"
                            ),

                        evidencia:
                            String(
                                ponto?.evidencia ||
                                ""
                            ),

                        contexto:
                            String(
                                ponto?.contexto ||
                                "Esse ponto merece esclarecimento dentro do contexto da conversa."
                            ),

                        pergunta:
                            String(
                                ponto?.pergunta ||
                                "Você pode me explicar melhor o que aconteceu nessa situação?"
                            ),

                        observar:
                            String(
                                ponto?.observar ||
                                "Observe se a resposta é clara, específica e consistente."
                            )
                    };

                })
                .filter(ponto =>
                    ponto.evidencia ||
                    ponto.titulo
                )
                .slice(0, 6)
            : [];


    const perguntas =
        Array.isArray(analise.perguntas)
            ? analise.perguntas
                .filter(Boolean)
                .map(String)
                .slice(0, 8)
            : [];


    return {

        indice,

        titulo_indice:
            String(
                analise.titulo_indice ||
                ""
            ),

        resumo:
            String(
                analise.resumo ||
                "A análise foi concluída."
            ),

        pontos,

        perguntas,

        proximo_passo:
            String(
                analise.proximo_passo ||
                ""
            ),

        limitacoes:
            String(
                analise.limitacoes ||
                "A análise considera somente o conteúdo visível nos prints."
            )
    };
}


// ======================================================
// RESUMO
// ======================================================

function criarResumoPremium(texto) {

    if (!texto) {

        texto =
            "Não foi possível gerar um resumo detalhado.";
    }


    return `

        <div class="resumo-premium">

            <div class="resumo-topo">

                <div class="resumo-icon">
                    ◉
                </div>

                <div>

                    <span>
                        VISÃO GERAL
                    </span>

                    <h3>
                        Resumo da conversa
                    </h3>

                </div>

            </div>

            <div class="resumo-balao">

                ${formatarTexto(texto)}

            </div>

        </div>
    `;
}


// ======================================================
// PONTOS
// ======================================================

function criarPontosPremium(pontos) {

    if (!pontos || !pontos.length) {

        return `

            <div class="sem-pontos">

                <div class="sem-pontos-icon">
                    ✓
                </div>

                <h3>
                    Nenhum ponto específico encontrado
                </h3>

                <p>
                    Os prints não apresentaram elementos
                    suficientes para criar pontos individuais
                    de atenção.
                </p>

            </div>
        `;
    }


    return pontos
        .map(
            (ponto, index) =>
                criarPontoPremium(
                    ponto,
                    index
                )
        )
        .join("");
}


// ======================================================
// CARD / BALÕES
// ======================================================

function criarPontoPremium(
    ponto,
    index
) {

    const contradicao =
        ponto.tipo === "CONTRADIÇÃO";


    return `

        <article
            class="finding-card ${contradicao ? "finding-contradicao" : ""}"
        >

            <div class="timeline-marker">

                <span>
                    ${String(index + 1).padStart(2, "0")}
                </span>

            </div>


            <div class="finding-content">

                <!-- CABEÇALHO -->

                <div class="finding-header">

                    <div>

                        <span
                            class="finding-tag ${
                                contradicao
                                    ? "contradicao"
                                    : ""
                            }"
                        >

                            ${
                                contradicao
                                    ? "⚠"
                                    : "✦"
                            }

                            ${escaparHTML(
                                ponto.tipo
                            )}

                        </span>

                        <h3>
                            ${escaparHTML(
                                ponto.titulo
                            )}
                        </h3>

                    </div>

                </div>


                <!-- BALÃO 1 -->

                <div class="chat-bubble evidence-bubble">

                    <div class="bubble-header">

                        <span class="bubble-avatar">
                            🔎
                        </span>

                        <span>
                            O QUE FOI ENCONTRADO
                        </span>

                    </div>

                    <p>
                        ${escaparHTML(
                            ponto.evidencia
                        )}
                    </p>

                </div>


                <!-- BALÃO 2 -->

                <div class="chat-bubble context-bubble">

                    <div class="bubble-header">

                        <span class="bubble-avatar">
                            💡
                        </span>

                        <span>
                            POR QUE CHAMOU ATENÇÃO
                        </span>

                    </div>

                    <p>
                        ${escaparHTML(
                            ponto.contexto
                        )}
                    </p>

                </div>


                <!-- BALÃO 3 -->

                <div class="chat-bubble question-bubble">

                    <div class="bubble-header">

                        <span class="bubble-avatar">
                            💬
                        </span>

                        <span>
                            PERGUNTA SUGERIDA
                        </span>

                    </div>

                    <p class="question-text">
                        “${escaparHTML(
                            ponto.pergunta
                        )}”
                    </p>

                    <button
                        type="button"
                        class="copy-question"
                        onclick="copiarTexto(this)"
                    >
                        <span>⧉</span>
                        Copiar pergunta
                    </button>

                </div>


                <!-- BALÃO 4 -->

                <div class="observe-bubble">

                    <div class="observe-icon">
                        👁
                    </div>

                    <div>

                        <span>
                            O QUE OBSERVAR
                        </span>

                        <p>
                            ${escaparHTML(
                                ponto.observar
                            )}
                        </p>

                    </div>

                </div>

            </div>

        </article>
    `;
}


// ======================================================
// PERGUNTAS
// ======================================================

function criarPerguntasPremium(perguntas) {

    if (
        !perguntas ||
        !perguntas.length
    ) {

        return "";
    }


    return `

        <div class="perguntas-premium">

            <div class="perguntas-header">

                <div class="perguntas-icon">
                    ?
                </div>

                <div>

                    <span>
                        CONVERSA
                    </span>

                    <h3>
                        Perguntas para esclarecer
                    </h3>

                    <p>
                        Perguntas baseadas diretamente
                        nos pontos encontrados.
                    </p>

                </div>

            </div>


            <div class="perguntas-stack">

                ${perguntas
                    .map(
                        (pergunta, index) => `

                            <div class="pergunta-moderna">

                                <div class="pergunta-numero">
                                    ${String(
                                        index + 1
                                    ).padStart(2, "0")}
                                </div>

                                <div class="pergunta-balao">

                                    <span>
                                        PERGUNTA ${index + 1}
                                    </span>

                                    <p class="question-text">
                                        ${escaparHTML(
                                            pergunta
                                        )}
                                    </p>

                                    <button
                                        type="button"
                                        class="copy-question"
                                        onclick="copiarTexto(this)"
                                    >
                                        <span>⧉</span>
                                        Copiar pergunta
                                    </button>

                                </div>

                            </div>
                        `
                    )
                    .join("")
                }

            </div>

        </div>
    `;
}


// ======================================================
// ÍNDICE
// ======================================================

function obterNivelIndice(indice) {

    if (indice <= 20) {

        return {
            titulo:
                "Poucos pontos de atenção",

            descricao:
                "Os prints apresentam poucos elementos concretos que precisam de esclarecimento."
        };
    }


    if (indice <= 40) {

        return {
            titulo:
                "Alguns pontos chamam atenção",

            descricao:
                "Existem alguns pontos que podem valer uma conversa mais clara."
        };
    }


    if (indice <= 60) {

        return {
            titulo:
                "Vários pontos para esclarecer",

            descricao:
                "A conversa apresenta diferentes elementos que merecem contexto."
        };
    }


    if (indice <= 80) {

        return {
            titulo:
                "Atenção elevada",

            descricao:
                "Há vários pontos relevantes que justificam uma conversa direta e cuidadosa."
        };
    }


    return {
        titulo:
            "Muitos pontos para esclarecer",

        descricao:
            "Os prints apresentam diversos elementos relevantes que precisam ser esclarecidos."
    };
}


// ======================================================
// COPIAR
// ======================================================

async function copiarTexto(elemento) {

    const container =
        elemento.closest(
            ".pergunta-balao, .question-bubble"
        );


    if (!container) return;


    const textoElemento =
        container.querySelector(
            ".question-text"
        );


    if (!textoElemento) return;


    let texto =
        textoElemento.textContent
            .trim()
            .replace(/^“/, "")
            .replace(/”$/, "")
            .trim();


    if (!texto) return;


    try {

        await navigator.clipboard.writeText(
            texto
        );


        const original =
            elemento.innerHTML;


        elemento.innerHTML =
            "<span>✓</span> Copiado";


        elemento.classList.add("copiado");


        setTimeout(() => {

            elemento.innerHTML =
                original;

            elemento.classList.remove(
                "copiado"
            );

        }, 1400);


    } catch (erro) {

        console.warn(
            "Não foi possível copiar.",
            erro
        );
    }
}


// ======================================================
// TENTAR NOVAMENTE
// ======================================================

function analisarNovamente() {

    if (!arquivosSelecionados.length) {
        return;
    }

    btnAnalisar.click();
}


// ======================================================
// ESCAPAR HTML
// ======================================================

function escaparHTML(texto) {

    const div =
        document.createElement("div");

    div.textContent =
        texto == null
            ? ""
            : String(texto);

    return div.innerHTML;
}


// ======================================================
// FORMATAR TEXTO
// ======================================================

function formatarTexto(texto) {

    return escaparHTML(texto)
        .split(/\n+/)
        .filter(
            linha =>
                linha.trim()
        )
        .map(
            linha =>
                `<p>${linha}</p>`
        )
        .join("");
}


// ======================================================
// INICIALIZAÇÃO
// ======================================================

atualizarPreview();
