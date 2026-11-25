const TAXA_ENTREGA = 7.90;

const ICONES = {
    lua: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    fechar: '<path d="M6 6l12 12M18 6 6 18"/>',
    cadeado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    sacola: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    lupa: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>'
};

function icone(nome, classe = "icone") {
    return `<svg class="${classe}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[nome]}</svg>`;
}
const FRETE_GRATIS_ACIMA = 120;

async function api(caminho, metodo = "GET", corpo = null) {
    const opcoes = { method: metodo, headers: { "Content-Type": "application/json" } };
    const token = obterToken();
    if (token) opcoes.headers.Authorization = "Bearer " + token;
    if (corpo) opcoes.body = JSON.stringify(corpo);

    let resposta;
    try {
        resposta = await fetch("/api/" + caminho, opcoes);
    } catch {
        throw new Error("Não foi possível conectar ao servidor. Ele está rodando?");
    }

    const dados = await resposta.json().catch(() => null);
    if (resposta.status === 401 && token) limparSessao();
    if (!resposta.ok) throw new Error(dados?.mensagem || "Erro inesperado. Tente novamente.");
    return dados;
}

function obterToken() { return localStorage.getItem("expresso_token"); }

function obterUsuario() {
    try { return JSON.parse(localStorage.getItem("expresso_usuario")); } catch { return null; }
}

function estaLogado() { return Boolean(obterToken()); }

function salvarSessao(token, usuario) {
    if (token) localStorage.setItem("expresso_token", token);
    localStorage.setItem("expresso_usuario", JSON.stringify(usuario));
    atualizarCabecalho();
    document.dispatchEvent(new CustomEvent("sessao-alterada"));
}

function limparSessao() {
    localStorage.removeItem("expresso_token");
    localStorage.removeItem("expresso_usuario");
    atualizarCabecalho();
}

async function sair() {
    try { await api("usuarios/logout", "POST"); } catch {  }
    limparSessao();
    mostrarToast("Você saiu da sua conta.");
    setTimeout(() => window.location.href = "index.html", 600);
}

