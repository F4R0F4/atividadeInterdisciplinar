var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

Banco.Conexao = builder.Configuration.GetConnectionString("ExpressoSushi") ?? Banco.Conexao;
Banco.Inicializar(Path.Combine(app.Environment.ContentRootPath, "Database", "script.sql"));

app.UseDefaultFiles();
app.UseStaticFiles();

const string ColunasUsuario = @"Id, Nome, Email, Cpf, Telefone, DataNascimento, Cep, Endereco, Numero,
                                Complemento, Bairro, Cidade, Estado, CriadoEm";

app.MapPost("/api/usuarios", (DadosUsuario d) =>
{
    string? erro = ValidarUsuario(d);
    if (erro == null && !Funcoes.CpfValido(d.Cpf)) erro = "CPF inválido.";
    if (erro == null && (d.Senha == null || d.Senha.Length < 6 || d.Senha.Length > 20)) erro = "A senha deve ter de 6 a 20 caracteres.";
    if (erro == null && Convert.ToInt32(Banco.Valor("SELECT COUNT(*) FROM Usuarios WHERE Email = @email", new { email = d.Email!.Trim().ToLower() })) > 0)
        erro = "Este e-mail já está cadastrado.";
    if (erro == null && Convert.ToInt32(Banco.Valor("SELECT COUNT(*) FROM Usuarios WHERE Cpf = @cpf", new { cpf = d.Cpf })) > 0)
        erro = "Este CPF já está cadastrado.";
    if (erro != null) return Erro(erro);

    int id = Banco.Inserir(@"
        INSERT INTO Usuarios (Nome, Email, Cpf, Telefone, DataNascimento, Cep, Endereco, Numero, Complemento, Bairro, Cidade, Estado, SenhaHash)
        VALUES (@nome, @email, @cpf, @telefone, @nascimento, @cep, @endereco, @numero, @complemento, @bairro, @cidade, @estado, @senha)",
        new
        {
            nome = d.Nome!.Trim(), email = d.Email!.Trim().ToLower(), cpf = d.Cpf, telefone = d.Telefone,
            nascimento = Funcoes.Vazio(d.DataNascimento), cep = Funcoes.Vazio(d.Cep), endereco = Funcoes.Vazio(d.Endereco),
            numero = Funcoes.Vazio(d.Numero), complemento = Funcoes.Vazio(d.Complemento), bairro = Funcoes.Vazio(d.Bairro),
            cidade = Funcoes.Vazio(d.Cidade), estado = Funcoes.Vazio(d.Estado?.ToUpper()), senha = Funcoes.GerarHash(d.Senha!)
        });
    return Results.Ok(AbrirSessao(id));
});

app.MapPost("/api/usuarios/login", (DadosLogin d) =>
{
    var usuario = Banco.ConsultarUm("SELECT Id, SenhaHash FROM Usuarios WHERE Email = @email",
                                    new { email = (d.Email ?? "").Trim().ToLower() });
    if (usuario == null || !Funcoes.SenhaCorreta(d.Senha ?? "", (string)usuario["senhaHash"]!))
        return Results.Json(new { mensagem = "E-mail ou senha incorretos." }, statusCode: 401);

    return Results.Ok(AbrirSessao(Convert.ToInt32(usuario["id"])));
});

app.MapPost("/api/usuarios/logout", (HttpRequest req) =>
{
    var usuario = UsuarioLogado(req);
    if (usuario != null) Banco.Executar("UPDATE Usuarios SET Token = NULL WHERE Id = @id", new { id = usuario["id"] });
    return Results.Ok(new { mensagem = "Sessão encerrada." });
});

app.MapGet("/api/usuarios/me", (HttpRequest req) =>
{
    var usuario = UsuarioLogado(req);
    return usuario == null ? NaoLogado() : Results.Ok(usuario);
});

