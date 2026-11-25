function desenharCarrinho() {
    const itens = obterCarrinho();
    document.getElementById("carrinhoVazio").hidden = itens.length > 0;
    document.getElementById("carrinhoCheio").hidden = itens.length === 0;
    if (itens.length === 0) return;

    const lista = document.getElementById("itensCarrinho");
    lista.innerHTML = "";
    itens.forEach(item => {
        const linha = document.createElement("div");
        linha.className = "item-carrinho";
        linha.innerHTML = `
            <img class="item-foto" src="${escaparHtml(item.imagem)}" alt="" loading="lazy">
            <div class="item-info">
                <h3>${escaparHtml(item.nome)}</h3>
                <small>${formatarMoeda(item.preco)} cada</small><br>
                <button class="remover" type="button" data-remover>Remover</button>
            </div>
            <div class="quantidade">
                <button type="button" data-menos aria-label="Diminuir">−</button>
                <input type="text" value="${item.quantidade}" maxlength="2" data-mascara="numero" aria-label="Quantidade">
                <button type="button" data-mais aria-label="Aumentar">+</button>
            </div>
            <div class="item-total">${formatarMoeda(item.preco * item.quantidade)}</div>`;

        linha.querySelector("[data-menos]").addEventListener("click", () => alterarQuantidade(item.id, item.quantidade - 1));
        linha.querySelector("[data-mais]").addEventListener("click", () => alterarQuantidade(item.id, item.quantidade + 1));
        linha.querySelector("input").addEventListener("change", e => alterarQuantidade(item.id, parseInt(e.target.value) || 0));
        linha.querySelector("[data-remover]").addEventListener("click", () => alterarQuantidade(item.id, 0));
        lista.appendChild(linha);
    });
    aplicarMascaras(lista);
    desenharResumo(itens);
}

function desenharResumo(itens) {
    const { subtotal, taxa, total } = calcularTotais(itens);
    document.getElementById("valorSubtotal").textContent = formatarMoeda(subtotal);
    document.getElementById("valorTaxa").textContent = taxa === 0 ? "Grátis" : formatarMoeda(taxa);
    document.getElementById("valorTotal").textContent = formatarMoeda(total);

    const falta = FRETE_GRATIS_ACIMA - subtotal;
    document.getElementById("barraFrete").style.width = Math.min(subtotal / FRETE_GRATIS_ACIMA * 100, 100) + "%";
    document.getElementById("textoFrete").textContent = falta > 0
        ? `Faltam ${formatarMoeda(falta)} para ganhar frete grátis.`
        : "Você ganhou frete grátis!";
}

function alterarQuantidade(id, quantidade) {
    let itens = obterCarrinho();
    if (quantidade <= 0) {
        itens = itens.filter(i => i.id !== id);
    } else {
        itens.find(i => i.id === id).quantidade = Math.min(quantidade, 50);
    }
    salvarCarrinho(itens);
    desenharCarrinho();
}

function preencherEndereco() {
    const usuario = obterUsuario();
    const campo = document.getElementById("enderecoEntrega");
    if (!usuario || campo.value || !usuario.endereco) return;

    const partes = [
        `${usuario.endereco}, ${usuario.numero || "s/n"}`,
        usuario.complemento,
        usuario.bairro,
        usuario.cidade && usuario.estado ? `${usuario.cidade}/${usuario.estado}` : usuario.cidade,
        usuario.cep ? "CEP " + usuario.cep : ""
    ];
    campo.value = partes.filter(Boolean).join(" - ");
    campo.dispatchEvent(new Event("input"));
}

async function finalizarPedido(evento) {
    evento.preventDefault();
    const form = evento.target;
    const erroGeral = document.getElementById("erroCheckout");
    erroGeral.hidden = true;

    if (!estaLogado()) {
        mostrarToast("Entre na sua conta para finalizar o pedido.");
        abrirLogin();
        return;
    }

    const endereco = form.enderecoEntrega.value.trim();
    marcarErro(form.enderecoEntrega, endereco.length < 10 ? "Informe o endereço completo." : "");
    if (endereco.length < 10) { form.enderecoEntrega.focus(); return; }

    const pagamento = form.pagamento.value;
    let observacao = form.observacao.value.trim();

    if (pagamento === "Dinheiro" && form.troco.value) {
        const troco = Number(somenteNumeros(form.troco.value)) / 100;
        const { total } = calcularTotais(obterCarrinho());
        if (troco < total) {
            marcarErro(form.troco, "O troco deve ser maior que o total do pedido.");
            return;
        }
        marcarErro(form.troco, "");
        observacao = `Troco para ${formatarMoeda(troco)}. ${observacao}`.trim().slice(0, 200);
    }

    const botao = document.getElementById("botaoFinalizar");
    botao.disabled = true;
    botao.textContent = "Enviando pedido...";

    try {
        const pedido = await api("pedidos", "POST", {
            formaPagamento: pagamento,
            enderecoEntrega: endereco,
            observacao,
            itens: obterCarrinho().map(i => ({ produtoId: i.id, quantidade: i.quantidade }))
        });
        salvarCarrinho([]);
        mostrarToast(`Pedido #${pedido.id} recebido.`, "sucesso");
        setTimeout(() => location.href = "pedidos.html?novo=" + pedido.id, 900);
    } catch (erro) {
        erroGeral.textContent = erro.message;
        erroGeral.hidden = false;
        botao.disabled = false;
        botao.textContent = "Finalizar pedido";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    desenharCarrinho();
    preencherEndereco();

    document.getElementById("formCheckout").addEventListener("submit", finalizarPedido);
    document.getElementById("limparCarrinho").addEventListener("click", () => {
        if (confirm("Deseja remover todos os itens do carrinho?")) {
            salvarCarrinho([]);
            desenharCarrinho();
        }
    });

    document.querySelectorAll("input[name=pagamento]").forEach(opcao =>
        opcao.addEventListener("change", () =>
            document.getElementById("campoTroco").hidden = opcao.value !== "Dinheiro" || !opcao.checked));

    document.addEventListener("sessao-alterada", preencherEndereco);
});
