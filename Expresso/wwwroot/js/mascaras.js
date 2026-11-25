function somenteNumeros(texto) {
    return String(texto).replace(/\D/g, "");
}

function mascaraCpf(valor) {
    return somenteNumeros(valor).slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function mascaraTelefone(valor) {
    const n = somenteNumeros(valor).slice(0, 11);
    if (n.length <= 2) return n.length ? "(" + n : "";
    if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
    if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

function mascaraCep(valor) {
    return somenteNumeros(valor).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

function mascaraData(valor) {
    return somenteNumeros(valor).slice(0, 8)
        .replace(/(\d{2})(\d)/, "$1/$2")
        .replace(/(\d{2})(\d)/, "$1/$2");
}

function mascaraDinheiro(valor) {
    const n = somenteNumeros(valor).slice(0, 7);
    if (!n) return "";
    return (Number(n) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

const MASCARAS = {
    cpf: mascaraCpf,
    telefone: mascaraTelefone,
    cep: mascaraCep,
    data: mascaraData,
    dinheiro: mascaraDinheiro,
    numero: v => somenteNumeros(v),
    letras: v => v.replace(/[^A-Za-zÀ-ÿ\s']/g, "").replace(/\s{2,}/g, " ")
};

const TIPOS_NUMERICOS = ["cpf", "telefone", "cep", "data", "numero", "dinheiro"];

function aplicarMascaras(raiz = document) {
    raiz.querySelectorAll("[data-mascara]").forEach(campo => {
        const tipo = campo.dataset.mascara;
        const mascara = MASCARAS[tipo];
        if (!mascara || campo.dataset.mascaraAtiva) return;
        campo.dataset.mascaraAtiva = "1";

        if (TIPOS_NUMERICOS.includes(tipo)) {
            campo.setAttribute("inputmode", "numeric");

            campo.addEventListener("keypress", evento => {
                if (evento.key.length === 1 && !/\d/.test(evento.key)) evento.preventDefault();
            });
        }

        campo.addEventListener("input", () => {
            campo.value = mascara(campo.value);
        });

        if (campo.value) campo.value = mascara(campo.value);
    });

    raiz.querySelectorAll("[data-contador-de]").forEach(contador => {
        const campo = document.getElementById(contador.dataset.contadorDe);
        if (!campo) return;
        const atualizar = () => contador.textContent = `${campo.value.length}/${campo.maxLength}`;
        campo.addEventListener("input", atualizar);
        atualizar();
    });
}

function cpfValido(cpf) {
    const n = somenteNumeros(cpf);
    if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;

    for (let posicao = 9; posicao <= 10; posicao++) {
        let soma = 0;
        for (let i = 0; i < posicao; i++) soma += Number(n[i]) * (posicao + 1 - i);
        const resto = soma % 11;
        const digito = resto < 2 ? 0 : 11 - resto;
        if (Number(n[posicao]) !== digito) return false;
    }
    return true;
}

function emailValido(email) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function telefoneValido(telefone) {
    const tamanho = somenteNumeros(telefone).length;
    return tamanho === 10 || tamanho === 11;
}

function validarNascimento(texto) {
    if (!texto) return "";
    const partes = texto.split("/");
    if (partes.length !== 3 || partes[2].length !== 4) return "Data incompleta.";

    const [dia, mes, ano] = partes.map(Number);
    const data = new Date(ano, mes - 1, dia);
    if (data.getDate() !== dia || data.getMonth() !== mes - 1 || ano < 1900) return "Data inválida.";

    const hoje = new Date();
    if (data > hoje) return "A data não pode ser no futuro.";
    const limite = new Date(hoje.getFullYear() - 12, hoje.getMonth(), hoje.getDate());
    if (data > limite) return "É preciso ter pelo menos 12 anos.";
    return "";
}

function marcarErro(campo, mensagem) {
    const caixa = campo.closest(".campo");
    if (!caixa) return;
    caixa.classList.toggle("invalido", Boolean(mensagem));
    const saida = caixa.querySelector(".mensagem-erro");
    if (saida) saida.textContent = mensagem || "";
}

function forcaSenha(senha) {
    let pontos = 0;
    if (senha.length >= 6) pontos++;
    if (senha.length >= 10) pontos++;
    if (/[A-Z]/.test(senha) && /[a-z]/.test(senha)) pontos++;
    if (/\d/.test(senha) && /[^A-Za-z0-9]/.test(senha)) pontos++;
    return pontos;
}

function validarFormularioUsuario(form, regrasExtras = []) {
    const regras = [
        ["nome", v => v.trim().length < 3 ? "Informe o nome completo." : ""],
        ["email", v => !emailValido(v) ? "E-mail inválido." : ""],
        ["telefone", v => !telefoneValido(v) ? "Telefone incompleto." : ""],
        ["dataNascimento", v => validarNascimento(v)],
        ["cep", v => v && somenteNumeros(v).length !== 8 ? "CEP incompleto." : ""],
        ...regrasExtras
    ];

    let valido = true;
    let primeiroInvalido = null;
    regras.forEach(([nome, regra]) => {
        const campo = form.elements[nome];
        if (!campo) return;
        const erro = regra(campo.value);
        marcarErro(campo, erro);
        if (erro) {
            valido = false;
            primeiroInvalido ??= campo;
        }
    });
    primeiroInvalido?.focus();
    return valido;
}
