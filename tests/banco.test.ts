// Confere o banco de dados (database/*.sql) contra a aplicação: mesma carga,
// mesma ocupação, mesmas sugestões, e as restrições recusando dados inválidos.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bancoCarregado, executarArquivo, lerBlocos } from '../database/banco.ts'
import { ALUNOS } from '../src/data/alunos.ts'
import { ESCOLAS, ORIGENS } from '../src/data/escolas.ts'
import { avaliarAluno, decisoesIniciais, ocupacaoPorDecisoes, vagasDaSerie } from '../src/lib/regras.ts'

const DECISOES = decisoesIniciais(ALUNOS, ESCOLAS)

async function contar(db: Awaited<ReturnType<typeof bancoCarregado>>, tabela: string): Promise<number> {
  const { rows } = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM matriculas.${tabela}`)
  return rows[0].n
}

test('a carga inicial tem os mesmos dados da aplicação', async () => {
  const db = await bancoCarregado()
  assert.equal(await contar(db, 'escola'), ESCOLAS.length)
  assert.equal(await contar(db, 'turma'), ESCOLAS.reduce((n, e) => n + e.turmas.length, 0))
  assert.equal(await contar(db, 'cmei'), ORIGENS.length)
  assert.equal(await contar(db, 'aluno'), ALUNOS.length)
  assert.equal(await contar(db, 'alocacao'), Object.keys(DECISOES).length)
  // Cada alocação inicial gerou exatamente uma linha de histórico.
  assert.equal(await contar(db, 'historico_alocacao'), Object.keys(DECISOES).length)
  await db.close()
})

test('a visão de ocupação bate com o cálculo de vagas da aplicação', async () => {
  const db = await bancoCarregado()
  const { rows } = await db.query<{ escola_codigo: string; serie: string; vagas_livres: number }>(
    'SELECT escola_codigo, serie, vagas_livres FROM matriculas.vw_ocupacao_turma',
  )
  const ocupacao = ocupacaoPorDecisoes(ALUNOS, DECISOES)
  for (const escola of ESCOLAS) {
    for (const turma of escola.turmas) {
      const linha = rows.find((r) => r.escola_codigo === escola.id && r.serie === turma.serie)
      assert.ok(linha, `${escola.id} / ${turma.serie} ausente na visão`)
      assert.equal(linha.vagas_livres, vagasDaSerie(escola, turma.serie, ocupacao).livres, `${escola.id} / ${turma.serie}`)
    }
  }
  await db.close()
})

test('a consulta de sugestões (C7) dá as mesmas 3 escolas que o motor de regras', async () => {
  const db = await bancoCarregado()
  const c7 = lerBlocos('04_consultas.sql').find((b) => b.id === 'C7')
  assert.ok(c7)
  const [resultado] = (await db.exec(`SET search_path TO matriculas; ${c7.sql}`)).filter((r) => r.fields.length > 0)
  const linhas = resultado.rows as { cgm: string; posicao: number; escola_codigo: string }[]

  const ocupacao = ocupacaoPorDecisoes(ALUNOS, DECISOES)
  const aguardando = ALUNOS.filter((a) => !DECISOES[a.id])
  assert.ok(aguardando.length > 0)
  for (const aluno of aguardando) {
    const esperado = avaliarAluno(aluno, ESCOLAS, ocupacao).opcoes.map((o) => o.escola.id)
    const doBanco = linhas
      .filter((l) => l.cgm === aluno.cgm)
      .sort((x, y) => x.posicao - y.posicao)
      .map((l) => l.escola_codigo)
    assert.deepEqual(doBanco, esperado, aluno.cgm)
  }
  await db.close()
})

test('as manipulações deixam a rodada no estado esperado', async () => {
  const db = await bancoCarregado('03_manipulacao.sql')
  const situacao = async (cgm: string) =>
    (await db.query<{ situacao: string; escola: string | null }>(
      'SELECT situacao, escola FROM matriculas.vw_situacao_aluno WHERE cgm = $1',
      [cgm],
    )).rows[0]

  assert.deepEqual(await situacao('D-00500'), { situacao: 'alocado', escola: 'Escola Municipal Ipê Amarelo' })
  assert.deepEqual(await situacao('D-00121'), { situacao: 'alocado', escola: 'Escola Municipal Paineira' })
  assert.deepEqual(await situacao('D-00401'), { situacao: 'aguardando', escola: null })
  assert.equal(await situacao('D-00501'), undefined)

  const { rows } = await db.query<{ situacao: string; com_data: boolean }>(`
    SELECT DISTINCT al.situacao, al.homologado_em IS NOT NULL AS com_data
      FROM matriculas.alocacao al
      JOIN matriculas.turma t  ON t.id = al.turma_id
      JOIN matriculas.escola e ON e.id = t.escola_id
     WHERE e.codigo = 'peroba'`)
  assert.deepEqual(rows, [{ situacao: 'homologado', com_data: true }])
  await db.close()
})

test('todas as operações proibidas são bloqueadas pelo banco', async () => {
  const db = await bancoCarregado('04_consultas.sql')
  const blocos = await executarArquivo(db, '05_restricoes.sql')
  const resultado = blocos.at(-1)?.resultados[0]
  assert.ok(resultado)
  const linhas = resultado.rows as { restricao: string; resultado: string }[]
  assert.equal(linhas.length, 12)
  for (const l of linhas) assert.match(l.resultado, /^bloqueado/, l.restricao)
  await db.close()
})
