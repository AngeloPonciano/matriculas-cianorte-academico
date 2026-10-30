-- =============================================================================
-- 02_dados.sql: carga inicial com dados FICTÍCIOS
--
-- Arquivo GERADO por database/gerar-dados.ts a partir de src/data (não editar à mão).
-- Nomes sorteados de listas comuns, CGM com prefixo D-, ruas com letras gregas,
-- escolas com nomes de árvores e CMEIs com nomes de aves. Nenhum dado real.
-- =============================================================================

SET search_path TO matriculas;

-- [D1] Setores, séries e CMEIs
INSERT INTO setor (nome) VALUES
  ('Setor Central'),
  ('Setor Leste'),
  ('Setor Noroeste'),
  ('Setor Norte'),
  ('Setor Oeste'),
  ('Setor Sul');

INSERT INTO serie (nome, ordem) VALUES
  ('Infantil 5', 1),
  ('1º Ano', 2);

INSERT INTO cmei (codigo, nome) VALUES
  ('sabia', 'CMEI Sabiá'),
  ('bemtevi', 'CMEI Bem-te-vi'),
  ('beijaflor', 'CMEI Beija-flor'),
  ('curio', 'CMEI Curió');

-- [D2] Escolas e turmas de 2027
INSERT INTO escola (codigo, nome, setor_id, latitude, longitude)
SELECT v.codigo, v.nome, s.id, v.latitude, v.longitude
  FROM (VALUES
    (1, 'ipe', 'Escola Municipal Ipê Amarelo', 'Setor Central', -23.6612, -52.6048),
    (2, 'jacaranda', 'Escola Municipal Jacarandá', 'Setor Norte', -23.6455, -52.6012),
    (3, 'aroeira', 'Escola Municipal Aroeira', 'Setor Leste', -23.6598, -52.5832),
    (4, 'peroba', 'Escola Municipal Peroba Rosa', 'Setor Sul', -23.6788, -52.6071),
    (5, 'cedro', 'Escola Municipal Cedro', 'Setor Oeste', -23.6641, -52.6276),
    (6, 'paineira', 'Escola Municipal Paineira', 'Setor Noroeste', -23.6489, -52.6214)
  ) AS v (ordem, codigo, nome, setor, latitude, longitude)
  JOIN setor s ON s.nome = v.setor
 ORDER BY v.ordem;

INSERT INTO turma (escola_id, serie_id, ano_letivo, capacidade, matriculados_anteriores)
SELECT e.id, s.id, 2027, v.capacidade, v.matriculados
  FROM (VALUES
    ('ipe', 'Infantil 5', 25, 19),
    ('ipe', '1º Ano', 25, 22),
    ('jacaranda', 'Infantil 5', 20, 14),
    ('jacaranda', '1º Ano', 25, 18),
    ('aroeira', 'Infantil 5', 20, 20),
    ('aroeira', '1º Ano', 25, 17),
    ('peroba', 'Infantil 5', 25, 16),
    ('peroba', '1º Ano', 25, 21),
    ('cedro', 'Infantil 5', 20, 13),
    ('cedro', '1º Ano', 20, 20),
    ('paineira', 'Infantil 5', 20, 15),
    ('paineira', '1º Ano', 20, 14)
  ) AS v (escola, serie, capacidade, matriculados)
  JOIN escola e ON e.codigo = v.escola
  JOIN serie s  ON s.nome = v.serie
 ORDER BY e.id, s.ordem;

-- [D3] Alunos (48, todos fictícios)
INSERT INTO aluno (cgm, nome, serie_id, cmei_id, turma_origem, logradouro, numero, setor_id,
                   latitude, longitude, irmao_escola_id)
