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

// Mantemos as imagens menores para funcionar bem
// tanto no celular quanto no computador.
const MAX_LADO = 1280;

// Qualidade JPEG
const QUALIDADE_JPEG = 0.68;


// ======================================================
// STATUS DA IA
// ======================================================

async function verificarServidor() {

    if (!statusIA) {
        return;
    }

    try {

        const resposta = await fetch(
            "/api/status",
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!resposta.ok) {
            throw new Error("Servidor indisponível.");
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

        console.warn(
            "Status da IA:",
            erro
        );

        // Não bloqueia o aplicativo.
        // O endpoint de análise será responsável
        // por verificar a API quando o usuário analisar.

        statusIA.textContent = "IA PRONTA";
        statusIA.classList.add("online");
    }
}

verificarServidor();


// ======================================================
// ABRIR SELETOR DE IMAGENS
// ======================================================

areaUpload.addEventListener(
    "click",
    () => {

        inputImagens.click();

    }
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
    (evento) => {

        evento.preventDefault();

        areaUpload.classList.add(
            "dragging"
        );

    }
);


areaUpload.addEventListener(
    "dragleave",
    () => {

        areaUpload.classList.remove(
            "dragging"
        );

    }
);


areaUpload.addEventListener(
    "drop",
    (evento) => {

        evento.preventDefault();

        areaUpload.classList.remove(
            "dragging"
        );

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


        // Evita adicionar exatamente o mesmo arquivo
        // várias vezes.
        const jaExiste =
            arquivosSelecionados.some(
                arquivo =>
                    arquivo.name === imagem.name &&
                    arquivo.size === imagem.size &&
                    arquivo.lastModified === imagem.lastModified
            );


        if (jaExiste) {
            continue;
        }


        arquivosSelecionados.push(
            imagem
        );

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
                URL.createObjectURL(
                    arquivo
                );

            img.src = url;

            img.alt =
                `Print ${index + 1}`;


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

            remover.textContent =
                "×";

            remover.className =
                "remover-imagem";

            remover.title =
                "Remover imagem";


            remover.addEventListener(
                "click",
                (evento) => {

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

            container.appendChild(
                numero
            );

            container.appendChild(
                remover
            );


            preview.appendChild(
                container
            );

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
                URL.createObjectURL(
                    arquivo
                );


            imagem.onload = () => {

                URL.revokeObjectURL(
                    url
                );


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


                canvas.width =
                    largura;

                canvas.height =
                    altura;


                const contexto =
                    canvas.getContext(
                        "2d"
                    );


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
                    (blob) => {

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
                                    type:
                                        "image/jpeg"
                                }
                            )
                        );

                    },
                    "image/jpeg",
                    QUALIDADE_JPEG
                );

            };


            imagem.onerror = () => {

                URL.revokeObjectURL(
                    url
                );


                reject(
                    new Error(
                        "Não foi possível carregar uma das imagens."
                    )
                );

            };


            imagem.src =
                url;

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

                const resultado =
                    leitor.result;


                if (
                    typeof resultado !==
                    "string"
                ) {

                    reject(
                        new Error(
                            "Não foi possível preparar a imagem."
                        )
                    );

                    return;
                }


                // Remove:
                // data:image/jpeg;base64,
                // deixando somente o Base64.

                const base64 =
                    resultado.split(
                        ","
                    )[1];


                resolve(
                    base64
                );

            };


            leitor.onerror = () => {

                reject(
                    new Error(
                        "Erro ao ler uma das imagens."
                    )
                );

            };


            leitor.readAsDataURL(
                arquivo
            );

        }
    );
}


// ======================================================
// ANALISAR CONVERSA
// ======================================================

