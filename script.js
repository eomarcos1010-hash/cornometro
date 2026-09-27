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


        resultado.innerHTML = `
            <div class="carregando">

                <div class="loader"></div>

                <h3>
                    Preparando os prints...
                </h3>

                <p>
                    Organizando as imagens para a análise.
                </p>

            </div>
        `;


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


            resultado.innerHTML = `
                <div class="carregando">

                    <div class="loader"></div>

                    <h3>
                        Analisando conversa...
                    </h3>

                    <p>
                        O CORNÔMETRO está lendo os prints,
                        reconstruindo o contexto e procurando
                        pontos que merecem esclarecimento.
                    </p>

                    <div class="analise-detalhada">

                        <span class="ponto"></span>

                        <span>
                            Comparando mensagens, horários,
                            respostas e contexto.
                        </span>

                    </div>

                </div>
            `;


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
                !json.analise ||
                typeof json.analise !== "string"
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
// ERRO AMIGÁVEL
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


    resultado.innerHTML = `

        <div class="resultado-topo">

            <div class="resultado-titulo">

                <span class="resultado-label">
                    ✦ ANÁLISE CONCLUÍDA
                </span>

                <h2>
                    O que encontramos
                </h2>

                <p>
                    Análise baseada no conteúdo visível
                    dos prints enviados.
                </p>

            </div>


            <div class="indice-card">

                <span>
                    ÍNDICE
                </span>

                <strong>
                    ${escaparHTML(
                        String(dados.indice)
                    )}
                </strong>

                <small>
                    /100
                </small>

            </div>

        </div>


        ${criarCard(
            "◉",
            "Resumo",
            dados.resumo,
            "resumo"
        )}


        ${criarCardLista(
            "◎",
            "Fatos observados",
            dados.fatos
        )}


        ${criarCard(
            "◌",
            "Contexto",
            dados.contexto,
            "contexto"
        )}


        ${criarCardLista(
            "!",
            "Pontos de atenção",
            dados.pontosAtencao,
            "atencao"
        )}


        ${criarCard(
            "⌁",
            "O que pode estar acontecendo",
            dados.oQuePodeEstarAcontecendo,
            "possibilidades"
        )}


        ${criarCardLista(
            "?",
            "Contradições",
            dados.contradicoes,
            "contradicoes"
        )}


        ${criarCard(
            "◈",
            "Padrões de comunicação",
            dados.padroes,
            "padroes"
        )}


        <div class="analise-card perguntas-card">

            <div class="titulo-card">

                <div class="icone-card">
                    ?
                </div>

                <div>

                    <span>
                        PERGUNTAS
                    </span>

                    <h3>
                        Perguntas para esclarecer
                    </h3>

                </div>

            </div>


            <div class="perguntas-lista">

                ${
                    dados.perguntas.length

                    ?

                    dados.perguntas
                        .map(
                            (pergunta, index) => `

                                <div
                                    class="pergunta-balao"
                                >

                                    <div
                                        class="numero-pergunta"
                                    >
                                        ${index + 1}
                                    </div>

                                    <div
                                        class="pergunta-conteudo"
                                    >

                                        <p>
                                            ${escaparHTML(
                                                pergunta
                                            )}
                                        </p>

                                        <button
                                            type="button"
                                            onclick="copiarTexto(this)"
                                        >
                                            Copiar pergunta
                                        </button>

                                    </div>

                                </div>
                            `
                        )
                        .join("")

                    :

                    `
                        <div class="sem-dados">
                            Nenhuma pergunta específica
                            foi encontrada nos prints.
                        </div>
                    `
                }

            </div>

        </div>


        ${criarCard(
            "↗",
            "Como abordar",
            dados.comoAbordar,
            "abordar"
        )}


        ${criarCard(
            "◉",
            "O que observar na resposta",
            dados.oQueObservar,
            "observar"
        )}


        ${criarCard(
            "→",
            "Próximo passo",
            dados.proximoPasso,
            "proximo"
        )}


        <div class="indice-explicacao">

            <div class="titulo-card">

                <div class="icone-card">
                    %
                </div>

                <div>

                    <span>
                        ÍNDICE
                    </span>

                    <h3>
                        Como interpretar
                    </h3>

                </div>

            </div>

            <p>
                ${escaparHTML(
                    dados.explicacaoIndice ||
                    "O índice representa a intensidade dos pontos que merecem atenção no material analisado."
                )}
            </p>

        </div>


        <div class="aviso">

            <strong>
                Importante
            </strong>

            <span>
                O índice não é uma prova de infidelidade.
                Ele representa apenas os pontos que merecem
                atenção dentro dos prints analisados.
            </span>

        </div>

    `;
}


// ======================================================
// CRIAR CARD DE TEXTO
// ======================================================

function criarCard(
    icone,
    titulo,
    texto,
    classe = ""
) {

    if (!texto) {
        texto =
            "Não foi possível determinar isso a partir dos prints.";
    }


    return `

        <div class="analise-card ${classe}">

            <div class="titulo-card">

                <div class="icone-card">
                    ${icone}
                </div>

                <div>

                    <span>
                        CORNÔMETRO
                    </span>

                    <h3>
                        ${escaparHTML(titulo)}
                    </h3>

                </div>

            </div>


            <div class="texto-card">

                ${formatarTexto(texto)}

            </div>

        </div>
    `;
}


// ======================================================
// CRIAR CARD DE LISTA
// ======================================================

function criarCardLista(
    icone,
    titulo,
    lista,
    classe = ""
) {

    if (!lista || !lista.length) {

        return "";
    }


    return `

        <div class="analise-card ${classe}">

            <div class="titulo-card">

                <div class="icone-card">
                    ${icone}
                </div>

                <div>

                    <span>
                        CORNÔMETRO
                    </span>

                    <h3>
                        ${escaparHTML(titulo)}
                    </h3>

                </div>

            </div>


            <div class="lista-analise">

                ${lista
                    .map(
                        item => `

                            <div class="item-analise">

                                <span class="item-ponto">
                                    •
                                </span>

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
// FORMATAR TEXTO
// ======================================================

function formatarTexto(texto) {

    return escaparHTML(texto)
        .split("\n")
        .filter(linha => linha.trim())
        .map(
            linha =>
                `<p>${linha}</p>`
        )
        .join("");
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
            ".pergunta-balao"
        );


    const texto =
        container
            ?.querySelector("p")
            ?.textContent
            ?.trim();


    if (!texto) return;


    try {

        await navigator.clipboard.writeText(
            texto
        );


        const original =
            elemento.textContent;


        elemento.textContent =
            "✓ Copiado";


        elemento.classList.add(
            "copiado"
        );


        setTimeout(
            () => {

                elemento.textContent =
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

            <h3>
                Preparando nova análise...
            </h3>

            <p>
                O CORNÔMETRO vai tentar analisar
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
// INICIALIZAÇÃO
// ======================================================

atualizarPreview();