app.MapPut("/api/usuarios/me", (HttpRequest req, DadosUsuario d) =>
{
    var usuario = UsuarioLogado(req);
    if (usuario == null) return NaoLogado();

    string? erro = ValidarUsuario(d);
    if (erro == null && !string.IsNullOrEmpty(d.NovaSenha) && (d.NovaSenha.Length < 6 || d.NovaSenha.Length > 20))
        erro = "A nova senha deve ter de 6 a 20 caracteres.";
    if (erro == null && Convert.ToInt32(Banco.Valor("SELECT COUNT(*) FROM Usuarios WHERE Email = @email AND Id <> @id",
                                                    new { email = d.Email!.Trim().ToLower(), id = usuario["id"] })) > 0)
        erro = "Este e-mail já pertence a outra conta.";
    if (erro != null) return Erro(erro);

    Banco.Executar(@"
        UPDATE Usuarios SET Nome = @nome, Email = @email, Telefone = @telefone, DataNascimento = @nascimento, Cep = @cep,
               Endereco = @endereco, Numero = @numero, Complemento = @complemento, Bairro = @bairro, Cidade = @cidade, Estado = @estado
        WHERE Id = @id",
        new
        {
            id = usuario["id"], nome = d.Nome!.Trim(), email = d.Email!.Trim().ToLower(), telefone = d.Telefone,
            nascimento = Funcoes.Vazio(d.DataNascimento), cep = Funcoes.Vazio(d.Cep), endereco = Funcoes.Vazio(d.Endereco),
            numero = Funcoes.Vazio(d.Numero), complemento = Funcoes.Vazio(d.Complemento), bairro = Funcoes.Vazio(d.Bairro),
            cidade = Funcoes.Vazio(d.Cidade), estado = Funcoes.Vazio(d.Estado?.ToUpper())
        });

    if (!string.IsNullOrEmpty(d.NovaSenha))
        Banco.Executar("UPDATE Usuarios SET SenhaHash = @senha WHERE Id = @id", new { senha = Funcoes.GerarHash(d.NovaSenha), id = usuario["id"] });

    return Results.Ok(Banco.ConsultarUm($"SELECT {ColunasUsuario} FROM Usuarios WHERE Id = @id", new { id = usuario["id"] }));
});

app.MapDelete("/api/usuarios/me", (HttpRequest req) =>
{
    var usuario = UsuarioLogado(req);
    if (usuario == null) return NaoLogado();

    Banco.Executar("DELETE FROM Usuarios WHERE Id = @id", new { id = usuario["id"] });
    return Results.Ok(new { mensagem = "Conta excluída com sucesso." });
});

const string SelectProduto = @"
    SELECT p.Id, p.CategoriaId, c.Nome AS Categoria, p.Nome, p.Descricao, p.Preco, p.Imagem, p.Destaque
    FROM Produtos p INNER JOIN Categorias c ON c.Id = p.CategoriaId";

app.MapGet("/api/produtos", (string? busca, int? categoria, bool destaques = false) =>
{
    string sql = SelectProduto + " WHERE 1 = 1";
    if (destaques) sql += " AND p.Destaque = 1";
    if (categoria > 0) sql += " AND p.CategoriaId = @categoria";
    if (!string.IsNullOrWhiteSpace(busca)) sql += " AND (p.Nome LIKE @busca OR p.Descricao LIKE @busca OR c.Nome LIKE @busca)";

    return Results.Ok(Banco.Consultar(sql + " ORDER BY c.Id, p.Nome", new { categoria, busca = "%" + busca?.Trim() + "%" }));
});

app.MapGet("/api/produtos/categorias", () => Results.Ok(Banco.Consultar("SELECT Id, Nome FROM Categorias ORDER BY Id")));

const decimal TaxaEntrega = 7.90m;
const decimal FreteGratisAcimaDe = 120.00m;
string[] formasPagamento = { "Pix", "Cartão de crédito", "Cartão de débito", "Dinheiro" };

