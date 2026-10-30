-- =============================================================================
-- 05_restricoes.sql: o banco recusando dados inválidos
--
-- Cada bloco tenta uma operação proibida. O erro é capturado e anotado numa
-- tabela temporária; ao final, a consulta mostra o que o PostgreSQL respondeu.
-- Se alguma operação fosse aceita, a coluna "resultado" mostraria ACEITO.
-- =============================================================================

SET search_path TO matriculas;

CREATE TEMP TABLE verificacao (
  ordem      serial PRIMARY KEY,
  restricao  text NOT NULL,
  resultado  text NOT NULL,
  mensagem   text
);

-- Tenta executar `comando`; registra se foi bloqueado e qual foi o erro.
CREATE FUNCTION pg_temp.tentar(restricao text, comando text) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE comando;
  INSERT INTO verificacao (restricao, resultado) VALUES (restricao, 'ACEITO');
EXCEPTION WHEN OTHERS THEN
  INSERT INTO verificacao (restricao, resultado, mensagem)
  VALUES (restricao, 'bloqueado (' || SQLSTATE || ')', SQLERRM);
END;
$$;

-- [R1] CHECK: CGM fora do padrão fictício D-00000
SELECT FROM pg_temp.tentar('CHECK: CGM fora do padrão D-', $sql$
  INSERT INTO aluno (cgm, nome, serie_id, cmei_id, turma_origem, logradouro, numero, setor_id, latitude, longitude)
  VALUES ('12345678', 'Teste', 1, 1, 'Infantil 4 A', 'Rua Alfa', 10, 1, -23.66, -52.60)
$sql$);

-- [R2] UNIQUE: dois alunos com o mesmo CGM
SELECT FROM pg_temp.tentar('UNIQUE: CGM repetido', $sql$
  INSERT INTO aluno (cgm, nome, serie_id, cmei_id, turma_origem, logradouro, numero, setor_id, latitude, longitude)
  VALUES ('D-00100', 'Teste', 1, 1, 'Infantil 4 A', 'Rua Alfa', 10, 1, -23.66, -52.60)
$sql$);

-- [R3] FOREIGN KEY: aluno vindo de um CMEI que não existe
SELECT FROM pg_temp.tentar('FOREIGN KEY: CMEI inexistente', $sql$
  INSERT INTO aluno (cgm, nome, serie_id, cmei_id, turma_origem, logradouro, numero, setor_id, latitude, longitude)
  VALUES ('D-00900', 'Teste', 1, 999, 'Infantil 4 A', 'Rua Alfa', 10, 1, -23.66, -52.60)
$sql$);

-- [R4] CHECK: turma com mais matriculados do que vagas
SELECT FROM pg_temp.tentar('CHECK: matriculados acima da capacidade', $sql$
  UPDATE turma SET matriculados_anteriores = capacidade + 1
   WHERE id = (SELECT min(id) FROM turma)
$sql$);

-- [R5] Gatilho: aluno do Infantil 5 numa turma de 1º Ano
SELECT FROM pg_temp.tentar('Gatilho: série da turma diferente da do aluno', $sql$
  INSERT INTO alocacao (aluno_id, turma_id, operadora_id)
  SELECT a.id, t.id, 1
    FROM aluno a, turma t, escola e, serie s
   WHERE a.cgm = 'D-00128'
     AND t.escola_id = e.id AND e.codigo = 'aroeira'
     AND t.serie_id = s.id AND s.nome = '1º Ano'
$sql$);

-- [R6] Gatilho: turma sem vaga (1º Ano da Cedro está lotado)
SELECT FROM pg_temp.tentar('Gatilho: turma sem vaga livre', $sql$
  INSERT INTO alocacao (aluno_id, turma_id, operadora_id)
  SELECT a.id, t.id, 1
    FROM aluno a, turma t, escola e
   WHERE a.cgm = 'D-00247'
     AND t.escola_id = e.id AND e.codigo = 'cedro' AND t.serie_id = a.serie_id
$sql$);

-- [R7] UNIQUE: segunda alocação para o mesmo aluno
SELECT FROM pg_temp.tentar('UNIQUE: aluno alocado duas vezes', $sql$
  INSERT INTO alocacao (aluno_id, turma_id, operadora_id)
  SELECT a.id, t.id, 1
    FROM aluno a, turma t, escola e
   WHERE a.cgm = 'D-00142'
     AND t.escola_id = e.id AND e.codigo = 'jacaranda' AND t.serie_id = a.serie_id
$sql$);

-- [R8] CHECK: alocação homologada sem data de homologação
SELECT FROM pg_temp.tentar('CHECK: homologado sem data', $sql$
  INSERT INTO alocacao (aluno_id, turma_id, operadora_id, situacao)
  SELECT a.id, t.id, 1, 'homologado'
    FROM aluno a, turma t, escola e
   WHERE a.cgm = 'D-00128'
     AND t.escola_id = e.id AND e.codigo = 'ipe' AND t.serie_id = a.serie_id
$sql$);

-- [R9] Gatilho: trocar a escola de uma alocação já homologada
SELECT FROM pg_temp.tentar('Gatilho: troca após homologação', $sql$
  UPDATE alocacao al SET turma_id = t.id
    FROM aluno a, turma t, escola e
   WHERE al.aluno_id = a.id AND a.cgm = 'D-00100'
     AND t.escola_id = e.id AND e.codigo = 'ipe' AND t.serie_id = a.serie_id
$sql$);

-- [R10] Gatilho: alterar ou apagar o histórico
SELECT FROM pg_temp.tentar('Gatilho: histórico imutável (UPDATE)', $sql$
  UPDATE historico_alocacao SET acao = 'desfez' WHERE id = 1
$sql$);
SELECT FROM pg_temp.tentar('Gatilho: histórico imutável (DELETE)', $sql$
  DELETE FROM historico_alocacao WHERE id = 1
$sql$);

-- [R11] FOREIGN KEY: apagar aluno que tem histórico
SELECT FROM pg_temp.tentar('FOREIGN KEY: aluno com histórico não é apagado', $sql$
  DELETE FROM aluno WHERE cgm = 'D-00401'
$sql$);

-- [R12] Resultado das verificações
SELECT ordem, restricao, resultado, mensagem FROM verificacao ORDER BY ordem;