btnAnalisar.addEventListener(
    "click",
    async () => {

        if (
            arquivosSelecionados.length === 0
        ) {

            return;

        }


        btnAnalisar.disabled =
            true;


        btnAnalisar.innerHTML = `
            <span class="spinner"></span>
            Preparando imagens...
        `;


        resultado.innerHTML = `
            <div class="carregando">

                <div class="loader"></div>

                <h3>
                    Preparando os prints...
                </h3>

                <p>
                    Reduzindo as imagens para
                    melhorar o desempenho da IA.
                </p>

            </div>
        `;


        try {

            const imagensProcessadas =
                [];


            // ==================================================
            // PROCESSAR CADA IMAGEM
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


                imagensProcessadas.push(
                    imagem
                );

            }


            // ==================================================
            // CONVERTER PARA BASE64
            // ==================================================

            btnAnalisar.innerHTML = `
                <span class="spinner"></span>
                Preparando análise...
            `;


            const imagensBase64 =
                [];


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
            // TELA DE ANÁLISE
            // ==================================================

            btnAnalisar.innerHTML = `
                <span class="spinner"></span>
                Analisando com IA...
            `;


            resultado.innerHTML = `
                <div class="carregando">

                    <div class="loader"></div>

                    <h3>
                        Analisando conversa...
                    </h3>

                    <p>
                        O CORNÔMETRO está fazendo uma
                        análise detalhada dos seus prints.
                    </p>

                    <div class="analise-detalhada">

                        <span class="ponto"></span>

                        <span>
                            A IA está lendo e comparando
                            cuidadosamente o conteúdo visível
                            das imagens.
                        </span>

                    </div>

                    <small>
                        Não feche esta janela enquanto
                        a análise estiver em andamento.
                    </small>

                </div>
            `;


            // ==================================================
            // ENVIAR PARA VERCEL
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

            } catch (erro) {

                throw new Error(
                    "O servidor retornou uma resposta inválida."
                );

            }


            // ==================================================
            // ERRO DA API
            // ==================================================

            if (!resposta.ok) {

                throw new Error(
                    json.erro ||
                    "Erro ao analisar as imagens."
                );

            }


            // ==================================================
            // VERIFICAR RESULTADO
            // ==================================================

            if (
                !json.analise ||
                typeof json.analise !==
                "string"
            ) {

                throw new Error(
                    "A IA não retornou uma análise."
                );

            }


            // ==================================================
            // MOSTRAR RESULTADO
            // ==================================================

            mostrarResultado(
                json.analise
            );


        } catch (erro) {

            console.error(
                "Erro CORNÔMETRO:",
                erro
            );


            resultado.innerHTML = `
                <div class="erro">

                    <div class="erro-icon">
                        !
                    </div>

                    <h3>
                        Não foi possível analisar
                    </h3>

                    <p>
                        ${escaparHTML(
                            erro.message ||
                            "Ocorreu um erro inesperado."
                        )}
                    </p>

                    <button
                        type="button"
                        onclick="analisarNovamente()"
                    >
                        Tentar novamente
                    </button>

                </div>
            `;

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
// MOSTRAR RESULTADO
// ======================================================

function mostrarResultado(texto) {

    const dados =
        processarResposta(
            texto
        );


    resultado.innerHTML = `

        <div class="resultado-header">

            <div>

                <span class="resultado-label">
                    ANÁLISE CONCLUÍDA
                </span>

                <h2>
                    Resultado da análise
                </h2>

            </div>


            <div class="indice">

                <span>
                    ÍNDICE
                </span>

                <strong>
                    ${escaparHTML(
                        String(
                            dados.indice
                        )
                    )}
                </strong>

                <small>
                    /100
                </small>

            </div>

        </div>


        <div class="card-resultado resumo">

            <div class="titulo-card">

                <span>
                    ◉
                </span>

                Resumo

            </div>

            <p>
                ${escaparHTML(
                    dados.resumo ||
                    "Não foi possível gerar um resumo."
                )}
            </p>

        </div>


        <div class="card-resultado">

            <div class="titulo-card">

                <span>
                    ⚠
                </span>

                Sinais encontrados

            </div>

            <ul>

                ${
                    dados.sinais.length
                    ?
                    dados.sinais
                        .map(
                            sinal => `
                                <li>
                                    ${escaparHTML(
                                        sinal
                                    )}
                                </li>
                            `
                        )
                        .join("")
                    :
                    `
                        <li>
                            Nenhum sinal específico
                            identificado nas imagens.
                        </li>
                    `
                }

            </ul>

        </div>


        <div class="card-resultado">

            <div class="titulo-card">

                <span>
                    ◌
                </span>

                Contexto

            </div>

            <p>

                ${escaparHTML(
                    dados.contexto ||
                    "Não foi possível determinar o contexto."
                )}

            </p>

        </div>


        <div class="card-resultado perguntas">

            <div class="titulo-card">

                <span>
                    💬
                </span>

                Perguntas para esclarecer

            </div>


            <div class="perguntas-lista">

                ${
                    dados.perguntas.length
                    ?
                    dados.perguntas
                        .map(
                            pergunta => `
                                <button
                                    type="button"
                                    class="pergunta"
                                    onclick="copiarTexto(this)"
                                >
                                    ${escaparHTML(
                                        pergunta
                                    )}
                                </button>
                            `
                        )
                        .join("")
                    :
                    `
                        <p>
                            Nenhuma pergunta específica
                            foi gerada.
                        </p>
                    `
                }

            </div>

        </div>


        <div class="card-resultado agir">

            <div class="titulo-card">

                <span>
                    💡
                </span>

                Como agir

            </div>

            <p>

                ${escaparHTML(
                    dados.comoAgir ||
                    "Considere o contexto completo e converse diretamente antes de tirar conclusões."
                )}

            </p>

        </div>


        <div class="aviso">

            <strong>
                Importante
            </strong>

            <span>
                O índice representa sinais identificados
                na conversa e não é uma prova de traição.
                Considere o contexto e converse diretamente
                antes de tirar conclusões.
            </span>

        </div>

    `;
}


// ======================================================
// PROCESSAR RESPOSTA DA IA
// ======================================================

function processarResposta(texto) {

    const resultado = {

        resumo: "",

        indice: "—",

        sinais: [],

        contexto: "",

        perguntas: [],

        comoAgir: ""

    };


    const textoLimpo =
        String(
            texto || ""
        )
        .replace(/\r/g, "")
        .trim();


    // ==================================================
    // RESUMO
    // ==================================================

    const resumo =
        extrairSecao(
            textoLimpo,
            "RESUMO:",
            "INDICE:"
        );


    // ==================================================
    // ÍNDICE
    // ==================================================

    const indice =
        extrairSecao(
            textoLimpo,
            "INDICE:",
            "SINAIS:"
        );


    // ==================================================
    // SINAIS
    // ==================================================

    const sinais =
        extrairSecao(
            textoLimpo,
            "SINAIS:",
            "CONTEXTO:"
        );


    // ==================================================
    // CONTEXTO
    // ==================================================

    const contexto =
        extrairSecao(
            textoLimpo,
            "CONTEXTO:",
            "PERGUNTAS:"
        );


    // ==================================================
    // PERGUNTAS
    // ==================================================

    const perguntas =
        extrairSecao(
            textoLimpo,
            "PERGUNTAS:",
            "COMO AGIR:"
        );


    // ==================================================
    // COMO AGIR
    // ==================================================

    const comoAgir =
        textoLimpo.split(
            "COMO AGIR:"
        )[1] || "";


    resultado.resumo =
        resumo.trim();


    // ==================================================
    // EXTRAIR NÚMERO
    // ==================================================

    const numero =
        indice.match(
            /\d+/
        );


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


    // ==================================================
    // SINAIS
    // ==================================================

    resultado.sinais =
        sinais
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


    // ==================================================
    // CONTEXTO
    // ==================================================

    resultado.contexto =
        contexto.trim();


    // ==================================================
    // PERGUNTAS
    // ==================================================

    resultado.perguntas =
        perguntas
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


    // ==================================================
    // COMO AGIR
    // ==================================================

    resultado.comoAgir =
        comoAgir.trim();


    // ==================================================
    // FALLBACK
    // ==================================================

    if (
        !resultado.resumo &&
        !resultado.contexto &&
        !resultado.comoAgir
    ) {

        resultado.resumo =
            textoLimpo;

    }


    return resultado;
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

    const texto =
        elemento.textContent.trim();


    try {

        await navigator.clipboard.writeText(
            texto
        );


        const original =
            elemento.textContent;


        elemento.textContent =
            "✓ Copiado!";


        setTimeout(
            () => {

                elemento.textContent =
                    original;

            },
            1200
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

    window.scrollTo({
        top: resultado.offsetTop - 100,
        behavior: "smooth"
    });
}


// ======================================================
// ESCAPAR HTML
// ======================================================

function escaparHTML(
    texto
) {

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