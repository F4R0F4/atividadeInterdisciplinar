using MySqlConnector;

public static class Banco
{
    public static string Conexao = "Server=localhost;Port=3306;Database=expressosushi;Uid=root;Pwd=;";

    public static List<Dictionary<string, object?>> Consultar(string sql, object? parametros = null)
    {
        using var conexao = new MySqlConnection(Conexao);
        conexao.Open();
        using var comando = CriarComando(conexao, sql, parametros);
        using var leitor = comando.ExecuteReader();

        var linhas = new List<Dictionary<string, object?>>();
        while (leitor.Read())
        {
            var linha = new Dictionary<string, object?>();
            for (int i = 0; i < leitor.FieldCount; i++)
            {
                object? valor = leitor.IsDBNull(i) ? null : leitor.GetValue(i);
                if (valor is DateTime data) valor = data.ToString("yyyy-MM-dd HH:mm:ss");

                string nome = leitor.GetName(i);
                linha[char.ToLower(nome[0]) + nome[1..]] = valor;
            }
            linhas.Add(linha);
        }
        return linhas;
    }

    public static Dictionary<string, object?>? ConsultarUm(string sql, object? parametros = null) =>
        Consultar(sql, parametros).FirstOrDefault();

    public static object? Valor(string sql, object? parametros = null)
    {
        using var conexao = new MySqlConnection(Conexao);
        conexao.Open();
        using var comando = CriarComando(conexao, sql, parametros);
        return comando.ExecuteScalar();
    }

    public static int Executar(string sql, object? parametros = null)
    {
        using var conexao = new MySqlConnection(Conexao);
        conexao.Open();
        using var comando = CriarComando(conexao, sql, parametros);
        return comando.ExecuteNonQuery();
    }

    public static int Inserir(string sql, object? parametros = null) =>
        Convert.ToInt32(Valor(sql + "; SELECT LAST_INSERT_ID();", parametros));

    public static MySqlCommand CriarComando(MySqlConnection conexao, string sql, object? parametros)
    {
        var comando = new MySqlCommand(sql, conexao);
        if (parametros != null)
        {
            foreach (var propriedade in parametros.GetType().GetProperties())
                comando.Parameters.AddWithValue("@" + propriedade.Name, propriedade.GetValue(parametros) ?? DBNull.Value);
        }
        return comando;
    }

    public static void Inicializar(string caminhoScript)
    {
        var semBanco = new MySqlConnectionStringBuilder(Conexao) { Database = "" };
        using (var conexao = new MySqlConnection(semBanco.ConnectionString))
        {
            conexao.Open();
            new MySqlCommand(File.ReadAllText(caminhoScript), conexao).ExecuteNonQuery();
        }
    }
}
