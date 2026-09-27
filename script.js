const inputImagens = document.getElementById("inputImagens");
const areaUpload = document.getElementById("areaUpload");
const preview = document.getElementById("preview");
const contador = document.getElementById("contador");
const btnAnalisar = document.getElementById("btnAnalisar");
const resultado = document.getElementById("resultado");
const statusIA = document.getElementById("statusIA");

let arquivosSelecionados = [];


// ======================================================
// CONFIGURAÇÕES
// ======================================================

const MAX_IMAGENS = 3;
const MAX_LADO = 1280;
const QUALIDADE_JPEG = 0.68;


// ======================================================
// STATUS DA IA
// ======================================================

async function verificarServidor() {

    if (!statusIA) return;

    try {

        const resposta = await fetch(
            "/api/status",
            {
                method: "GET",
                cache: "no-store"
            }
        );

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

        console.warn("Status da IA:", erro);

        statusIA.textContent = "IA PRONTA";
        statusIA.classList.add("online");
    }
}

verificarServidor();


// ======================================================
// ABRIR SELETOR
// ======================================================

areaUpload.addEventListener(
    "click",
    () => inputImagens.click()
);


// ======================================================
// SELECIONAR IMAGENS
// ======================================================

inputImagens.addEventListener(
    "change",
    () => {

        const imagens =
            Array.from(inputImagens.files);

        adicionarImagens(imagens);

        inputImagens.value = "";
    }
);


// ======================================================
// DRAG AND DROP
// ======================================================

areaUpload.addEventListener(
    "dragover",
    evento => {

        evento.preventDefault();

        areaUpload.classList.add("dragging");
    }
);


areaUpload.addEventListener(
    "dragleave",
    () => {

        areaUpload.classList.remove("dragging");
    }
);


areaUpload.addEventListener(
    "drop",
    evento => {

        evento.preventDefault();

        areaUpload.classList.remove("dragging");

        const imagens =
            Array.from(
                evento.dataTransfer.files
            );

        adicionarImagens(imagens);
    }
);


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
            arquivosSelecionados.length >=
            MAX_IMAGENS
        ) {
            break;
        }

        const jaExiste =
            arquivosSelecionados.some(
                arquivo =>
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

    arquivosSelecionados.forEach(
        (arquivo, index) => {

            const container =
                document.createElement("div");

            container.className =
                "imagem-preview";


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

            numero.textContent =
                `${index + 1}`;

            numero.className =
                "numero-imagem";


            const remover =
                document.createElement("button");

            remover.type = "button";
            remover.textContent = "×";
            remover.className = "remover-imagem";
            remover.title = "Remover imagem";


            remover.addEventListener(
                "click",
                evento => {

                    evento.preventDefault();
                    evento.stopPropagation();

                    arquivosSelecionados.splice(
                        index,
                        1
                    );

                    atualizarPreview();
                }
            );


            container.appendChild(img);
            container.appendChild(numero);
            container.appendChild(remover);

            preview.appendChild(container);
        }
    );


    contador.textContent =
        `${arquivosSelecionados.length}/${MAX_IMAGENS}`;

    btnAnalisar.disabled =
        arquivosSelecionados.length === 0;
}


// ======================================================
// REDUZIR IMAGEM
// ======================================================