SELECT v.cgm, v.nome, s.id, c.id, v.turma_origem, v.logradouro, v.numero, st.id,
       v.latitude, v.longitude, e.id
  FROM (VALUES
    ('D-00100', 'Joaquim Melo Castro', 'Infantil 5', 'beijaflor', 'Infantil 4 B', 'Avenida Lambda', 666, 'Setor Noroeste', -23.67946, -52.59739, NULL),
    ('D-00107', 'Ravi Souza Pereira', '1º Ano', 'sabia', 'Infantil 5 B', 'Rua Teta', 529, 'Setor Leste', -23.64044, -52.60435, 'jacaranda'),
    ('D-00114', 'Manuela Gomes Almeida', '1º Ano', 'bemtevi', 'Infantil 5 B', 'Rua Zeta', 613, 'Setor Oeste', -23.64714, -52.61096, NULL),
    ('D-00121', 'Isabela Oliveira Carvalho', '1º Ano', 'sabia', 'Infantil 5 C', 'Avenida Ômega', 424, 'Setor Central', -23.63896, -52.60354, NULL),
    ('D-00128', 'Beatriz Nunes Martins', 'Infantil 5', 'beijaflor', 'Infantil 4 B', 'Rua Alfa', 602, 'Setor Central', -23.65876, -52.59286, NULL),
    ('D-00135', 'Gabriel Silva Carvalho', 'Infantil 5', 'bemtevi', 'Infantil 4 B', 'Rua Zeta', 737, 'Setor Leste', -23.64811, -52.61116, 'aroeira'),
    ('D-00142', 'Luísa Melo Gomes', 'Infantil 5', 'bemtevi', 'Infantil 4 C', 'Rua Zeta', 789, 'Setor Sul', -23.66578, -52.60483, NULL),
    ('D-00149', 'Isabela Oliveira Santos', 'Infantil 5', 'curio', 'Infantil 4 A', 'Rua Capa', 61, 'Setor Sul', -23.66606, -52.59628, NULL),
    ('D-00156', 'Gael Martins Ribeiro', 'Infantil 5', 'curio', 'Infantil 4 A', 'Rua Delta', 990, 'Setor Norte', -23.68427, -52.62112, 'cedro'),
    ('D-00163', 'Lívia Carvalho Dias', '1º Ano', 'bemtevi', 'Infantil 5 A', 'Rua Teta', 403, 'Setor Sul', -23.6402, -52.62354, NULL),
    ('D-00170', 'Ravi Silva Vieira', 'Infantil 5', 'beijaflor', 'Infantil 4 B', 'Rua Gama', 172, 'Setor Sul', -23.65358, -52.59924, NULL),
    ('D-00177', 'Lara Teixeira Gomes', '1º Ano', 'sabia', 'Infantil 5 B', 'Rua Teta', 650, 'Setor Noroeste', -23.64029, -52.61289, 'jacaranda'),
    ('D-00184', 'Arthur Lima Gomes', 'Infantil 5', 'beijaflor', 'Infantil 4 B', 'Rua Beta', 734, 'Setor Leste', -23.67101, -52.58694, NULL),
    ('D-00191', 'Isabela Souza Pereira', 'Infantil 5', 'curio', 'Infantil 4 C', 'Avenida Ômega', 978, 'Setor Central', -23.64335, -52.62396, NULL),
    ('D-00198', 'Lara Dias Carvalho', '1º Ano', 'bemtevi', 'Infantil 5 B', 'Avenida Lambda', 785, 'Setor Norte', -23.65135, -52.59982, NULL),
    ('D-00205', 'Manuela Rocha Dias', 'Infantil 5', 'beijaflor', 'Infantil 4 B', 'Rua Gama', 419, 'Setor Sul', -23.66166, -52.61593, NULL),
    ('D-00212', 'Helena Oliveira Carvalho', 'Infantil 5', 'beijaflor', 'Infantil 4 B', 'Avenida Ômega', 464, 'Setor Leste', -23.66777, -52.62215, NULL),
    ('D-00219', 'Melissa Almeida Barbosa', 'Infantil 5', 'beijaflor', 'Infantil 4 B', 'Rua Zeta', 218, 'Setor Norte', -23.65224, -52.61797, NULL),
    ('D-00226', 'Lívia Dias Martins', 'Infantil 5', 'sabia', 'Infantil 4 A', 'Rua Delta', 38, 'Setor Oeste', -23.68822, -52.61413, NULL),
    ('D-00233', 'Antonella Melo Santos', 'Infantil 5', 'bemtevi', 'Infantil 4 C', 'Rua Teta', 633, 'Setor Sul', -23.67659, -52.61376, 'aroeira'),
    ('D-00240', 'Melissa Rocha Almeida', 'Infantil 5', 'curio', 'Infantil 4 C', 'Rua Eta', 228, 'Setor Leste', -23.66578, -52.58174, NULL),
    ('D-00247', 'Pedro Carvalho Melo', '1º Ano', 'sabia', 'Infantil 5 A', 'Avenida Lambda', 162, 'Setor Oeste', -23.67705, -52.62324, NULL),
    ('D-00254', 'Noah Moreira Rocha', 'Infantil 5', 'sabia', 'Infantil 4 A', 'Avenida Ômega', 867, 'Setor Norte', -23.66188, -52.58091, NULL),
    ('D-00261', 'Cecília Gomes Silva', 'Infantil 5', 'bemtevi', 'Infantil 4 C', 'Avenida Ômega', 863, 'Setor Central', -23.67293, -52.60584, 'cedro'),
    ('D-00268', 'Lara Santos Teixeira', 'Infantil 5', 'curio', 'Infantil 4 C', 'Rua Épsilon', 473, 'Setor Norte', -23.64951, -52.62341, 'peroba'),
    ('D-00275', 'Arthur Melo Ribeiro', 'Infantil 5', 'beijaflor', 'Infantil 4 B', 'Rua Iota', 480, 'Setor Central', -23.6635, -52.62152, NULL),
    ('D-00282', 'Ravi Lima Lima', '1º Ano', 'sabia', 'Infantil 5 A', 'Rua Épsilon', 344, 'Setor Oeste', -23.64508, -52.58889, NULL),
    ('D-00289', 'Gabriel Silva Martins', 'Infantil 5', 'sabia', 'Infantil 4 A', 'Rua Gama', 793, 'Setor Noroeste', -23.64897, -52.58358, NULL),
    ('D-00296', 'Noah Fernandes Lima', '1º Ano', 'sabia', 'Infantil 5 C', 'Rua Épsilon', 487, 'Setor Norte', -23.68501, -52.60412, NULL),
    ('D-00303', 'Melissa Correia Carvalho', 'Infantil 5', 'sabia', 'Infantil 4 B', 'Rua Épsilon', 207, 'Setor Norte', -23.66758, -52.5876, NULL),
    ('D-00310', 'Cecília Pereira Fernandes', '1º Ano', 'curio', 'Infantil 5 C', 'Rua Iota', 423, 'Setor Sul', -23.63725, -52.61765, NULL),
    ('D-00317', 'Antonella Moreira Nunes', '1º Ano', 'sabia', 'Infantil 5 B', 'Rua Eta', 979, 'Setor Central', -23.68571, -52.59339, NULL),
    ('D-00324', 'Davi Silva Silva', 'Infantil 5', 'curio', 'Infantil 4 A', 'Rua Capa', 478, 'Setor Sul', -23.66426, -52.60879, NULL),
    ('D-00331', 'Noah Melo Cardoso', '1º Ano', 'bemtevi', 'Infantil 5 C', 'Avenida Lambda', 375, 'Setor Oeste', -23.64865, -52.59085, NULL),
    ('D-00338', 'Antonella Oliveira Melo', 'Infantil 5', 'sabia', 'Infantil 4 B', 'Rua Capa', 679, 'Setor Central', -23.65545, -52.60458, NULL),
    ('D-00345', 'Joaquim Moreira Vieira', 'Infantil 5', 'beijaflor', 'Infantil 4 A', 'Rua Alfa', 878, 'Setor Noroeste', -23.65, -52.61159, NULL),
    ('D-00352', 'Beatriz Nunes Moreira', 'Infantil 5', 'bemtevi', 'Infantil 4 A', 'Rua Eta', 548, 'Setor Sul', -23.67255, -52.60859, NULL),
    ('D-00359', 'Manuela Fernandes Melo', 'Infantil 5', 'bemtevi', 'Infantil 4 C', 'Rua Épsilon', 167, 'Setor Leste', -23.67288, -52.6332, 'cedro'),
    ('D-00366', 'Miguel Barbosa Lima', '1º Ano', 'beijaflor', 'Infantil 5 B', 'Avenida Lambda', 887, 'Setor Norte', -23.67593, -52.59351, NULL),
    ('D-00373', 'Helena Castro Souza', 'Infantil 5', 'curio', 'Infantil 4 C', 'Rua Gama', 657, 'Setor Oeste', -23.65911, -52.61129, NULL),
    ('D-00380', 'Clara Lopes Gomes', 'Infantil 5', 'curio', 'Infantil 4 C', 'Rua Delta', 292, 'Setor Oeste', -23.65136, -52.61714, NULL),
    ('D-00387', 'Sofia Lopes Correia', 'Infantil 5', 'sabia', 'Infantil 4 C', 'Rua Delta', 848, 'Setor Leste', -23.67482, -52.62935, NULL),
    ('D-00394', 'Davi Nunes Dias', '1º Ano', 'curio', 'Infantil 5 C', 'Rua Iota', 660, 'Setor Leste', -23.68262, -52.61823, NULL),
    ('D-00401', 'Alice Barbosa Almeida', 'Infantil 5', 'curio', 'Infantil 4 A', 'Rua Zeta', 369, 'Setor Noroeste', -23.65079, -52.58783, NULL),
    ('D-00408', 'Ana Teixeira Silva', 'Infantil 5', 'beijaflor', 'Infantil 4 C', 'Rua Capa', 847, 'Setor Noroeste', -23.68615, -52.60219, NULL),
    ('D-00415', 'Ana Gomes Teixeira', '1º Ano', 'beijaflor', 'Infantil 5 B', 'Rua Iota', 262, 'Setor Central', -23.66137, -52.6214, NULL),
    ('D-00422', 'Bernardo Teixeira Barbosa', 'Infantil 5', 'bemtevi', 'Infantil 4 C', 'Avenida Ômega', 35, 'Setor Leste', -23.63792, -52.60416, 'aroeira'),
    ('D-00429', 'Lara Santos Nunes', '1º Ano', 'curio', 'Infantil 5 B', 'Avenida Ômega', 991, 'Setor Oeste', -23.64413, -52.61834, NULL)
  ) AS v (cgm, nome, serie, cmei, turma_origem, logradouro, numero, setor, latitude, longitude, irmao)
  JOIN serie s   ON s.nome = v.serie
  JOIN cmei c    ON c.codigo = v.cmei
  JOIN setor st  ON st.nome = v.setor
  LEFT JOIN escola e ON e.codigo = v.irmao::varchar
 ORDER BY v.cgm;

