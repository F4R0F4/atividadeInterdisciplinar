CREATE DATABASE IF NOT EXISTS expressosushi
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE expressosushi;

CREATE TABLE IF NOT EXISTS Usuarios (
    Id              INT AUTO_INCREMENT PRIMARY KEY,
    Nome            VARCHAR(80)  NOT NULL,
    Email           VARCHAR(100) NOT NULL UNIQUE,
    Cpf             VARCHAR(14)  NOT NULL UNIQUE,
    Telefone        VARCHAR(15)  NOT NULL,
    DataNascimento  VARCHAR(10),
    Cep             VARCHAR(9),
    Endereco        VARCHAR(100),
    Numero          VARCHAR(6),
    Complemento     VARCHAR(50),
    Bairro          VARCHAR(60),
    Cidade          VARCHAR(60),
    Estado          CHAR(2),
    SenhaHash       VARCHAR(200) NOT NULL,
    Token           VARCHAR(100),
    CriadoEm        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS Categorias (
    Id      INT AUTO_INCREMENT PRIMARY KEY,
    Nome    VARCHAR(40) NOT NULL UNIQUE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS Produtos (
    Id          INT AUTO_INCREMENT PRIMARY KEY,
    CategoriaId INT NOT NULL,
    Nome        VARCHAR(60)  NOT NULL,
    Descricao   VARCHAR(200) NOT NULL,
    Preco       DECIMAL(10,2) NOT NULL CHECK (Preco >= 0),
    Imagem      VARCHAR(120) NOT NULL,
    Destaque    INT NOT NULL DEFAULT 0,
    FOREIGN KEY (CategoriaId) REFERENCES Categorias(Id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS Pedidos (
    Id               INT AUTO_INCREMENT PRIMARY KEY,
    UsuarioId        INT NOT NULL,
    DataPedido       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Status           VARCHAR(20) NOT NULL DEFAULT 'Recebido',
    Subtotal         DECIMAL(10,2) NOT NULL,
    TaxaEntrega      DECIMAL(10,2) NOT NULL,
    Total            DECIMAL(10,2) NOT NULL,
    FormaPagamento   VARCHAR(20) NOT NULL,
    EnderecoEntrega  VARCHAR(250) NOT NULL,
    Observacao       VARCHAR(200),
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS ItensPedido (
    Id             INT AUTO_INCREMENT PRIMARY KEY,
    PedidoId       INT NOT NULL,
    ProdutoId      INT NOT NULL,
    NomeProduto    VARCHAR(60) NOT NULL,
    Quantidade     INT NOT NULL CHECK (Quantidade > 0),
    PrecoUnitario  DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (PedidoId)  REFERENCES Pedidos(Id) ON DELETE CASCADE,
    FOREIGN KEY (ProdutoId) REFERENCES Produtos(Id)
) ENGINE = InnoDB;

INSERT IGNORE INTO Categorias (Id, Nome) VALUES
    (1, 'Combinados'),
    (2, 'Sushis'),
    (3, 'Temakis'),
    (4, 'Hot Rolls'),
    (5, 'Pratos Quentes'),
    (6, 'Bebidas'),
    (7, 'Sobremesas');

INSERT IGNORE INTO Produtos (Id, CategoriaId, Nome, Descricao, Preco, Imagem, Destaque) VALUES
    (1,  1, 'Combinado Expresso 20 peças',   '6 sashimis de salmão, 4 niguiris, 6 uramakis e 4 hossomakis.',           79.90, 'img/produtos/combinado-expresso.jpg', 1),
    (2,  1, 'Combinado Família 40 peças','Seleção do chef com salmão, atum, kani e skin. Serve 3 pessoas.',       149.90, 'img/produtos/combinado-familia.jpg', 1),
    (3,  1, 'Combinado Veggie 16 peças', 'Uramakis e hossomakis de pepino, manga, cenoura e cream cheese.',         59.90, 'img/produtos/combinado-veggie.jpg', 0),
    (4,  2, 'Niguiri de Salmão (2 un.)', 'Bolinho de arroz coberto com fatia fresca de salmão.',                    14.90, 'img/produtos/niguiri-salmao.jpg', 0),
    (5,  2, 'Sashimi de Salmão (10 un.)','Fatias de salmão fresco cortadas na hora.',                               42.90, 'img/produtos/sashimi-salmao.jpg', 1),
    (6,  2, 'Uramaki Filadélfia (8 un.)','Salmão, cream cheese e cebolinha, envolto em gergelim.',                  29.90, 'img/produtos/uramaki-filadelfia.jpg', 0),
    (7,  2, 'Hossomaki de Pepino (8 un.)','Rolinho fino de alga com arroz e pepino japonês.',                       16.90, 'img/produtos/hossomaki-pepino.jpg', 0),
    (8,  3, 'Temaki de Salmão',          'Cone de alga com arroz, salmão picado e cebolinha.',                      32.90, 'img/produtos/temaki-salmao.jpg', 1),
    (9,  3, 'Temaki Skin',               'Pele de salmão grelhada e crocante com molho tarê.',                      27.90, 'img/produtos/temaki-skin.jpg', 0),
    (10, 3, 'Temaki Califórnia',         'Kani, manga, pepino e maionese japonesa.',                                26.90, 'img/produtos/temaki-california.jpg', 0),
    (11, 4, 'Hot Philadelphia (10 un.)', 'Enrolado empanado com salmão e cream cheese, finalizado com tarê.',        34.90, 'img/produtos/hot-philadelphia.jpg', 1),
    (12, 4, 'Hot Banana (8 un.)',        'Hot roll doce de banana com canela e leite condensado.',                  24.90, 'img/produtos/hot-banana.jpg', 0),
    (13, 5, 'Yakissoba de Frango',       'Macarrão oriental salteado com legumes e frango.',                        38.90, 'img/produtos/yakissoba.jpg', 0),
    (14, 5, 'Lámen Tonkotsu',            'Caldo cremoso de porco, macarrão, ovo marinado e chashu.',                44.90, 'img/produtos/lamen-tonkotsu.jpg', 1),
    (15, 5, 'Guioza (6 un.)',            'Pastelzinho japonês de carne suína grelhado na chapa.',                   22.90, 'img/produtos/guioza.jpg', 0),
    (16, 6, 'Chá Verde Gelado 500ml',    'Chá verde natural, levemente adoçado.',                                    9.90, 'img/produtos/cha-verde.jpg', 0),
    (17, 6, 'Refrigerante Lata 350ml',   'Coca-Cola, Guaraná ou Sprite.',                                            6.90, 'img/produtos/refrigerante.jpg', 0),
    (18, 6, 'Água Mineral 500ml',        'Com ou sem gás.',                                                          4.90, 'img/produtos/agua.jpg', 0),
    (19, 7, 'Mochi de Morango (3 un.)',  'Bolinho de arroz glutinoso recheado com morango e doce de feijão.',       18.90, 'img/produtos/mochi-morango.jpg', 0),
    (20, 7, 'Harumaki de Chocolate',     'Rolinho primavera crocante recheado com chocolate.',                      16.90, 'img/produtos/harumaki-chocolate.jpg', 0);
