-- =============================================================================
-- Matrículas Escolares Cianorte — versão demonstrativa
-- 01_esquema.sql: tabelas, chaves, restrições, gatilhos e visões (PostgreSQL)
--
-- Modelo normalizado (3FN) das entidades da aplicação: setores, CMEIs de origem,
-- escolas, séries, turmas, alunos, operadoras, alocações e histórico.
-- Pode ser executado de novo a qualquer momento: recria o esquema do zero.
-- =============================================================================

DROP SCHEMA IF EXISTS matriculas CASCADE;
CREATE SCHEMA matriculas;
SET search_path TO matriculas;

-- -----------------------------------------------------------------------------
-- Tabelas de apoio
-- -----------------------------------------------------------------------------

-- Setor (bairro/região) da cidade, usado no endereço de escolas e alunos.
CREATE TABLE setor (
  id    smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome  varchar(40) NOT NULL UNIQUE
);

-- Série de destino no ano letivo (Infantil 5 ou 1º Ano).
CREATE TABLE serie (
  id     smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome   varchar(20) NOT NULL UNIQUE,
  ordem  smallint    NOT NULL UNIQUE CHECK (ordem > 0)
);

-- CMEI (Centro Municipal de Educação Infantil) de onde a criança vem.
CREATE TABLE cmei (
  id      integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo  varchar(20) NOT NULL UNIQUE,
  nome    varchar(80) NOT NULL UNIQUE
);

-- Escola municipal de destino.
CREATE TABLE escola (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo     varchar(20)  NOT NULL UNIQUE,
  nome       varchar(80)  NOT NULL UNIQUE,
  setor_id   smallint     NOT NULL REFERENCES setor (id),
  latitude   numeric(8,5) NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
  longitude  numeric(8,5) NOT NULL CHECK (longitude BETWEEN -180 AND 180)
);

-- Vagas de uma série numa escola, por ano letivo.
CREATE TABLE turma (
  id                       integer  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  escola_id                integer  NOT NULL REFERENCES escola (id),
  serie_id                 smallint NOT NULL REFERENCES serie (id),
  ano_letivo               smallint NOT NULL DEFAULT 2027 CHECK (ano_letivo BETWEEN 2020 AND 2100),
  capacidade               smallint NOT NULL CHECK (capacidade > 0),
  -- Crianças que já estavam na escola antes desta rodada de alocação.
  matriculados_anteriores  smallint NOT NULL DEFAULT 0,
  CONSTRAINT turma_unica UNIQUE (escola_id, serie_id, ano_letivo),
  CONSTRAINT turma_matriculados_validos CHECK (matriculados_anteriores BETWEEN 0 AND capacidade)
);

-- -----------------------------------------------------------------------------
-- Alunos e operadoras
-- -----------------------------------------------------------------------------

CREATE TABLE aluno (
  id               integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Código fictício: o prefixo D- (demonstração) impede a carga de um CGM real.
  cgm              varchar(10)  NOT NULL UNIQUE CHECK (cgm ~ '^D-[0-9]{5}$'),
  nome             varchar(120) NOT NULL CHECK (length(trim(nome)) > 0),
  serie_id         smallint     NOT NULL REFERENCES serie (id),
  cmei_id          integer      NOT NULL REFERENCES cmei (id),
  turma_origem     varchar(20)  NOT NULL,
  logradouro       varchar(80)  NOT NULL,
  numero           integer      NOT NULL CHECK (numero > 0),
  setor_id         smallint     NOT NULL REFERENCES setor (id),
  latitude         numeric(8,5) NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
  longitude        numeric(8,5) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  -- Escola onde um irmão já estuda, quando houver.
  irmao_escola_id  integer      REFERENCES escola (id),
  cadastrado_em    timestamptz  NOT NULL DEFAULT now()
);

-- Servidora da Secretaria que decide as alocações.
CREATE TABLE operadora (
  id     integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome   varchar(80) NOT NULL,
  login  varchar(40) NOT NULL UNIQUE CHECK (login ~ '^[a-z0-9.]+$'),
  ativa  boolean     NOT NULL DEFAULT true
);