-- [D4] Operadoras fictícias
INSERT INTO operadora (nome, login) VALUES
  ('Operadora Demonstração 1', 'operadora.demo1'),
  ('Operadora Demonstração 2', 'operadora.demo2');

-- [D5] Rodada em andamento: 18 alunos já alocados (mesmas decisões iniciais da aplicação)
INSERT INTO alocacao (aluno_id, turma_id, operadora_id)
SELECT a.id, t.id, o.id
  FROM (VALUES
    ('D-00100', 'peroba'),
    ('D-00121', 'jacaranda'),
    ('D-00142', 'ipe'),
    ('D-00149', 'ipe'),
    ('D-00163', 'paineira'),
    ('D-00184', 'ipe'),
    ('D-00198', 'jacaranda'),
    ('D-00219', 'paineira'),
    ('D-00233', 'peroba'),
    ('D-00268', 'peroba'),
    ('D-00289', 'jacaranda'),
    ('D-00296', 'peroba'),
    ('D-00352', 'peroba'),
    ('D-00359', 'cedro'),
    ('D-00380', 'paineira'),
    ('D-00401', 'jacaranda'),
    ('D-00422', 'jacaranda'),
    ('D-00429', 'paineira')
  ) AS v (cgm, escola)
  JOIN aluno a  ON a.cgm = v.cgm
  JOIN escola e ON e.codigo = v.escola
  JOIN turma t  ON t.escola_id = e.id AND t.serie_id = a.serie_id AND t.ano_letivo = 2027
  JOIN operadora o ON o.login = 'operadora.demo1'
 ORDER BY v.cgm;
