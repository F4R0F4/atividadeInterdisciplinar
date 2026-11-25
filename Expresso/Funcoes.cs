using System.Security.Cryptography;
using System.Text.RegularExpressions;

public static class Funcoes
{
    public static string GerarHash(string senha)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(16);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(senha, salt, 100_000, HashAlgorithmName.SHA256, 32);
        return Convert.ToBase64String(salt) + "." + Convert.ToBase64String(hash);
    }

    public static bool SenhaCorreta(string senha, string hashSalvo)
    {
        string[] partes = hashSalvo.Split('.');
        if (partes.Length != 2) return false;

        byte[] salt = Convert.FromBase64String(partes[0]);
        byte[] esperado = Convert.FromBase64String(partes[1]);
        byte[] calculado = Rfc2898DeriveBytes.Pbkdf2(senha, salt, 100_000, HashAlgorithmName.SHA256, 32);
        return CryptographicOperations.FixedTimeEquals(esperado, calculado);
    }

    public static string GerarToken() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

    public static bool CpfValido(string? cpf)
    {
        string n = SomenteNumeros(cpf);
        if (n.Length != 11 || n.Distinct().Count() == 1) return false;

        for (int posicao = 9; posicao <= 10; posicao++)
        {
            int soma = 0;
            for (int i = 0; i < posicao; i++)
                soma += (n[i] - '0') * (posicao + 1 - i);

            int resto = soma % 11;
            int digito = resto < 2 ? 0 : 11 - resto;
            if (n[posicao] - '0' != digito) return false;
        }
        return true;
    }

    public static bool EmailValido(string? email) =>
        email != null && email.Length <= 100 && Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$");

    public static string SomenteNumeros(string? texto) =>
        new string((texto ?? "").Where(char.IsDigit).ToArray());

    public static object? Vazio(string? texto) =>
        string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();
}
