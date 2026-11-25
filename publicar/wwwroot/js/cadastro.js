function lerDadosUsuario(form) {
    const campos = ["nome", "email", "cpf", "telefone", "dataNascimento", "cep", "endereco",
                    "numero", "complemento", "bairro", "cidade", "estado"];
    const dados = {};
    campos.forEach(nome => {
        if (form.elements[nome]) dados[nome] = form.elements[nome].value.trim();
    });
    return dados;
}

function atualizarForcaSenha() {
    const senha = document.getElementById("senha").value;
    const pontos = forcaSenha(senha);
    const niveis = [
        ["6 a 20 caracteres", "var(--erro)"],
        ["Senha fraca", "var(--erro)"],
        ["Senha razoável", "var(--destaque)"],
        ["Senha boa", "var(--sucesso)"],
        ["Senha forte", "var(--sucesso)"]
    ];
    const barra = document.getElementById("barraForca");
    barra.style.width = (senha ? Math.max(pontos, 1) * 25 : 0) + "%";
    barra.style.background = niveis[pontos][1];
    document.getElementById("textoForca").textContent = senha ? niveis[pontos][0] : niveis[0][0];
}

document.addEventListener("DOMContentLoaded", () => {
    if (estaLogado()) {
        mostrarToast("Você já está logado.");
        setTimeout(() => location.href = "perfil.html", 800);
    }

    const form = document.getElementById("formCadastro");
    const erroGeral = document.getElementById("erroCadastro");

    document.getElementById("senha").addEventListener("input", atualizarForcaSenha);

    form.cpf.addEventListener("blur", () => {
        if (form.cpf.value) marcarErro(form.cpf, cpfValido(form.cpf.value) ? "" : "CPF inválido.");
    });

    form.addEventListener("submit", async evento => {
        evento.preventDefault();
        erroGeral.hidden = true;

        const valido = validarFormularioUsuario(form, [
            ["cpf", v => !cpfValido(v) ? "CPF inválido." : ""],
            ["senha", v => v.length < 6 ? "A senha precisa ter pelo menos 6 caracteres." : ""],
            ["confirmarSenha", v => v !== form.senha.value ? "As senhas não conferem." : ""],
            ["termos", () => !form.termos.checked ? "Você precisa aceitar os termos." : ""]
        ]);
        if (!valido) return;

        const botao = form.querySelector("button[type=submit]");
        botao.disabled = true;
        botao.textContent = "Criando conta...";

        try {
            const dados = lerDadosUsuario(form);
            dados.senha = form.senha.value;
            const resposta = await api("usuarios", "POST", dados);
            salvarSessao(resposta.token, resposta.usuario);
            mostrarToast("Conta criada. Bom apetite!", "sucesso");
            setTimeout(() => location.href = "produtos.html", 900);
        } catch (erro) {
            erroGeral.textContent = erro.message;
            erroGeral.hidden = false;
            botao.disabled = false;
            botao.textContent = "Criar minha conta";
        }
    });
});
