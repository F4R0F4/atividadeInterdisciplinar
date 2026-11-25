async function carregarDestaques() {
    const area = document.getElementById("destaques");
    try {
        const produtos = await api("produtos?destaques=true");
        area.innerHTML = "";
        produtos.slice(0, 4).forEach(p => area.appendChild(criarCartaoProduto(p)));
        if (produtos.length === 0) area.innerHTML = '<p class="vazio">Nenhum destaque no momento.</p>';
    } catch (erro) {
        area.innerHTML = `<p class="vazio">${escaparHtml(erro.message)}</p>`;
    }
}

document.addEventListener("DOMContentLoaded", carregarDestaques);