app.MapPost("/api/pedidos", (HttpRequest req, DadosPedido d) =>
{
    var usuario = UsuarioLogado(req);
    if (usuario == null) return NaoLogado();

    if (d.Itens == null || d.Itens.Count == 0) return Erro("O carrinho está vazio.");
    if (!formasPagamento.Contains(d.FormaPagamento)) return Erro("Forma de pagamento inválida.");
    if (string.IsNullOrWhiteSpace(d.EnderecoEntrega) || d.EnderecoEntrega.Length > 250) return Erro("Informe o endereço de entrega.");
    if ((d.Observacao ?? "").Length > 200) return Erro("A observação pode ter até 200 caracteres.");

    var itens = new List<(int ProdutoId, string Nome, int Quantidade, decimal Preco)>();
    foreach (var item in d.Itens)
    {
        if (item.Quantidade < 1 || item.Quantidade > 50) return Erro("Quantidade inválida.");
        var produto = Banco.ConsultarUm("SELECT Id, Nome, Preco FROM Produtos WHERE Id = @id", new { id = item.ProdutoId });
        if (produto == null) return Erro("Um dos produtos não está mais disponível.");
        itens.Add((item.ProdutoId, (string)produto["nome"]!, item.Quantidade, Convert.ToDecimal(produto["preco"])));
    }

    decimal subtotal = itens.Sum(i => i.Preco * i.Quantidade);
    decimal taxa = subtotal >= FreteGratisAcimaDe ? 0 : TaxaEntrega;

    using var conexao = new MySqlConnector.MySqlConnection(Banco.Conexao);
    conexao.Open();
    using var transacao = conexao.BeginTransaction();

    var cmdPedido = Banco.CriarComando(conexao, @"
        INSERT INTO Pedidos (UsuarioId, DataPedido, Status, Subtotal, TaxaEntrega, Total, FormaPagamento, EnderecoEntrega, Observacao)
        VALUES (@usuario, NOW(), 'Recebido', @subtotal, @taxa, @total, @pagamento, @endereco, @obs);
        SELECT LAST_INSERT_ID();",
        new { usuario = usuario["id"], subtotal, taxa, total = subtotal + taxa, pagamento = d.FormaPagamento,
              endereco = d.EnderecoEntrega.Trim(), obs = Funcoes.Vazio(d.Observacao) });
    cmdPedido.Transaction = transacao;
    int pedidoId = Convert.ToInt32(cmdPedido.ExecuteScalar());

    foreach (var item in itens)
    {
        var cmdItem = Banco.CriarComando(conexao, @"
            INSERT INTO ItensPedido (PedidoId, ProdutoId, NomeProduto, Quantidade, PrecoUnitario)
            VALUES (@pedido, @produto, @nome, @quantidade, @preco)",
            new { pedido = pedidoId, produto = item.ProdutoId, nome = item.Nome, quantidade = item.Quantidade, preco = item.Preco });
        cmdItem.Transaction = transacao;
        cmdItem.ExecuteNonQuery();
    }
    transacao.Commit();

    return Results.Ok(BuscarPedido(pedidoId));
});

app.MapGet("/api/pedidos", (HttpRequest req) =>
{
    var usuario = UsuarioLogado(req);
    if (usuario == null) return NaoLogado();

    var pedidos = Banco.Consultar("SELECT * FROM Pedidos WHERE UsuarioId = @id ORDER BY Id DESC", new { id = usuario["id"] });

    foreach (var pedido in pedidos)
        pedido["itens"] = Banco.Consultar("SELECT * FROM ItensPedido WHERE PedidoId = @id ORDER BY Id", new { id = pedido["id"] });
    return Results.Ok(pedidos);
});

