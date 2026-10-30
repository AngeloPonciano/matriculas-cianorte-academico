-- =============================================================================
-- 03_manipulacao.sql: inserção, atualização e remoção de dados
--
-- Simula um dia de trabalho da Secretaria sobre a rodada carregada em 02_dados.sql.
-- Os gatilhos do esquema validam cada alocação e registram o histórico sozinhos.
-- =============================================================================

SET search_path TO matriculas;

-- Operadora responsável pelas ações desta sessão (usada no histórico das remoções).
DO $$
BEGIN
  PERFORM set_config('matriculas.operadora_id',
                     (SELECT id::text FROM operadora WHERE login = 'operadora.demo2'), false);
END $$;

-- -----------------------------------------------------------------------------
-- INSERT
-- -----------------------------------------------------------------------------

-- [M1] INSERT: cadastra uma criança transferida de outro município (com irmão no Ipê Amarelo)
INSERT INTO aluno (cgm, nome, serie_id, cmei_id, turma_origem, logradouro, numero, setor_id,
                   latitude, longitude, irmao_escola_id)
VALUES ('D-00500', 'Valentina Rocha Lima',
        (SELECT id FROM serie WHERE nome = '1º Ano'),
        (SELECT id FROM cmei WHERE codigo = 'sabia'),
        'Infantil 5 A', 'Rua Gama', 215,
        (SELECT id FROM setor WHERE nome = 'Setor Central'),
        -23.66050, -52.60310,
        (SELECT id FROM escola WHERE codigo = 'ipe'));

-- Cadastro feito em duplicidade por engano (será removido em M8).
INSERT INTO aluno (cgm, nome, serie_id, cmei_id, turma_origem, logradouro, numero, setor_id,
                   latitude, longitude)
SELECT 'D-00501', nome, serie_id, cmei_id, turma_origem, logradouro, numero, setor_id, latitude, longitude
  FROM aluno
 WHERE cgm = 'D-00500';

SELECT a.cgm, a.nome, s.nome AS serie, c.nome AS cmei, e.nome AS escola_do_irmao
  FROM aluno a
  JOIN serie s ON s.id = a.serie_id
  JOIN cmei c  ON c.id = a.cmei_id
  LEFT JOIN escola e ON e.id = a.irmao_escola_id
 WHERE a.cgm IN ('D-00500', 'D-00501')
 ORDER BY a.cgm;

-- [M2] INSERT: aloca três alunos que aguardavam (a turma é encontrada pela escola e pela série do aluno)
INSERT INTO alocacao (aluno_id, turma_id, operadora_id)
SELECT a.id, t.id, o.id
  FROM (VALUES ('D-00500', 'ipe'),
               ('D-00107', 'jacaranda'),
               ('D-00114', 'jacaranda')) AS v (cgm, escola)
  JOIN aluno a     ON a.cgm = v.cgm
  JOIN escola e    ON e.codigo = v.escola
  JOIN turma t     ON t.escola_id = e.id AND t.serie_id = a.serie_id AND t.ano_letivo = 2027
  JOIN operadora o ON o.login = 'operadora.demo2';

SELECT cgm, nome, serie, situacao, escola
  FROM vw_situacao_aluno
 WHERE cgm IN ('D-00500', 'D-00107', 'D-00114')
 ORDER BY cgm;

-- -----------------------------------------------------------------------------
-- UPDATE
-- -----------------------------------------------------------------------------

-- [M3] UPDATE: amplia em 5 vagas o Infantil 5 da Aroeira, que estava lotado
UPDATE turma
   SET capacidade = capacidade + 5
 WHERE escola_id = (SELECT id FROM escola WHERE codigo = 'aroeira')
   AND serie_id  = (SELECT id FROM serie WHERE nome = 'Infantil 5')
   AND ano_letivo = 2027;