function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDataHora(texto) {
    const [data, hora = ""] = String(texto).split(" ");
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano} às ${hora.slice(0, 5)}`;
}

function escaparHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

function normalizar(texto) {
    return String(texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function classeStatus(status) {
    return "status status-" + normalizar(status).replace(/\s+/g, "-");
}

function mostrarToast(mensagem, tipo = "") {
    let area = document.querySelector(".toasts");
    if (!area) {
        area = document.createElement("div");
        area.className = "toasts";
        area.setAttribute("aria-live", "polite");
        document.body.appendChild(area);
    }
    const toast = document.createElement("div");
    toast.className = "toast" + (tipo ? " toast-" + tipo : "");
    toast.textContent = mensagem;
    area.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function exigirLogin(container) {
    if (estaLogado()) return true;
    if (container) {
        container.innerHTML = `
            <div class="vazio cartao">
                ${icone("cadeado", "vazio-icone")}
                <h2>Entre na sua conta</h2>
                <p>Você precisa estar logado para ver esta página.</p>
                <p style="margin-top:16px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap">
                    <button class="botao botao-primario" data-abrir-login>Entrar</button>
                    <a class="botao botao-contorno" href="cadastro.html">Criar conta</a>
                </p>
            </div>`;
    }
    abrirLogin();
    return false;
}

function aplicarTema(tema, salvar = false) {
    document.documentElement.dataset.tema = tema;
    if (salvar) localStorage.setItem("expresso_tema", tema);
    const botao = document.getElementById("temaBotao");
    if (botao) {
        botao.innerHTML = icone(tema === "escuro" ? "sol" : "lua");
        botao.title = tema === "escuro" ? "Ativar modo claro" : "Ativar modo escuro";
    }
}

function iniciarTema() {
    aplicarTema(document.documentElement.dataset.tema || "claro");
    document.getElementById("temaBotao")?.addEventListener("click", () => {
        const atual = document.documentElement.dataset.tema;
        aplicarTema(atual === "escuro" ? "claro" : "escuro", true);
    });
}

function iniciarMenu() {
    const botao = document.getElementById("menuBotao");
    const menu = document.getElementById("menu");
    botao?.addEventListener("click", () => {
        const aberto = menu.classList.toggle("aberto");
        botao.setAttribute("aria-expanded", aberto);
        botao.innerHTML = icone(aberto ? "fechar" : "menu");
    });

    const pagina = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".menu > a").forEach(link => {
        if (link.getAttribute("href") === pagina) link.classList.add("ativo");
    });

    const termo = new URLSearchParams(location.search).get("busca");
    const buscaTopo = document.querySelector(".busca-topo input");
    if (termo && buscaTopo) buscaTopo.value = termo;
}

function atualizarCabecalho() {
    const usuario = obterUsuario();
    const logado = estaLogado() && usuario;
    document.querySelectorAll("[data-visitante]").forEach(el => el.hidden = Boolean(logado));
    document.querySelectorAll("[data-logado]").forEach(el => el.hidden = !logado);
    document.querySelectorAll("[data-nome-usuario]").forEach(el => {
        el.textContent = logado ? usuario.nome.split(" ")[0] : "";
    });
}

function obterCarrinho() {
    try { return JSON.parse(localStorage.getItem("expresso_carrinho")) || []; } catch { return []; }
}

function salvarCarrinho(itens) {
    localStorage.setItem("expresso_carrinho", JSON.stringify(itens));
    atualizarContadorCarrinho();
}

function adicionarAoCarrinho(produto, quantidade = 1) {
    const itens = obterCarrinho();
    const existente = itens.find(i => i.id === produto.id);
    if (existente) {
        existente.quantidade = Math.min(existente.quantidade + quantidade, 50);
    } else {
        itens.push({ id: produto.id, nome: produto.nome, preco: produto.preco, imagem: produto.imagem, quantidade });
    }
    salvarCarrinho(itens);
    mostrarToast(`${produto.nome} adicionado ao carrinho.`, "sucesso");
}

function totalItensCarrinho() {
    return obterCarrinho().reduce((soma, item) => soma + item.quantidade, 0);
}

function atualizarContadorCarrinho() {
    const total = totalItensCarrinho();
    document.querySelectorAll("[data-contador]").forEach(el => el.textContent = total);
}

function calcularTotais(itens) {
    const subtotal = itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
    const taxa = subtotal === 0 || subtotal >= FRETE_GRATIS_ACIMA ? 0 : TAXA_ENTREGA;
    return { subtotal, taxa, total: subtotal + taxa };
}

function criarModalLogin() {
    const fundo = document.createElement("div");
    fundo.className = "modal-fundo";
    fundo.id = "modalLogin";
    fundo.hidden = true;
    fundo.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="tituloLogin">
            <button class="modal-fechar" type="button" aria-label="Fechar" data-fechar-login>${icone("fechar")}</button>
            <h2 id="tituloLogin">Entrar</h2>
            <p class="subtitulo">Acesse sua conta para pedir seu sushi.</p>
            <form class="formulario" id="formLogin" novalidate>
                <div class="campo">
                    <label for="loginEmail">E-mail</label>
                    <input type="email" id="loginEmail" name="email" maxlength="100" autocomplete="email" required>
                </div>
                <div class="campo">
                    <label for="loginSenha">Senha</label>
                    <input type="password" id="loginSenha" name="senha" minlength="6" maxlength="20" autocomplete="current-password" required>
                </div>
                <div class="alerta alerta-erro" id="erroLogin" hidden></div>
                <button class="botao botao-primario botao-bloco" type="submit">Entrar</button>
            </form>
            <p class="modal-rodape">Ainda não tem conta? <a href="cadastro.html">Cadastre-se</a></p>
        </div>`;
    document.body.appendChild(fundo);

    fundo.addEventListener("click", evento => {
        if (evento.target === fundo || evento.target.closest("[data-fechar-login]")) fecharLogin();
    });

    fundo.querySelector("#formLogin").addEventListener("submit", async evento => {
        evento.preventDefault();
        const form = evento.target;
        const erro = document.getElementById("erroLogin");
        const botao = form.querySelector("button[type=submit]");

        if (!emailValido(form.email.value) || form.senha.value.length < 6) {
            erro.textContent = "Informe um e-mail válido e a senha (mínimo 6 caracteres).";
            erro.hidden = false;
            return;
        }

        botao.disabled = true;
        botao.textContent = "Entrando...";
        try {
            const resposta = await api("usuarios/login", "POST", { email: form.email.value, senha: form.senha.value });
            salvarSessao(resposta.token, resposta.usuario);
            fecharLogin();
            form.reset();
            mostrarToast(`Bem-vindo(a), ${resposta.usuario.nome.split(" ")[0]}!`, "sucesso");
        } catch (e) {
            erro.textContent = e.message;
            erro.hidden = false;
        } finally {
            botao.disabled = false;
            botao.textContent = "Entrar";
        }
    });
}