-- -----------------------------------------------------------------------------
-- Alocação (decisão da operadora) e histórico
-- -----------------------------------------------------------------------------

-- Cada aluno tem no máximo uma alocação; sem linha aqui, ele está aguardando.
CREATE TABLE alocacao (
  id             integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aluno_id       integer     NOT NULL UNIQUE REFERENCES aluno (id),
  turma_id       integer     NOT NULL REFERENCES turma (id),
  operadora_id   integer     NOT NULL REFERENCES operadora (id),
  situacao       varchar(12) NOT NULL DEFAULT 'alocado' CHECK (situacao IN ('alocado', 'homologado')),
  alocado_em     timestamptz NOT NULL DEFAULT now(),
  homologado_em  timestamptz,
  CONSTRAINT alocacao_homologacao_coerente
    CHECK ((situacao = 'homologado') = (homologado_em IS NOT NULL))
);

-- Trilha de cada ação sobre as alocações. Só recebe inserções (ver gatilho).
CREATE TABLE historico_alocacao (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aluno_id       integer     NOT NULL REFERENCES aluno (id),
  acao           varchar(10) NOT NULL CHECK (acao IN ('alocou', 'trocou', 'homologou', 'desfez')),
  turma_id       integer     NOT NULL REFERENCES turma (id),
  operadora_id   integer     REFERENCES operadora (id),
  registrado_em  timestamptz NOT NULL DEFAULT now()
);

-- Índices nas chaves estrangeiras mais consultadas.
CREATE INDEX aluno_serie_idx      ON aluno (serie_id);
CREATE INDEX aluno_cmei_idx       ON aluno (cmei_id);
CREATE INDEX aluno_irmao_idx      ON aluno (irmao_escola_id) WHERE irmao_escola_id IS NOT NULL;
CREATE INDEX alocacao_turma_idx   ON alocacao (turma_id);
CREATE INDEX historico_aluno_idx  ON historico_alocacao (aluno_id);

-- -----------------------------------------------------------------------------
-- Funções e gatilhos: regras que o banco garante sozinho
-- -----------------------------------------------------------------------------

-- Distância em linha reta, em km (fórmula de Haversine), a mesma da aplicação.
CREATE FUNCTION distancia_km(lat1 float8, lng1 float8, lat2 float8, lng2 float8)
RETURNS float8
LANGUAGE sql IMMUTABLE STRICT
AS $$
  SELECT 2 * 6371 * asin(sqrt(
    sin(radians(lat2 - lat1) / 2) ^ 2
    + cos(radians(lat1)) * cos(radians(lat2)) * sin(radians(lng2 - lng1) / 2) ^ 2
  ))
$$;

-- Antes de gravar uma alocação: série compatível, vaga livre e homologação protegida.
CREATE FUNCTION validar_alocacao() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_turma         turma%ROWTYPE;
  v_serie_aluno   smallint;
  v_ocupadas      integer;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.situacao = 'homologado' AND NEW.turma_id <> OLD.turma_id THEN
    RAISE EXCEPTION 'alocação já homologada não pode trocar de turma (aluno %)', NEW.aluno_id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.situacao = 'homologado' AND OLD.situacao = 'alocado' THEN
    NEW.homologado_em := coalesce(NEW.homologado_em, now());
  END IF;

  IF TG_OP = 'INSERT' OR NEW.turma_id <> OLD.turma_id THEN
    -- Trava a turma: duas operadoras não ocupam a mesma última vaga ao mesmo tempo.
    SELECT * INTO v_turma FROM turma WHERE id = NEW.turma_id FOR UPDATE;
    SELECT serie_id INTO v_serie_aluno FROM aluno WHERE id = NEW.aluno_id;

    IF v_turma.serie_id <> v_serie_aluno THEN
      RAISE EXCEPTION 'a série da turma % não é a série do aluno %', NEW.turma_id, NEW.aluno_id;
    END IF;

    SELECT count(*) INTO v_ocupadas
      FROM alocacao
     WHERE turma_id = NEW.turma_id AND aluno_id <> NEW.aluno_id;

    IF v_turma.matriculados_anteriores + v_ocupadas >= v_turma.capacidade THEN
      RAISE EXCEPTION 'a turma % não tem vaga livre (capacidade %)', NEW.turma_id, v_turma.capacidade;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER alocacao_validar
  BEFORE INSERT OR UPDATE ON alocacao
  FOR EACH ROW EXECUTE FUNCTION validar_alocacao();

