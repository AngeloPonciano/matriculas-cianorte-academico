// Garante que os dados da demonstração são os fictícios gerados por sorteio, e que os filtros funcionam.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ALUNOS, gerarAlunos } from '../src/data/alunos.ts'
import { ESCOLAS, ORIGENS } from '../src/data/escolas.ts'
import { FILTROS_VAZIOS, filtrarAlunos, filtrosDaUrl, filtrosParaUrl, normalizar } from '../src/lib/filtros.ts'

test('a semente fixa gera sempre a mesma lista', () => {
  assert.deepEqual(gerarAlunos(), ALUNOS)
})

test('todo CGM é fictício (prefixo D-) e único', () => {
  assert.ok(ALUNOS.every((a) => /^D-\d{5}$/.test(a.cgm)))
  assert.equal(new Set(ALUNOS.map((a) => a.cgm)).size, ALUNOS.length)
})

test('todo logradouro é sintético (letras gregas)', () => {
  assert.ok(ALUNOS.every((a) => /^(Rua|Avenida) (Alfa|Beta|Gama|Delta|Épsilon|Zeta|Eta|Teta|Iota|Capa|Lambda|Ômega)$/.test(a.endereco.logradouro)))
})

test('irmão e origem sempre apontam para unidades existentes', () => {
  const escolas = new Set(ESCOLAS.map((e) => e.id))
  const origens = new Set(ORIGENS.map((o) => o.id))
  for (const a of ALUNOS) {
    assert.ok(origens.has(a.origemId))
    if (a.irmaoEscolaId) assert.ok(escolas.has(a.irmaoEscolaId))
  }
})

test('busca ignora acento e caixa', () => {
  assert.equal(normalizar('  Lívia '), 'livia')
  const alguem = ALUNOS[0]
  const achados = filtrarAlunos(ALUNOS, {}, { ...FILTROS_VAZIOS, busca: normalizar(alguem.nome).toUpperCase() })
  assert.ok(achados.some((a) => a.id === alguem.id))
})

test('filtro de situação usa as decisões', () => {
  const [a, b] = ALUNOS
  const decisoes = { [a.id]: { escolaId: 'ipe', homologado: false }, [b.id]: { escolaId: 'ipe', homologado: true } }
  assert.deepEqual(filtrarAlunos(ALUNOS, decisoes, { ...FILTROS_VAZIOS, situacao: 'alocado' }).map((x) => x.id), [a.id])
  assert.deepEqual(filtrarAlunos(ALUNOS, decisoes, { ...FILTROS_VAZIOS, situacao: 'homologado' }).map((x) => x.id), [b.id])
})

test('filtros vão e voltam da URL sem perder nada', () => {
  const f = { busca: 'ana', origem: 'sabia', serie: '1º Ano' as const, situacao: 'alocado' as const, soIrmaos: true }
  assert.deepEqual(filtrosDaUrl(new URLSearchParams(filtrosParaUrl(f).slice(1))), f)
  assert.equal(filtrosParaUrl(FILTROS_VAZIOS), '')
})
