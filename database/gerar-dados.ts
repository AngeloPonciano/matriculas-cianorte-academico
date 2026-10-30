/**
 * Gera `02_dados.sql` a partir dos mesmos dados FICTÍCIOS da aplicação
 * (src/data), para o banco e as telas mostrarem exatamente a mesma rodada.
 *
 * Uso: npm run db:dados
 */

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ALUNOS } from '../src/data/alunos.ts'
import { ESCOLAS, ORIGENS } from '../src/data/escolas.ts'
import { decisoesIniciais } from '../src/lib/regras.ts'
import { SERIES } from '../src/lib/tipos.ts'
import { PASTA } from './banco.ts'

const texto = (valor: string) => `'${valor.replace(/'/g, "''")}'`
const lista = (linhas: string[]) => linhas.join(',\n') + ';'

const setores = [...new Set([...ESCOLAS.map((e) => e.setor), ...ALUNOS.map((a) => a.endereco.setor)])].sort()
const alunos = [...ALUNOS].sort((a, b) => a.cgm.localeCompare(b.cgm))
const decisoes = decisoesIniciais(ALUNOS, ESCOLAS)
const preAlocados = alunos.filter((a) => decisoes[a.id])

const sql = `-- =============================================================================
-- 02_dados.sql: carga inicial com dados FICTÍCIOS
--
-- Arquivo GERADO por database/gerar-dados.ts a partir de src/data (não editar à mão).
-- Nomes sorteados de listas comuns, CGM com prefixo D-, ruas com letras gregas,
-- escolas com nomes de árvores e CMEIs com nomes de aves. Nenhum dado real.
-- =============================================================================

SET search_path TO matriculas;

-- [D1] Setores, séries e CMEIs
INSERT INTO setor (nome) VALUES
${lista(setores.map((s) => `  (${texto(s)})`))}

INSERT INTO serie (nome, ordem) VALUES
${lista(SERIES.map((s, i) => `  (${texto(s)}, ${i + 1})`))}

INSERT INTO cmei (codigo, nome) VALUES
${lista(ORIGENS.map((o) => `  (${texto(o.id)}, ${texto(o.nome)})`))}

-- [D2] Escolas e turmas de 2027
INSERT INTO escola (codigo, nome, setor_id, latitude, longitude)
SELECT v.codigo, v.nome, s.id, v.latitude, v.longitude
  FROM (VALUES
${ESCOLAS.map((e) => `    (${texto(e.id)}, ${texto(e.nome)}, ${texto(e.setor)}, ${e.lat}, ${e.lng})`).join(',\n')}
  ) AS v (codigo, nome, setor, latitude, longitude)
  JOIN setor s ON s.nome = v.setor;

INSERT INTO turma (escola_id, serie_id, ano_letivo, capacidade, matriculados_anteriores)
SELECT e.id, s.id, 2027, v.capacidade, v.matriculados
  FROM (VALUES
${ESCOLAS.flatMap((e) => e.turmas.map((t) => `    (${texto(e.id)}, ${texto(t.serie)}, ${t.capacidade}, ${t.matriculados})`)).join(',\n')}
  ) AS v (escola, serie, capacidade, matriculados)
  JOIN escola e ON e.codigo = v.escola
  JOIN serie s  ON s.nome = v.serie;

-- [D3] Alunos (${alunos.length}, todos fictícios)
INSERT INTO aluno (cgm, nome, serie_id, cmei_id, turma_origem, logradouro, numero, setor_id,
                   latitude, longitude, irmao_escola_id)
SELECT v.cgm, v.nome, s.id, c.id, v.turma_origem, v.logradouro, v.numero, st.id,
       v.latitude, v.longitude, e.id
  FROM (VALUES
${alunos
  .map(
    (a) =>
      `    (${texto(a.cgm)}, ${texto(a.nome)}, ${texto(a.serie)}, ${texto(a.origemId)}, ${texto(a.turmaOrigem)}, ` +
      `${texto(a.endereco.logradouro)}, ${a.endereco.numero}, ${texto(a.endereco.setor)}, ${a.lat}, ${a.lng}, ` +
      `${a.irmaoEscolaId ? texto(a.irmaoEscolaId) : 'NULL'})`,
  )
  .join(',\n')}
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

-- [D5] Rodada em andamento: ${preAlocados.length} alunos já alocados (mesmas decisões iniciais da aplicação)
INSERT INTO alocacao (aluno_id, turma_id, operadora_id)
SELECT a.id, t.id, o.id
  FROM (VALUES
${preAlocados.map((a) => `    (${texto(a.cgm)}, ${texto(decisoes[a.id].escolaId)})`).join(',\n')}
  ) AS v (cgm, escola)
  JOIN aluno a  ON a.cgm = v.cgm
  JOIN escola e ON e.codigo = v.escola
  JOIN turma t  ON t.escola_id = e.id AND t.serie_id = a.serie_id AND t.ano_letivo = 2027
  JOIN operadora o ON o.login = 'operadora.demo1'
 ORDER BY v.cgm;
`

writeFileSync(join(PASTA, '02_dados.sql'), sql)
console.log(`02_dados.sql gerado: ${ESCOLAS.length} escolas, ${alunos.length} alunos, ${preAlocados.length} alocações.`)
