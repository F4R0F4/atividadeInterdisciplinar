public record DadosUsuario(
    string? Nome, string? Email, string? Cpf, string? Telefone, string? DataNascimento,
    string? Cep, string? Endereco, string? Numero, string? Complemento, string? Bairro,
    string? Cidade, string? Estado, string? Senha, string? NovaSenha);

public record DadosLogin(string? Email, string? Senha);

public record DadosPedido(string? FormaPagamento, string? EnderecoEntrega, string? Observacao, List<ItemCarrinho>? Itens);

public record ItemCarrinho(int ProdutoId, int Quantidade);