function reduzirImagem(arquivo) {

    return new Promise(
        (resolve, reject) => {

            const imagem =
                new Image();

            const url =
                URL.createObjectURL(arquivo);


            imagem.onload = () => {

                URL.revokeObjectURL(url);

                let largura =
                    imagem.naturalWidth;

                let altura =
                    imagem.naturalHeight;


                const maiorLado =
                    Math.max(
                        largura,
                        altura
                    );


                if (
                    maiorLado > MAX_LADO
                ) {

                    const escala =
                        MAX_LADO /
                        maiorLado;

                    largura =
                        Math.round(
                            largura * escala
                        );

                    altura =
                        Math.round(
                            altura * escala
                        );
                }


                const canvas =
                    document.createElement(
                        "canvas"
                    );

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
        }
    );
}


// ======================================================
// FILE → BASE64
// ======================================================

function arquivoParaBase64(arquivo) {

    return new Promise(
        (resolve, reject) => {

            const leitor =
                new FileReader();


            leitor.onload = () => {

                const resultadoArquivo =
                    leitor.result;


                if (
                    typeof resultadoArquivo !==
                    "string"
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
        }
    );
}


// ======================================================
// ANALISAR
// ======================================================

btnAnalisar.addEventListener(
    "click",
    async () => {

        if (
            arquivosSelecionados.length === 0
        ) {
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


            // ==================================================
            // PROCESSAR IMAGENS
            // ==================================================

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


            // ==================================================
            // BASE64
            // ==================================================

            btnAnalisar.innerHTML = `
                <span class="spinner"></span>
                Preparando análise...
            `;


            const imagensBase64 = [];


            for (
                let i = 0;
                i < imagensProcessadas.length;
                i++
            ) {

                const base64 =
                    await arquivoParaBase64(
                        imagensProcessadas[i]
                    );


                imagensBase64.push({

                    mimeType:
                        "image/jpeg",

                    data:
                        base64
                });
            }


            // ==================================================
            // ANALISANDO
            // ==================================================

            btnAnalisar.innerHTML = `
                <span class="spinner"></span>
                Analisando conversa...
            `;


            mostrarCarregamento(
                "Analisando conversa...",
                "O CORNÔMETRO está reconstruindo o contexto, comparando mensagens e procurando pontos que merecem esclarecimento.",
                true
            );


            // ==================================================
            // API
            // ==================================================

            const resposta =
                await fetch(
                    "/api/analisar",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                imagens:
                                    imagensBase64
                            })
                    }
                );


            let json;


            try {

                json =
                    await resposta.json();

            } catch {

                throw new Error(
                    "Falha temporária na análise."
                );
            }


            if (!resposta.ok) {

                throw new Error(
                    json.erro ||
                    "Falha temporária na análise."
                );
            }


            if (
                !json.analise
            ) {

                throw new Error(
                    "A IA não conseguiu concluir a análise."
                );
            }


            mostrarResultado(
                json.analise
            );


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
                ?
                `
                    <div class="analise-detalhada">

                        <span class="ponto"></span>

                        <span>
                            Comparando mensagens, horários,
                            respostas, contexto e possíveis
                            contradições.
                        </span>

                    </div>
                `
                :
                ""
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
                Tente novamente para que a IA possa analisar
                seus prints corretamente.
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

function mostrarResultado(texto) {

    const dados =
        processarResposta(texto);


    const indice =
        dados.indice === "—"
            ? 0
            : Number(dados.indice);


    const nivel =
        obterNivelIndice(indice);


    resultado.innerHTML = `

        <div class="resultado-premium">

            <!-- =========================================
                 TOPO
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
                        A análise considera apenas o conteúdo
                        visível nos prints enviados.
                    </p>

                </div>

                <div class="analise-status">
                    <span class="status-dot"></span>
                    ANÁLISE FINALIZADA
                </div>

            </div>


            <!-- =========================================
                 ÍNDICE 0-100
            ========================================== -->

            <div class="score-card">

                <div
                    class="score-ring"
                    style="--score: ${indice}"
                >

                    <div class="score-ring-inner">

                        <span class="score-small">
                            ÍNDICE
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
                        NÍVEL DE ATENÇÃO
                    </span>

                    <h3>
                        ${escaparHTML(nivel.titulo)}
                    </h3>

                    <p>
                        ${escaparHTML(nivel.descricao)}
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

                </div>

            </div>


            <!-- =========================================
                 RESUMO
            ========================================== -->

            ${criarResumoPremium(dados.resumo)}


            <!-- =========================================
                 FATOS
            ========================================== -->

            ${
                dados.fatos.length
                    ? criarFatosPremium(dados.fatos)
                    : ""
            }


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
                            ANÁLISE
                        </span>

                        <h3>
                            Pontos que merecem atenção
                        </h3>

                    </div>

                </div>


                <div class="timeline-analise">

                    ${criarPontosPremium(dados)}

                </div>

            </div>


            <!-- =========================================
                 POSSIBILIDADES
            ========================================== -->

            ${
                dados.oQuePodeEstarAcontecendo
                    ? criarPossibilidades(
                        dados.oQuePodeEstarAcontecendo
                    )
                    : ""
            }


            <!-- =========================================
                 PERGUNTAS
            ========================================== -->

            ${criarPerguntasPremium(dados.perguntas)}


            <!-- =========================================
                 COMO ABORDAR
            ========================================== -->

            ${
                dados.comoAbordar
                    ? criarOrientacaoPremium(
                        "↗",
                        "Como abordar",
                        "Uma forma mais natural de conversar sobre isso.",
                        dados.comoAbordar,
                        "abordar"
                    )
                    : ""
            }


            <!-- =========================================
                 OBSERVAR
            ========================================== -->

            ${
                dados.oQueObservar
                    ? criarOrientacaoPremium(
                        "◉",
                        "O que observar",
                        "O mais importante é a consistência da explicação.",
                        dados.oQueObservar,
                        "observar"
                    )
                    : ""
            }


            <!-- =========================================
                 PRÓXIMO PASSO
            ========================================== -->

            ${
                dados.proximoPasso
                    ? criarOrientacaoPremium(
                        "→",
                        "Próximo passo",
                        "Depois da análise, evite tirar conclusões precipitadas.",
                        dados.proximoPasso,
                        "proximo"
                    )
                    : ""
            }


            <!-- =========================================
                 EXPLICAÇÃO DO ÍNDICE
            ========================================== -->

            <div class="indice-info-card">

                <div class="indice-info-icon">
                    %
                </div>

                <div>

                    <span>
                        SOBRE O ÍNDICE
                    </span>

                    <h3>
                        Como interpretar o 0–100
                    </h3>

                    <p>
                        ${
                            escaparHTML(
                                dados.explicacaoIndice ||
                                "O índice representa a intensidade e a quantidade de pontos que merecem esclarecimento dentro do material analisado. Ele não representa uma probabilidade de traição."
                            )
                        }
                    </p>

                </div>

            </div>


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
                        O índice não confirma traição.
                        Ele serve para destacar situações,
                        contradições e padrões de comunicação
                        que podem valer uma conversa mais clara.
                    </p>

                </div>

            </div>

        </div>
    `;
}


// ======================================================
// RESUMO PREMIUM
// ======================================================

function criarResumoPremium(texto) {

    if (!texto) {

        texto =
            "A análise não encontrou informações suficientes para gerar um resumo detalhado.";
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
// FATOS
// ======================================================

function criarFatosPremium(lista) {

    return `

        <div class="fatos-card">

            <div class="fatos-header">

                <div class="fatos-icon">
                    ✓
                </div>

                <div>

                    <span>
                        BASE DA ANÁLISE
                    </span>

                    <h3>
                        O que apareceu nos prints
                    </h3>

                </div>

            </div>


            <div class="fatos-grid">

                ${lista
                    .map(
                        (item, index) => `

                            <div class="fato-item">

                                <div class="fato-numero">
                                    ${String(index + 1).padStart(2, "0")}
                                </div>

                                <p>
                                    ${escaparHTML(item)}
                                </p>

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
// PONTOS PREMIUM
// ======================================================

function criarPontosPremium(dados) {

    const pontos = [];

    const atencao =
        dados.pontosAtencao || [];

    const contradicoes =
        dados.contradicoes || [];


    atencao.forEach(
        item => {

            pontos.push({

                tipo: "PONTO DE ATENÇÃO",

                titulo:
                    resumirTitulo(item),

                evidencia:
                    item,

                contexto:
                    dados.contexto ||
                    "Esse ponto precisa ser analisado dentro do contexto completo da conversa.",

                pergunta:
                    gerarPerguntaAutomatica(item),

                observar:
                    dados.oQueObservar ||
                    "Observe se a explicação é clara, específica e consistente com o restante da conversa."
            });
        }
    );


    contradicoes.forEach(
        item => {

            pontos.push({

                tipo: "CONTRADIÇÃO",

                titulo:
                    resumirTitulo(item),

                evidencia:
                    item,

                contexto:
                    "Existe uma diferença entre informações apresentadas na conversa que merece esclarecimento.",

                pergunta:
                    gerarPerguntaContradicao(item),

                observar:
                    "Observe se a pessoa consegue explicar a diferença de forma direta e consistente."
            });
        }
    );


    if (!pontos.length) {

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
        .slice(0, 8)
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
// CARD INDIVIDUAL
// ======================================================

function criarPontoPremium(
    ponto,
    index
) {

    const contradicao =
        ponto.tipo === "CONTRADIÇÃO";


    return `

        <article class="finding-card">

            <div class="timeline-marker">

                <span>
                    ${String(index + 1).padStart(2, "0")}
                </span>

            </div>


            <div class="finding-content">

                <div class="finding-header">

                    <div>

                        <span class="finding-tag ${contradicao ? "contradicao" : ""}">
                            ${contradicao ? "⚠" : "✦"}
                            ${escaparHTML(ponto.tipo)}
                        </span>

                        <h3>
                            ${escaparHTML(ponto.titulo)}
                        </h3>

                    </div>

                    <span class="finding-number">
                        ${String(index + 1).padStart(2, "0")}
                    </span>

                </div>


                <!-- EVIDÊNCIA -->

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
                        ${escaparHTML(ponto.evidencia)}
                    </p>

                </div>


                <!-- CONTEXTO -->

                <div class="chat-bubble context-bubble">

                    <div class="bubble-header">

                        <span class="bubble-avatar">
                            ◌
                        </span>

                        <span>
                            POR QUE ISSO CHAMOU ATENÇÃO
                        </span>

                    </div>

                    <p>
                        ${escaparHTML(ponto.contexto)}
                    </p>

                </div>


                <!-- PERGUNTA -->

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
                        “${escaparHTML(ponto.pergunta)}”
                    </p>

                    <button
                        type="button"
                        class="copy-question"
                        onclick="copiarTexto(this)"
                    >
                        <span>↗</span>
                        Copiar pergunta
                    </button>

                </div>


                <!-- OBSERVAR -->

                <div class="observe-bubble">

                    <div class="observe-icon">
                        👁
                    </div>

                    <div>

                        <span>
                            O QUE OBSERVAR
                        </span>

                        <p>
                            ${escaparHTML(ponto.observar)}
                        </p>

                    </div>

                </div>

            </div>

        </article>
    `;
}


// ======================================================
// POSSIBILIDADES
// ======================================================

function criarPossibilidades(texto) {

    return `

        <div class="possibilidades-card">

            <div class="possibilidades-header">

                <div class="possibilidades-icon">
                    ⌁
                </div>

                <div>

                    <span>
                        INTERPRETAÇÃO
                    </span>

                    <h3>
                        O que pode estar acontecendo
                    </h3>

                </div>

            </div>


            <div class="possibilidades-balao">

                ${formatarTexto(texto)}

            </div>


            <div class="possibilidades-nota">

                <span>
                    ℹ
                </span>

                <p>
                    Uma mesma situação pode ter mais de uma
                    explicação. Por isso, o contexto e a conversa
                    são importantes antes de tirar conclusões.
                </p>

            </div>

        </div>
    `;
}


// ======================================================
// PERGUNTAS PREMIUM
// ======================================================

function criarPerguntasPremium(perguntas) {

    if (!perguntas || !perguntas.length) {

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
                        Perguntas que realmente fazem sentido
                    </h3>

                    <p>
                        Use as perguntas como ponto de partida,
                        sem transformar a conversa em interrogatório.
                    </p>

                </div>

            </div>


            <div class="perguntas-stack">

                ${perguntas
                    .slice(0, 8)
                    .map(
                        (pergunta, index) => `

                            <div class="pergunta-moderna">

                                <div class="pergunta-numero">
                                    ${String(index + 1).padStart(2, "0")}
                                </div>

                                <div class="pergunta-balao">

                                    <span>
                                        PERGUNTA
                                    </span>

                                    <p>
                                        ${escaparHTML(pergunta)}
                                    </p>

                                    <button
                                        type="button"
                                        class="copy-question"
                                        onclick="copiarTexto(this)"
                                    >
                                        <span>↗</span>
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
// ORIENTAÇÃO
// ======================================================

function criarOrientacaoPremium(
    icone,
    titulo,
    subtitulo,
    texto,
    classe
) {

    return `

        <div class="orientacao-card ${classe}">

            <div class="orientacao-icon">
                ${icone}
            </div>

            <div class="orientacao-content">

                <span>
                    CORNÔMETRO
                </span>

                <h3>
                    ${escaparHTML(titulo)}
                </h3>

                <small>
                    ${escaparHTML(subtitulo)}
                </small>

                <div class="orientacao-balao">

                    ${formatarTexto(texto)}

                </div>

            </div>

        </div>
    `;
}


// ======================================================
// NÍVEL DO ÍNDICE
// ======================================================

function obterNivelIndice(indice) {

    if (indice <= 20) {

        return {

            titulo:
                "Poucos pontos de atenção",

            descricao:
                "Os prints apresentam poucos elementos que precisam de esclarecimento."
        };
    }


    if (indice <= 40) {

        return {

            titulo:
                "Atenção moderada",

            descricao:
                "Existem alguns pontos que podem valer uma conversa mais clara."
        };
    }


    if (indice <= 60) {

        return {

            titulo:
                "Vários pontos para esclarecer",

            descricao:
                "A conversa apresenta diferentes elementos que merecem contexto antes de qualquer conclusão."
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
            "Os prints apresentam diversos elementos relevantes que precisam ser esclarecidos e contextualizados."
    };
}


// ======================================================
// TÍTULO AUTOMÁTICO
// ======================================================

function resumirTitulo(texto) {

    const palavras =
        String(texto || "")
            .trim()
            .split(/\s+/);


    if (palavras.length <= 8) {

        return texto;
    }


    return palavras
        .slice(0, 9)
        .join(" ") + "...";
}


// ======================================================
// PERGUNTA AUTOMÁTICA
// ======================================================

function gerarPerguntaAutomatica(texto) {

    const original =
        String(texto || "")
            .replace(/\s+/g, " ")
            .trim();


    if (!original) {

        return "Você pode me explicar melhor o que aconteceu nessa situação?";
    }


    return `Você pode me explicar melhor essa situação: ${original}`;
}


// ======================================================
// PERGUNTA PARA CONTRADIÇÃO
// ======================================================

function gerarPerguntaContradicao(texto) {

    const original =
        String(texto || "")
            .replace(/\s+/g, " ")
            .trim();


    if (!original) {

        return "Pode me explicar essa diferença entre as duas informações?";
    }


    return `Quero entender melhor essa diferença: ${original}. Você pode me explicar o que aconteceu?`;
}


// ======================================================
// PROCESSAR RESPOSTA
// ======================================================

function processarResposta(texto) {

    const resultado = {

        resumo: "",
        contexto: "",
        fatos: [],
        pontosAtencao: [],
        oQuePodeEstarAcontecendo: "",
        contradicoes: [],
        padroes: "",
        perguntas: [],
        comoAbordar: "",
        oQueObservar: "",
        proximoPasso: "",
        indice: "—",
        explicacaoIndice: "",
        limitacoes: ""
    };


    const textoLimpo =
        String(texto || "")
            .replace(/\r/g, "")
            .trim();


    // ==================================================
    // SUPORTE A JSON
    // ==================================================

    const possivelJSON =
        textoLimpo
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();


    if (
        possivelJSON.startsWith("{") &&
        possivelJSON.endsWith("}")
    ) {

        try {

            const json =
                JSON.parse(possivelJSON);


            if (json.resumo) {

                resultado.resumo =
                    String(json.resumo);
            }


            if (json.contexto) {

                resultado.contexto =
                    String(json.contexto);
            }


            if (Array.isArray(json.fatos)) {

                resultado.fatos =
                    json.fatos.map(String);
            }


            if (Array.isArray(json.pontos)) {

                resultado.pontosAtencao =
                    json.pontos
                        .map(ponto => {

                            if (
                                typeof ponto ===
                                "string"
                            ) {

                                return ponto;
                            }

                            return (
                                ponto.evidencia ||
                                ponto.titulo ||
                                ponto.descricao ||
                                ""
                            );
                        })
                        .filter(Boolean);
            }


            if (
                Array.isArray(
                    json.contradicoes
                )
            ) {

                resultado.contradicoes =
                    json.contradicoes.map(String);
            }


            if (json.possibilidades) {

                resultado.oQuePodeEstarAcontecendo =
                    String(
                        json.possibilidades
                    );
            }


            if (json.como_abordar) {

                resultado.comoAbordar =
                    String(
                        json.como_abordar
                    );
            }


            if (json.comoAbordar) {

                resultado.comoAbordar =
                    String(
                        json.comoAbordar
                    );
            }


            if (json.oQueObservar) {

                resultado.oQueObservar =
                    String(
                        json.oQueObservar
                    );
            }


            if (json.proximoPasso) {

                resultado.proximoPasso =
                    String(
                        json.proximoPasso
                    );
            }


            if (json.explicacaoIndice) {

                resultado.explicacaoIndice =
                    String(
                        json.explicacaoIndice
                    );
            }


            if (Array.isArray(json.perguntas)) {

                resultado.perguntas =
                    json.perguntas.map(String);
            }


            if (
                json.indice !== undefined
            ) {

                const numero =
                    Number(json.indice);


                if (
                    Number.isFinite(numero)
                ) {

                    resultado.indice =
                        Math.min(
                            100,
                            Math.max(
                                0,
                                Math.round(numero)
                            )
                        );
                }
            }


            if (
                resultado.resumo ||
                resultado.fatos.length ||
                resultado.pontosAtencao.length
            ) {

                return resultado;
            }

        } catch (erro) {

            console.warn(
                "Resposta não era JSON válido. Usando parser de texto.",
                erro
            );
        }
    }


    // ==================================================
    // PARSER ANTIGO
    // ==================================================

    resultado.resumo =
        extrairSecao(
            textoLimpo,
            "RESUMO:",
            "CONTEXTO:"
        ).trim();


    resultado.contexto =
        extrairSecao(
            textoLimpo,
            "CONTEXTO:",
            "FATOS OBSERVADOS:"
        ).trim();


    resultado.fatos =
        transformarLista(
            extrairSecao(
                textoLimpo,
                "FATOS OBSERVADOS:",
                "PONTOS DE ATENÇÃO:"
            )
        );


    resultado.pontosAtencao =
        transformarLista(
            extrairSecao(
                textoLimpo,
                "PONTOS DE ATENÇÃO:",
                "O QUE PODE ESTAR ACONTECENDO:"
            )
        );


    resultado.oQuePodeEstarAcontecendo =
        extrairSecao(
            textoLimpo,
            "O QUE PODE ESTAR ACONTECENDO:",
            "PERGUNTAS PARA FAZER:"
        ).trim();


    resultado.perguntas =
        transformarLista(
            extrairSecao(
                textoLimpo,
                "PERGUNTAS PARA FAZER:",
                "COMO ABORDAR:"
            )
        );


    resultado.comoAbordar =
        extrairSecao(
            textoLimpo,
            "COMO ABORDAR:",
            "O QUE OBSERVAR NA RESPOSTA:"
        ).trim();


    resultado.oQueObservar =
        extrairSecao(
            textoLimpo,
            "O QUE OBSERVAR NA RESPOSTA:",
            "PRÓXIMO PASSO:"
        ).trim();


    resultado.proximoPasso =
        extrairSecao(
            textoLimpo,
            "PRÓXIMO PASSO:",
            "INDICE:"
        ).trim();


    const indice =
        extrairSecao(
            textoLimpo,
            "INDICE:",
            "LIMITAÇÕES:"
        );


    const numero =
        indice.match(/\d+/);


    if (numero) {

        resultado.indice =
            Math.min(
                100,
                Math.max(
                    0,
                    parseInt(
                        numero[0],
                        10
                    )
                )
            );
    }


    resultado.explicacaoIndice =
        extrairSecao(
            textoLimpo,
            "EXPLICAÇÃO DO INDICE:",
            "PERGUNTAS PARA ESCLARECER:"
        ).trim();


    resultado.contradicoes =
        transformarLista(
            extrairSecao(
                textoLimpo,
                "CONTRADIÇÕES:",
                "PADRÕES DE COMUNICAÇÃO:"
            )
        );


    resultado.padroes =
        extrairSecao(
            textoLimpo,
            "PADRÕES DE COMUNICAÇÃO:",
            "INTERPRETAÇÕES POSSÍVEIS:"
        ).trim();


    const perguntasAlternativas =
        extrairSecao(
            textoLimpo,
            "PERGUNTAS:",
            "COMO AGIR:"
        );


    if (
        !resultado.perguntas.length &&
        perguntasAlternativas
    ) {

        resultado.perguntas =
            transformarLista(
                perguntasAlternativas
            );
    }


    const comoAgir =
        extrairSecao(
            textoLimpo,
            "COMO AGIR:",
            "LIMITAÇÕES:"
        );


    if (
        !resultado.comoAbordar &&
        comoAgir
    ) {

        resultado.comoAbordar =
            comoAgir.trim();
    }


    resultado.limitacoes =
        extrairSecao(
            textoLimpo,
            "LIMITAÇÕES:",
            "FIM:"
        ).trim();


    if (
        !resultado.resumo &&
        !resultado.contexto
    ) {

        resultado.resumo =
            textoLimpo;
    }


    return resultado;
}


// ======================================================
// TRANSFORMAR LISTA
// ======================================================

function transformarLista(texto) {

    if (!texto) {
        return [];
    }


    return texto
        .split("\n")
        .map(
            linha =>
                linha
                    .replace(
                        /^\s*[-•*]\s*/,
                        ""
                    )
                    .replace(
                        /^\s*\d+[.)]\s*/,
                        ""
                    )
                    .trim()
        )
        .filter(Boolean);
}


// ======================================================
// EXTRAIR SEÇÃO
// ======================================================

function extrairSecao(
    texto,
    inicio,
    fim
) {

    const textoMaiusculo =
        texto.toUpperCase();

    const inicioMaiusculo =
        inicio.toUpperCase();

    const fimMaiusculo =
        fim.toUpperCase();


    const posicaoInicio =
        textoMaiusculo.indexOf(
            inicioMaiusculo
        );


    if (
        posicaoInicio === -1
    ) {

        return "";
    }


    const inicioConteudo =
        posicaoInicio +
        inicio.length;


    const posicaoFim =
        textoMaiusculo.indexOf(
            fimMaiusculo,
            inicioConteudo
        );


    if (
        posicaoFim === -1
    ) {

        return texto.substring(
            inicioConteudo
        );
    }


    return texto.substring(
        inicioConteudo,
        posicaoFim
    );
}


// ======================================================
// COPIAR PERGUNTA
// ======================================================

async function copiarTexto(
    elemento
) {

    const container =
        elemento.closest(
            ".pergunta-balao, .question-bubble"
        );


    let texto = "";


    if (container) {

        const elementoTexto =
            container.querySelector(
                ".question-text, p"
            );


        texto =
            elementoTexto
                ?.textContent
                ?.trim() || "";
    }


    texto =
        texto
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


        elemento.classList.add(
            "copiado"
        );


        setTimeout(
            () => {

                elemento.innerHTML =
                    original;

                elemento.classList.remove(
                    "copiado"
                );

            },
            1400
        );


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

    if (
        arquivosSelecionados.length === 0
    ) {

        resultado.innerHTML = `

            <div class="resultado-vazio">

                <div class="resultado-vazio-icon">
                    ✦
                </div>

                <h3>
                    Pronto para analisar
                </h3>

                <p>
                    Envie até 3 prints da conversa
                    para começar.
                </p>

            </div>
        `;

        return;
    }


    resultado.innerHTML = `

        <div class="carregando">

            <div class="loader"></div>

            <span class="loading-badge">
                ✦ NOVA TENTATIVA
            </span>

            <h3>
                Preparando nova análise...
            </h3>

            <p>
                O CORNÔMETRO vai analisar
                os prints novamente.
            </p>

        </div>
    `;


    btnAnalisar.click();


    setTimeout(
        () => {

            window.scrollTo({
                top:
                    resultado.offsetTop - 100,
                behavior: "smooth"
            });

        },
        100
    );
}


// ======================================================
// ESCAPAR HTML
// ======================================================

function escaparHTML(texto) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        texto || "";


    return div.innerHTML;
}


// ======================================================
// FORMATAR TEXTO
// ======================================================

function formatarTexto(texto) {

    return escaparHTML(texto)
        .split("\n")
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