app.MapPut("/api/pedidos/{id:int}/cancelar", (HttpRequest req, int id) =>
{
    var usuario = UsuarioLogado(req);
    if (usuario == null) return NaoLogado();
    var pedido = BuscarPedido(id);
    if (!PodeVer(usuario, pedido)) return NaoEncontrado("Pedido");
    if ((string)pedido!["status"]! != "Recebido") return Erro("Só é possível cancelar pedidos que ainda não entraram em preparo.");

    Banco.Executar("UPDATE Pedidos SET Status = 'Cancelado' WHERE Id = @id", new { id });
    return Results.Ok(BuscarPedido(id));
});

app.Run();

IResult Erro(string mensagem) => Results.BadRequest(new { mensagem });
IResult NaoLogado() => Results.Json(new { mensagem = "Faça login para continuar." }, statusCode: 401);
IResult NaoEncontrado(string oQue) => Results.NotFound(new { mensagem = oQue + " não encontrado." });

Dictionary<string, object?>? UsuarioLogado(HttpRequest req)
{
    string cabecalho = req.Headers.Authorization.ToString();
    if (!cabecalho.StartsWith("Bearer ")) return null;
    string token = cabecalho["Bearer ".Length..].Trim();
    if (token.Length == 0) return null;
    return Banco.ConsultarUm($"SELECT {ColunasUsuario} FROM Usuarios WHERE Token = @token", new { token });
}

object AbrirSessao(int id)
{
    string? token = Banco.Valor("SELECT Token FROM Usuarios WHERE Id = @id", new { id }) as string;
    if (string.IsNullOrEmpty(token))
    {
        token = Funcoes.GerarToken();
        Banco.Executar("UPDATE Usuarios SET Token = @token WHERE Id = @id", new { token, id });
    }
    return new { token, usuario = Banco.ConsultarUm($"SELECT {ColunasUsuario} FROM Usuarios WHERE Id = @id", new { id }) };
}

string? ValidarUsuario(DadosUsuario d)
{
    if (string.IsNullOrWhiteSpace(d.Nome) || d.Nome.Trim().Length < 3 || d.Nome.Length > 80) return "Informe o nome completo (3 a 80 caracteres).";
    if (!Funcoes.EmailValido(d.Email)) return "E-mail inválido.";
    int digitosTelefone = Funcoes.SomenteNumeros(d.Telefone).Length;
    if (digitosTelefone != 10 && digitosTelefone != 11) return "Telefone inválido.";

    if (!string.IsNullOrWhiteSpace(d.DataNascimento))
    {
        if (!DateTime.TryParseExact(d.DataNascimento, "dd/MM/yyyy", null, System.Globalization.DateTimeStyles.None, out var data)
            || data > DateTime.Today || data.Year < 1900)
            return "Data de nascimento inválida.";
        if (data > DateTime.Today.AddYears(-12)) return "É preciso ter pelo menos 12 anos.";
    }
    if (!string.IsNullOrWhiteSpace(d.Cep) && Funcoes.SomenteNumeros(d.Cep).Length != 8) return "CEP inválido.";
    if (!string.IsNullOrWhiteSpace(d.Numero) && (d.Numero.Length > 6 || !d.Numero.All(char.IsDigit)))
        return "O número do endereço deve conter apenas dígitos.";
    if (!string.IsNullOrWhiteSpace(d.Estado) && (d.Estado.Length != 2 || !d.Estado.All(char.IsLetter))) return "Estado (UF) inválido.";
    return null;
}

Dictionary<string, object?>? BuscarPedido(int id)
{
    var pedido = Banco.ConsultarUm("SELECT * FROM Pedidos WHERE Id = @id", new { id });
    if (pedido != null) pedido["itens"] = Banco.Consultar("SELECT * FROM ItensPedido WHERE PedidoId = @id ORDER BY Id", new { id });
    return pedido;
}

bool PodeVer(Dictionary<string, object?> usuario, Dictionary<string, object?>? pedido) =>
    pedido != null && Convert.ToInt32(pedido["usuarioId"]) == Convert.ToInt32(usuario["id"]);