-- Com a vaga aberta, a criança cujo irmão estuda na Aroeira pode ir para lá.
INSERT INTO alocacao (aluno_id, turma_id, operadora_id)
SELECT a.id, t.id, (SELECT id FROM operadora WHERE login = 'operadora.demo2')
  FROM aluno a
  JOIN turma t ON t.escola_id = a.irmao_escola_id AND t.serie_id = a.serie_id AND t.ano_letivo = 2027
 WHERE a.cgm = 'D-00135';

SELECT escola, serie, capacidade, matriculados_anteriores, alocados_rodada, vagas_livres
  FROM vw_ocupacao_turma
 WHERE escola_codigo = 'aroeira';

-- [M4] UPDATE: troca a escola de uma aluna a pedido da família (Jacarandá → Paineira)
UPDATE alocacao al
   SET turma_id = t.id,
       operadora_id = (SELECT id FROM operadora WHERE login = 'operadora.demo2')
  FROM aluno a, turma t, escola e
 WHERE al.aluno_id = a.id
   AND a.cgm = 'D-00121'
   AND t.escola_id = e.id AND e.codigo = 'paineira'
   AND t.serie_id = a.serie_id AND t.ano_letivo = 2027;

SELECT cgm, nome, situacao, escola FROM vw_situacao_aluno WHERE cgm = 'D-00121';

-- [M5] UPDATE: corrige o endereço informado errado no cadastro
UPDATE aluno
   SET logradouro = 'Avenida Lambda',
       numero     = 480,
       setor_id   = (SELECT id FROM setor WHERE nome = 'Setor Norte')
 WHERE cgm = 'D-00114';

SELECT a.cgm, a.nome, a.logradouro, a.numero, s.nome AS setor
  FROM aluno a JOIN setor s ON s.id = a.setor_id
 WHERE a.cgm = 'D-00114';

-- [M6] UPDATE: homologa em lote todas as alocações da Escola Peroba Rosa
UPDATE alocacao
   SET situacao = 'homologado',
       operadora_id = (SELECT id FROM operadora WHERE login = 'operadora.demo2')
 WHERE situacao = 'alocado'
   AND turma_id IN (SELECT t.id FROM turma t JOIN escola e ON e.id = t.escola_id WHERE e.codigo = 'peroba');

SELECT a.cgm, a.nome, al.situacao, al.homologado_em IS NOT NULL AS tem_data_homologacao
  FROM alocacao al
  JOIN aluno a  ON a.id = al.aluno_id
  JOIN turma t  ON t.id = al.turma_id
  JOIN escola e ON e.id = t.escola_id
 WHERE e.codigo = 'peroba'
 ORDER BY a.nome;

-- -----------------------------------------------------------------------------
-- DELETE
-- -----------------------------------------------------------------------------

-- [M7] DELETE: desfaz uma alocação ainda não homologada (a aluna volta a aguardar)
DELETE FROM alocacao
 WHERE situacao = 'alocado'
   AND aluno_id = (SELECT id FROM aluno WHERE cgm = 'D-00401');

SELECT cgm, nome, situacao, escola FROM vw_situacao_aluno WHERE cgm = 'D-00401';

-- [M8] DELETE: remove o cadastro duplicado (sem alocação nem histórico, a chave estrangeira permite)
DELETE FROM aluno
 WHERE cgm = 'D-00501'
   AND NOT EXISTS (SELECT 1 FROM historico_alocacao h WHERE h.aluno_id = aluno.id);

SELECT count(*) AS cadastros_d00501 FROM aluno WHERE cgm = 'D-00501';

-- [M9] Histórico gerado automaticamente pelas ações desta sessão
SELECT a.cgm, a.nome, h.acao, e.nome AS escola, o.login AS operadora
  FROM historico_alocacao h
  JOIN aluno a     ON a.id = h.aluno_id
  JOIN turma t     ON t.id = h.turma_id
  JOIN escola e    ON e.id = t.escola_id
  LEFT JOIN operadora o ON o.id = h.operadora_id
 WHERE o.login = 'operadora.demo2'
 ORDER BY h.id;
