# Como abrir o site na rede

Segue o passo a passo para colocar o site no ar na rede local. A aplicação roda em ASP.NET Core com banco de dados MySQL. O servidor FTP serve apenas para armazenar e transferir os arquivos; quem mantém o site rodando é o `hospedar_site.bat`.

---

## 1. Configurar o servidor FTP (apenas na primeira vez)

1. Abra o **PowerShell** como **Administrador**.
2. Execute os comandos abaixo:
   ```powershell
   cd "C:\Users\atendimento3\Downloads\site_susu - Copia"
   powershell -ExecutionPolicy Bypass -File .\configurar_servidor_ftp.ps1
   ```
3. Quando o script solicitar a senha do `usuario_ftp`, defina uma senha forte contendo letra maiúscula, minúscula, número e símbolo (ex: `Ftp@Susu2026!`). Senhas fracas são bloqueadas pelo sistema e geram erro.
4. Ao finalizar, o terminal exibe o **IP da máquina**. Anote esse endereço para usar nos próximos passos.

---

## 2. Publicar os arquivos do site

Dê dois cliques no arquivo `publicar.bat`. Ele compila a aplicação e gera a pasta `publicar` com todos os arquivos prontos.

---

## 3. Enviar os arquivos por FTP

Existem duas formas de fazer o envio:

* **Pelo FileZilla:**
  * **Host:** IP da máquina (anotado no passo 1)
  * **Usuário:** `usuario_ftp`
  * **Senha:** a senha criada no passo 1
  * **Porta:** `21`
  
  Transfira **todo o conteúdo** de dentro da pasta `publicar` para a raiz do FTP (`C:\FTP_Root`).

* **Pelo terminal:**
  ```bat
  enviar_ftp.bat IP usuario_ftp SENHA
  ```

---

## 4. Iniciar o banco de dados (MySQL)

Dê dois cliques no `iniciar.bat` para subir o serviço do MySQL (caso o banco já esteja rodando, pode pular essa etapa). O banco `expressosushi` é criado automaticamente pelo próprio site no primeiro acesso.

---

## 5. Colocar o site no ar

1. Dê dois cliques no `hospedar_site.bat`. Na primeira execução, rode **como Administrador** para liberar a porta `8080` no firewall do Windows.
2. **Mantenha a janela do terminal aberta.** Se ela for fechada, o servidor para e o site sai do ar.
3. Acesse pelo navegador usando o endereço: `http://IP:8080`

---

## Pontos importantes

* **Porta de acesso:** `http://IP:21` não abre o site no navegador (a porta 21 é exclusiva do FTP). Use sempre a `8080`.
* **Escopo da rede:** O endereço funciona apenas na rede local (`192.168.x.x`). Para acesso externo via internet, é necessário configurar o redirecionamento (Port Forwarding) da porta `8080` no roteador.
* **Reinicialização:** Se o PC for reiniciado, execute o `iniciar.bat` e o `hospedar_site.bat` novamente.
* **Atualizações de código:** Sempre que alterar o projeto, rode o `publicar.bat`, envie os arquivos novos por FTP e reinicie o `hospedar_site.bat`.
* **Configuração do banco:** O arquivo `appsettings.json` está apontando para `Server=localhost;Uid=root;Pwd=;`, pois o MySQL roda na mesma máquina. Caso mude o banco de servidor, atualize essa string de conexão.

---

## Solução de problemas

| Problema | O que fazer |
| :--- | :--- |
| **FTP erro 530** | Senha incorreta ou usuário inexistente. Rode o passo 1 novamente. |
| **FTP trava em "Obtendo listagem de pastas"** | Libere as portas `50000-50100` no firewall (o script do passo 1 já faz essa liberação). |
| **FTP erro 550** | Falta permissão de **Modificar** para o `usuario_ftp` na pasta `C:\FTP_Root`. |
| **Outro PC não acessa o site** | Firewall bloqueando a porta `8080`. Execute o `hospedar_site.bat` como Administrador. |
| **Site abre, mas dá erro de banco** | O serviço do MySQL está parado. Execute o `iniciar.bat`. |