const ETAPAS = ["Recebido", "Em preparo", "Saiu para entrega", "Entregue"];
let pedidos = [];

async function carregarPedidos() {
    const area = document.getElementById("areaPedidos");
    if (!exigirLogin(area)) return;

    try {
        pedidos = await api("pedidos");
        filtrarPedidos();
    } catch (erro) {
        document.getElementById("listaPedidos").innerHTML = `<p class="vazio">${escaparHtml(erro.message)}</p>`;
    }
}

function filtrarPedidos() {
    const termo = normalizar(document.getElementById("buscaPedido").value).replace("#", "");
    const status = document.getElementById("filtroStatus").value;

    const filtrados = pedidos.filter(p => {
        if (status && p.status !== status) return false;
        if (!termo) return true;
        return String(p.id) === termo || p.itens.some(i => normalizar(i.nomeProduto).includes(termo));
    });

    document.getElementById("resumoPedidos").textContent =
        `${filtrados.length} de ${pedidos.length} pedido(s)`;
    desenharPedidos(filtrados);
}

function linhaDoTempo(status) {
    if (status === "Cancelado") return "";
    const atual = ETAPAS.indexOf(status);
    return `<div class="linha-tempo">${ETAPAS.map((etapa, i) =>
        `<div class="etapa ${i <= atual ? "feita" : ""} ${i === atual ? "atual" : ""}">${etapa}</div>`).join("")}</div>`;
}

function desenharPedidos(lista) {
    const area = document.getElementById("listaPedidos");
    const novo = Number(new URLSearchParams(location.search).get("novo"));

    if (lista.length === 0) {
        area.innerHTML = pedidos.length === 0
            ? `<div class="vazio cartao">
                   ${icone("sacola", "vazio-icone")}
                   <h2>Você ainda não fez pedidos</h2>
                   <p style="margin-top:16px"><a href="produtos.html" class="botao botao-primario">Fazer meu primeiro pedido</a></p>
               </div>`
            : `<div class="vazio">${icone("lupa", "vazio-icone")}<p>Nenhum pedido encontrado com esse filtro.</p></div>`;
        return;
    }

    area.innerHTML = "";
    lista.forEach(pedido => {
        const cartao = document.createElement("article");
        cartao.className = "cartao";
        if (pedido.id === novo) cartao.style.borderColor = "var(--sucesso)";

        cartao.innerHTML = `
            <div class="pedido-topo">
                <div>
                    <h3>Pedido #${pedido.id} ${pedido.id === novo ? "🆕" : ""}</h3>
                    <small>${formatarDataHora(pedido.dataPedido)}</small>
                </div>
                <span class="${classeStatus(pedido.status)}">${escaparHtml(pedido.status)}</span>
            </div>
            ${linhaDoTempo(pedido.status)}
            <ul class="pedido-itens">
                ${pedido.itens.map(i => `
                    <li><span>${i.quantidade}× ${escaparHtml(i.nomeProduto)}</span>
                        <span>${formatarMoeda(i.precoUnitario * i.quantidade)}</span></li>`).join("")}
            </ul>
            <div class="pedido-detalhes">
                <span>Entregar em: ${escaparHtml(pedido.enderecoEntrega)}</span>
                <span>Pagamento: ${escaparHtml(pedido.formaPagamento)}. Entrega ${pedido.taxaEntrega === 0 ? "grátis" : formatarMoeda(pedido.taxaEntrega)}</span>
                ${pedido.observacao ? `<span>Observação: ${escaparHtml(pedido.observacao)}</span>` : ""}
            </div>
            <div class="pedido-rodape">
                <span class="total">Total: ${formatarMoeda(pedido.total)}</span>
                <div class="acoes" style="display:flex; gap:8px; flex-wrap:wrap">
                    ${pedido.status === "Recebido" ? '<button class="botao botao-perigo botao-pequeno" data-cancelar>Cancelar</button>' : ""}
                    <button class="botao botao-contorno botao-pequeno" data-repetir>Pedir de novo</button>
                </div>
            </div>`;

        cartao.querySelector("[data-cancelar]")?.addEventListener("click", () => cancelarPedido(pedido.id));
        cartao.querySelector("[data-repetir]").addEventListener("click", () => repetirPedido(pedido));
        area.appendChild(cartao);
    });
}

async function cancelarPedido(id) {
    if (!confirm(`Deseja cancelar o pedido #${id}?`)) return;
    try {
        await api(`pedidos/${id}/cancelar`, "PUT");
        mostrarToast(`Pedido #${id} cancelado.`);
        carregarPedidos();
    } catch (erro) {
        mostrarToast(erro.message, "erro");
    }
}

async function repetirPedido(pedido) {
    try {
        const produtos = await api("produtos");
        let adicionados = 0;
        pedido.itens.forEach(item => {
            const produto = produtos.find(p => p.id === item.produtoId);
            if (produto) {
                adicionarAoCarrinho(produto, item.quantidade);
                adicionados++;
            }
        });
        if (adicionados === 0) return mostrarToast("Esses produtos não estão mais disponíveis.", "erro");
        location.href = "carrinho.html";
    } catch (erro) {
        mostrarToast(erro.message, "erro");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("buscaPedido").addEventListener("input", filtrarPedidos);
    document.getElementById("filtroStatus").addEventListener("change", filtrarPedidos);
    carregarPedidos();
    document.addEventListener("sessao-alterada", () => location.reload());
});
