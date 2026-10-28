import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ALUNOS } from '../src/data/alunos.ts'
import { ESCOLAS, ORIGENS } from '../src/data/escolas.ts'
import { CABECALHO_CSV, gerarCsv, linhasHomologadas } from '../src/lib/exportar.ts'

test('só entram os homologados, ordenados por escola e nome', () => {
  const [a, b, c] = ALUNOS
  const decisoes = {
    [a.id]: { escolaId: 'peroba', homologado: true },
    [b.id]: { escolaId: 'cedro', homologado: true },
    [c.id]: { escolaId: 'cedro', homologado: false },
  }
  const linhas = linhasHomologadas(ALUNOS, decisoes, ESCOLAS, ORIGENS)
  assert.equal(linhas.length, 2)
  assert.deepEqual(linhas.map((l) => l[0]), ['Escola Municipal Cedro', 'Escola Municipal Peroba Rosa'])
  assert.equal(linhas[0].length, CABECALHO_CSV.length)
})

test('CSV com BOM, ponto e vírgula e aspas quando preciso', () => {
  const csv = gerarCsv([['Escola; X', 'diz "oi"']], ['A', 'B'])
  assert.ok(csv.startsWith('﻿A;B\r\n'))
  assert.ok(csv.includes('"Escola; X";"diz ""oi"""'))
})
