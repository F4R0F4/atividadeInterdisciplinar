let categoriaAtual = 0;
let produtosCarregados = [];
let temporizadorBusca;

async function carregarCategorias() {
    const area = document.getElementById("chipsCategorias");
    const categorias = await api("produtos/categorias");
    categorias.forEach(c => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip";
        chip.dataset.categoria = c.id;
        chip.textContent = c.nome;
        area.appendChild(chip);
    });
    marcarChip();
}

function marcarChip() {
    document.querySelectorAll(".chip").forEach(chip =>
        chip.classList.toggle("ativo", Number(chip.dataset.categoria) === categoriaAtual));
}

async function buscarProdutos() {
    const area = document.getElementById("listaProdutos");
    const termo = document.getElementById("campoBusca").value.trim();

    const parametros = new URLSearchParams();
    if (termo) parametros.set("busca", termo);
    if (categoriaAtual) parametros.set("categoria", categoriaAtual);

    history.replaceState(null, "", "produtos.html" + (parametros.toString() ? "?" + parametros : ""));

    try {
        produtosCarregados = await api("produtos?" + parametros);
        mostrarProdutos(termo);
    } catch (erro) {
        area.innerHTML = `<p class="vazio">${escaparHtml(erro.message)}</p>`;
    }
}

function mostrarProdutos(termo) {
    const area = document.getElementById("listaProdutos");
    const ordem = document.getElementById("ordenacao").value;
    const lista = [...produtosCarregados];

    if (ordem === "menor") lista.sort((a, b) => a.preco - b.preco);
    if (ordem === "maior") lista.sort((a, b) => b.preco - a.preco);
    if (ordem === "nome") lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    document.getElementById("resultadoBusca").textContent = termo
        ? `${lista.length} resultado(s) para "${termo}"`
        : `${lista.length} produto(s)`;

    area.innerHTML = "";
    if (lista.length === 0) {
        area.innerHTML = `
            <div class="vazio" style="grid-column:1/-1">
                ${icone("lupa", "vazio-icone")}
                <h2>Nada encontrado</h2>
                <p>Tente buscar por outro termo, como "salmão", "hot" ou "temaki".</p>
            </div>`;
        return;
    }
    lista.forEach(p => area.appendChild(criarCartaoProduto(p)));
}

document.addEventListener("DOMContentLoaded", async () => {
    const parametros = new URLSearchParams(location.search);
    const campoBusca = document.getElementById("campoBusca");
    campoBusca.value = parametros.get("busca") || "";
    categoriaAtual = Number(parametros.get("categoria")) || 0;

    try { await carregarCategorias(); } catch {  }
    buscarProdutos();

    campoBusca.addEventListener("input", () => {
        clearTimeout(temporizadorBusca);
        temporizadorBusca = setTimeout(buscarProdutos, 300);
    });

    document.querySelector(".busca-topo").addEventListener("submit", evento => {
        evento.preventDefault();
        campoBusca.value = evento.target.busca.value;
        buscarProdutos();
    });

    document.getElementById("ordenacao").addEventListener("change", () => mostrarProdutos(campoBusca.value.trim()));

    document.getElementById("chipsCategorias").addEventListener("click", evento => {
        const chip = evento.target.closest(".chip");
        if (!chip) return;
        categoriaAtual = Number(chip.dataset.categoria);
        marcarChip();
        buscarProdutos();
    });
});
