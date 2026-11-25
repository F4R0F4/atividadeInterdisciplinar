const CAMPOS_PERFIL = ["nome", "email", "cpf", "telefone", "dataNascimento", "cep", "endereco",
                       "numero", "complemento", "bairro", "cidade", "estado"];

function preencherPerfil(usuario) {
    const form = document.getElementById("formPerfil");
    CAMPOS_PERFIL.forEach(campo => form.elements[campo].value = usuario[campo] ?? "");
    form.cpf.readOnly = true;
    form.cpf.title = "O CPF não pode ser alterado.";

    document.getElementById("perfilNome").textContent = usuario.nome;
    document.getElementById("avatar").textContent = usuario.nome.trim()[0].toUpperCase();
    if (usuario.criadoEm) {
        const [ano, mes] = usuario.criadoEm.split("-");
        document.getElementById("perfilDesde").textContent = `Cliente desde ${mes}/${ano}`;
    }

    form.querySelectorAll("input, textarea").forEach(c => c.dispatchEvent(new Event("input")));
}

async function carregarPerfil() {
    if (!exigirLogin(document.getElementById("areaPerfil"))) return;

    try {
        const [usuario, pedidos] = await Promise.all([api("usuarios/me"), api("pedidos")]);
        salvarSessao(null, usuario);
        preencherPerfil(usuario);

        const validos = pedidos.filter(p => p.status !== "Cancelado");
        document.getElementById("totalPedidos").textContent = validos.length;
        document.getElementById("totalGasto").textContent =
            formatarMoeda(validos.reduce((soma, p) => soma + p.total, 0));
    } catch (erro) {
        mostrarToast(erro.message, "erro");
        if (!estaLogado()) location.href = "index.html?login=1";
    }
}

async function salvarPerfil(evento) {
    evento.preventDefault();
    const form = evento.target;
    const erroGeral = document.getElementById("erroPerfil");
    erroGeral.hidden = true;

    const valido = validarFormularioUsuario(form, [
        ["novaSenha", v => v && v.length < 6 ? "A senha precisa ter pelo menos 6 caracteres." : ""],
        ["confirmarSenha", v => v !== form.novaSenha.value ? "As senhas não conferem." : ""]
    ]);
    if (!valido) return;

    const dados = {};
    CAMPOS_PERFIL.filter(c => c !== "cpf").forEach(c => dados[c] = form.elements[c].value.trim());
    dados.novaSenha = form.novaSenha.value || null;

    const botao = form.querySelector("button[type=submit]");
    botao.disabled = true;
    try {
        const usuario = await api("usuarios/me", "PUT", dados);
        salvarSessao(null, usuario);
        preencherPerfil(usuario);
        form.novaSenha.value = form.confirmarSenha.value = "";
        mostrarToast("Dados atualizados com sucesso!", "sucesso");
    } catch (erro) {
        erroGeral.textContent = erro.message;
        erroGeral.hidden = false;
    } finally {
        botao.disabled = false;
    }
}

async function excluirConta() {
    if (!confirm("Tem certeza que deseja excluir sua conta? Todos os seus pedidos serão apagados.")) return;
    try {
        await api("usuarios/me", "DELETE");
        limparSessao();
        salvarCarrinho([]);
        mostrarToast("Conta excluída. Sentiremos sua falta.");
        setTimeout(() => location.href = "index.html", 1200);
    } catch (erro) {
        mostrarToast(erro.message, "erro");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("formPerfil").addEventListener("submit", salvarPerfil);
    document.getElementById("excluirConta").addEventListener("click", excluirConta);
    carregarPerfil();
    document.addEventListener("sessao-alterada", () => {
        if (!document.getElementById("formPerfil")) location.reload();
    });
});