-- Depois de cada mudança numa alocação, registra a ação no histórico.
-- Na remoção, a operadora responsável vem da sessão (SET matriculas.operadora_id).
CREATE FUNCTION registrar_historico() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO historico_alocacao (aluno_id, acao, turma_id, operadora_id)
    VALUES (NEW.aluno_id, 'alocou', NEW.turma_id, NEW.operadora_id);
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.turma_id <> OLD.turma_id THEN
      INSERT INTO historico_alocacao (aluno_id, acao, turma_id, operadora_id)
      VALUES (NEW.aluno_id, 'trocou', NEW.turma_id, NEW.operadora_id);
    END IF;
    IF NEW.situacao = 'homologado' AND OLD.situacao = 'alocado' THEN
      INSERT INTO historico_alocacao (aluno_id, acao, turma_id, operadora_id)
      VALUES (NEW.aluno_id, 'homologou', NEW.turma_id, NEW.operadora_id);
    END IF;
  ELSE
    INSERT INTO historico_alocacao (aluno_id, acao, turma_id, operadora_id)
    VALUES (OLD.aluno_id, 'desfez', OLD.turma_id,
            coalesce(nullif(current_setting('matriculas.operadora_id', true), '')::integer, OLD.operadora_id));
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER alocacao_historico
  AFTER INSERT OR UPDATE OR DELETE ON alocacao
  FOR EACH ROW EXECUTE FUNCTION registrar_historico();

-- Histórico imutável: nenhuma linha pode ser alterada ou apagada.
CREATE FUNCTION bloquear_alteracao_historico() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'o histórico de alocações é imutável (% não permitido)', TG_OP;
END;
$$;

CREATE TRIGGER historico_imutavel
  BEFORE UPDATE OR DELETE ON historico_alocacao
  FOR EACH ROW EXECUTE FUNCTION bloquear_alteracao_historico();

-- -----------------------------------------------------------------------------
-- Visões usadas pelas telas e pelas consultas
-- -----------------------------------------------------------------------------

-- Ocupação de cada turma: já matriculados + alocados nesta rodada.
CREATE VIEW vw_ocupacao_turma AS
SELECT t.id                         AS turma_id,
       e.codigo                     AS escola_codigo,
       e.nome                       AS escola,
       s.nome                       AS serie,
       t.ano_letivo,
       t.capacidade,
       t.matriculados_anteriores,
       count(al.id)::integer        AS alocados_rodada,
       (t.capacidade - t.matriculados_anteriores - count(al.id))::integer AS vagas_livres
  FROM turma t
  JOIN escola e      ON e.id = t.escola_id
  JOIN serie s       ON s.id = t.serie_id
  LEFT JOIN alocacao al ON al.turma_id = t.id
 GROUP BY t.id, e.codigo, e.nome, s.nome, s.ordem
 ORDER BY e.nome, s.ordem;

-- Situação de cada aluno (aguardando, alocado ou homologado) e a escola decidida.
CREATE VIEW vw_situacao_aluno AS
SELECT a.id                                  AS aluno_id,
       a.cgm,
       a.nome,
       s.nome                                AS serie,
       c.nome                                AS cmei,
       coalesce(al.situacao, 'aguardando')   AS situacao,
       e.nome                                AS escola
  FROM aluno a
  JOIN serie s          ON s.id = a.serie_id
  JOIN cmei c           ON c.id = a.cmei_id
  LEFT JOIN alocacao al ON al.aluno_id = a.id
  LEFT JOIN turma t     ON t.id = al.turma_id
  LEFT JOIN escola e    ON e.id = t.escola_id;