function abrirLogin() {
    const modal = document.getElementById("modalLogin");
    if (!modal) return;
    document.getElementById("erroLogin").hidden = true;
    modal.hidden = false;
    setTimeout(() => document.getElementById("loginEmail").focus(), 50);
}

function fecharLogin() {
    const modal = document.getElementById("modalLogin");
    if (modal) modal.hidden = true;
}

document.addEventListener("DOMContentLoaded", () => {
    iniciarTema();
    iniciarMenu();
    criarModalLogin();
    atualizarCabecalho();
    atualizarContadorCarrinho();
    if (typeof aplicarMascaras === "function") aplicarMascaras();

    document.addEventListener("click", evento => {
        if (evento.target.closest("[data-abrir-login]")) abrirLogin();
        if (evento.target.closest("[data-sair]")) sair();
    });
    document.addEventListener("keydown", evento => {
        if (evento.key === "Escape") fecharLogin();
    });

    if (new URLSearchParams(location.search).has("login") && !estaLogado()) abrirLogin();
});

function criarCartaoProduto(produto) {
    const cartao = document.createElement("article");
    cartao.className = "produto";
    cartao.innerHTML = `
        <div class="produto-imagem">
            <img src="${escaparHtml(produto.imagem)}" alt="${escaparHtml(produto.nome)}" loading="lazy" width="900" height="675">
            ${produto.destaque ? '<span class="produto-selo">Mais pedido</span>' : ""}
        </div>
        <div class="produto-corpo">
            <span class="produto-categoria">${escaparHtml(produto.categoria)}</span>
            <h3>${escaparHtml(produto.nome)}</h3>
            <p>${escaparHtml(produto.descricao)}</p>
            <div class="produto-rodape">
                <span class="preco">${formatarMoeda(produto.preco)}</span>
                <div class="quantidade">
                    <button type="button" data-menos aria-label="Diminuir quantidade">−</button>
                    <input type="text" value="1" maxlength="2" data-mascara="numero" aria-label="Quantidade">
                    <button type="button" data-mais aria-label="Aumentar quantidade">+</button>
                </div>
            </div>
            <button class="botao botao-primario botao-bloco" type="button" data-adicionar>Adicionar ao carrinho</button>
        </div>`;

    const campoQtd = cartao.querySelector("input");
    const lerQtd = () => Math.min(Math.max(parseInt(campoQtd.value) || 1, 1), 50);
    cartao.querySelector("[data-menos]").addEventListener("click", () => campoQtd.value = Math.max(lerQtd() - 1, 1));
    cartao.querySelector("[data-mais]").addEventListener("click", () => campoQtd.value = Math.min(lerQtd() + 1, 50));
    campoQtd.addEventListener("blur", () => campoQtd.value = lerQtd());
    cartao.querySelector("[data-adicionar]").addEventListener("click", () => {
        adicionarAoCarrinho(produto, lerQtd());
        campoQtd.value = 1;
    });

    aplicarMascaras(cartao);
    return cartao;
}
