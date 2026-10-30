-- =============================================================================
-- 04_consultas.sql: consultas que respondem às perguntas da Secretaria
--
-- Junções, agregações, subconsultas, visões e função de janela sobre o estado
-- da rodada (depois das ações de 03_manipulacao.sql).
-- =============================================================================

SET search_path TO matriculas;

-- [C1] Lista de alunos com série, CMEI de origem, situação e escola decidida (JOIN e LEFT JOIN)
SELECT a.cgm,
       a.nome,
       s.nome                                 AS serie,
       c.nome                                 AS cmei,
       coalesce(al.situacao, 'aguardando')    AS situacao,
       e.nome                                 AS escola
  FROM aluno a
  JOIN serie s          ON s.id = a.serie_id
  JOIN cmei c           ON c.id = a.cmei_id
  LEFT JOIN alocacao al ON al.aluno_id = a.id
  LEFT JOIN turma t     ON t.id = al.turma_id
  LEFT JOIN escola e    ON e.id = t.escola_id
 ORDER BY a.nome;

-- [C2] Ocupação de cada escola por série, com percentual (visão vw_ocupacao_turma)
SELECT escola,
       serie,
       capacidade,
       matriculados_anteriores,
       alocados_rodada,
       vagas_livres,
       round(100.0 * (capacidade - vagas_livres) / capacidade, 1) AS ocupacao_pct
  FROM vw_ocupacao_turma;

-- [C3] Totais da rodada por situação (GROUP BY)
SELECT situacao,
       count(*)                                            AS alunos,
       round(100.0 * count(*) / sum(count(*)) OVER (), 1)  AS percentual
  FROM vw_situacao_aluno
 GROUP BY situacao
 ORDER BY alunos DESC;

-- [C4] Andamento por CMEI de origem (agregação condicional com FILTER)
SELECT c.nome                                                 AS cmei,
       count(*)                                               AS alunos,
       count(*) FILTER (WHERE al.id IS NULL)                  AS aguardando,
       count(*) FILTER (WHERE al.situacao = 'alocado')        AS alocados,
       count(*) FILTER (WHERE al.situacao = 'homologado')     AS homologados
  FROM aluno a
  JOIN cmei c           ON c.id = a.cmei_id
  LEFT JOIN alocacao al ON al.aluno_id = a.id
 GROUP BY c.nome
 ORDER BY c.nome;

-- [C5] Escolas com ocupação total de 85% ou mais, e as séries já lotadas (HAVING)
SELECT escola,
       sum(capacidade)                                     AS capacidade,
       sum(capacidade - vagas_livres)                      AS ocupadas,
       round(100.0 * sum(capacidade - vagas_livres) / sum(capacidade), 1) AS ocupacao_pct,
       string_agg(serie, ', ') FILTER (WHERE vagas_livres = 0)            AS series_lotadas
  FROM vw_ocupacao_turma
 GROUP BY escola
HAVING 100.0 * sum(capacidade - vagas_livres) / sum(capacidade) >= 85
 ORDER BY ocupacao_pct DESC, escola;

-- [C6] Alunos aguardando cujo irmão estuda numa escola com vaga na série (EXISTS)
SELECT a.cgm, a.nome, s.nome AS serie, e.nome AS escola_do_irmao, o.vagas_livres
  FROM aluno a
  JOIN serie s  ON s.id = a.serie_id
  JOIN escola e ON e.id = a.irmao_escola_id
  JOIN turma t  ON t.escola_id = e.id AND t.serie_id = a.serie_id AND t.ano_letivo = 2027
  JOIN vw_ocupacao_turma o ON o.turma_id = t.id
 WHERE o.vagas_livres > 0
   AND NOT EXISTS (SELECT 1 FROM alocacao al WHERE al.aluno_id = a.id)
 ORDER BY a.nome;

-- [C7] Até 3 escolas sugeridas para cada aluno aguardando (mesma regra da aplicação)
-- Só escola com vaga na série; irmão com vaga vem primeiro; depois, as mais próximas.
WITH candidatas AS (
  SELECT a.id                                       AS aluno_id,
         a.cgm,
         a.nome,
         e.codigo                                   AS escola_codigo,
         e.nome                                     AS escola,
         distancia_km(a.latitude::float8, a.longitude::float8,
                      e.latitude::float8, e.longitude::float8) AS km,
         coalesce(e.id = a.irmao_escola_id, false)  AS irmao
    FROM aluno a
    JOIN turma t  ON t.serie_id = a.serie_id AND t.ano_letivo = 2027
    JOIN escola e ON e.id = t.escola_id
    JOIN vw_ocupacao_turma o ON o.turma_id = t.id
   WHERE o.vagas_livres > 0
     AND NOT EXISTS (SELECT 1 FROM alocacao al WHERE al.aluno_id = a.id)
),
ordenadas AS (
  SELECT *, row_number() OVER (PARTITION BY aluno_id ORDER BY irmao DESC, km) AS posicao
    FROM candidatas
)
SELECT cgm, nome, posicao, escola_codigo, escola, round(km::numeric, 2) AS distancia_km, irmao
  FROM ordenadas
 WHERE posicao <= 3
 ORDER BY nome, posicao;

-- [C8] Distância média e máxima entre casa e escola dos alunos já decididos, por escola
SELECT e.nome                                  AS escola,
       count(*)                                AS alunos,
       round(avg(distancia_km(a.latitude::float8, a.longitude::float8,
                              e.latitude::float8, e.longitude::float8))::numeric, 2) AS km_media,
       round(max(distancia_km(a.latitude::float8, a.longitude::float8,
                              e.latitude::float8, e.longitude::float8))::numeric, 2) AS km_maxima
  FROM alocacao al
  JOIN aluno a  ON a.id = al.aluno_id
  JOIN turma t  ON t.id = al.turma_id
  JOIN escola e ON e.id = t.escola_id
 GROUP BY e.nome
 ORDER BY km_media;

-- [C9] Ações registradas no histórico, por operadora e tipo
SELECT o.nome AS operadora, h.acao, count(*) AS acoes
  FROM historico_alocacao h
  JOIN operadora o ON o.id = h.operadora_id
 GROUP BY o.nome, h.acao
 ORDER BY o.nome, acoes DESC;

-- [C10] Linha do tempo de uma aluna (alocada, depois trocada de escola)
SELECT h.id AS ordem, h.acao, e.nome AS escola, o.login AS operadora
  FROM historico_alocacao h
  JOIN aluno a     ON a.id = h.aluno_id
  JOIN turma t     ON t.id = h.turma_id
  JOIN escola e    ON e.id = t.escola_id
  JOIN operadora o ON o.id = h.operadora_id
 WHERE a.cgm = 'D-00121'
 ORDER BY h.id;
