// Testes das regras de sugestão. Rodam com `npm test` (Node 24, que lê TypeScript sem compilar).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { avaliarAluno, decisoesIniciais, distanciaKm, ocupacaoPorDecisoes, situacaoDoAluno, vagasDaSerie } from '../src/lib/regras.ts'
import type { Aluno, Escola } from '../src/lib/tipos.ts'

const escola = (id: string, lat: number, lng: number, capacidade: number, matriculados: number): Escola => ({
  id,
  nome: `Escola ${id}`,
  setor: 'Setor Teste',
  lat,
  lng,
  turmas: [{ serie: '1º Ano', capacidade, matriculados }],
})

const aluno = (extra: Partial<Aluno> = {}): Aluno => ({
  id: 'x1',
  cgm: 'D-99999',
  nome: 'Criança Teste',
  serie: '1º Ano',
  origemId: 'sabia',
  turmaOrigem: 'Infantil 5 A',
  endereco: { logradouro: 'Rua Alfa', numero: 1, setor: 'Setor Teste' },
  lat: 0,
  lng: 0,
  irmaoEscolaId: null,
  preAlocado: false,
  ...extra,
})

// Escolas a ~1, ~2, ~3 e ~4 km ao norte do aluno.
const PERTO = escola('perto', 0.009, 0, 10, 5)
const MEDIA = escola('media', 0.018, 0, 10, 5)
const LONGE = escola('longe', 0.027, 0, 10, 5)
const MAIS_LONGE = escola('mais_longe', 0.036, 0, 10, 5)
const LOTADA = escola('lotada', 0.0045, 0, 10, 10)

test('Haversine: 1 grau de latitude tem cerca de 111 km', () => {
  assert.ok(Math.abs(distanciaKm(0, 0, 1, 0) - 111.19) < 0.1)
})

test('sugere as 3 escolas mais próximas, em ordem', () => {
  const { opcoes } = avaliarAluno(aluno(), [MAIS_LONGE, LONGE, PERTO, MEDIA], new Map())
  assert.deepEqual(opcoes.map((o) => o.escola.id), ['perto', 'media', 'longe'])
  assert.deepEqual(opcoes.map((o) => o.posicao), [1, 2, 3])
})

test('escola sem vaga na série nunca vira opção, mesmo sendo a mais próxima', () => {
  const { opcoes } = avaliarAluno(aluno(), [LOTADA, PERTO, MEDIA, LONGE], new Map())
  assert.ok(!opcoes.some((o) => o.escola.id === 'lotada'))
})

test('irmão em escola com vaga: essa escola é a 1ª opção, mesmo mais distante', () => {
  const r = avaliarAluno(aluno({ irmaoEscolaId: 'mais_longe' }), [PERTO, MEDIA, LONGE, MAIS_LONGE], new Map())
  assert.equal(r.casoIrmao, 'irmao_com_vaga')
  assert.deepEqual(r.opcoes.map((o) => o.escola.id), ['mais_longe', 'perto', 'media'])
})

test('irmão em escola sem vaga: só aviso, opções por proximidade', () => {
  const r = avaliarAluno(aluno({ irmaoEscolaId: 'lotada' }), [LOTADA, PERTO, MEDIA, LONGE], new Map())
  assert.equal(r.casoIrmao, 'irmao_sem_vaga')
  assert.equal(r.opcoes[0].escola.id, 'perto')
})

test('vagas descontam as decisões já tomadas na rodada', () => {
  const ocupacao = new Map([['perto', { 'Infantil 5': 0, '1º Ano': 5 }]])
  assert.deepEqual(vagasDaSerie(PERTO, '1º Ano', ocupacao), { capacidade: 10, ocupadas: 10, livres: 0 })
})

test('decisões iniciais nunca passam da capacidade', () => {
  const pequena = escola('pequena', 0.009, 0, 3, 1) // 2 vagas
  const alunos = Array.from({ length: 5 }, (_, i) => aluno({ id: `p${i}`, preAlocado: true }))
  const decisoes = decisoesIniciais(alunos, [pequena])
  assert.equal(Object.keys(decisoes).length, 2)
  assert.equal(ocupacaoPorDecisoes(alunos, decisoes).get('pequena')?.['1º Ano'], 2)
})

test('situação: sem decisão aguarda; com decisão, alocado ou homologado', () => {
  assert.equal(situacaoDoAluno('a', {}), 'aguardando')
  assert.equal(situacaoDoAluno('a', { a: { escolaId: 'e', homologado: false } }), 'alocado')
  assert.equal(situacaoDoAluno('a', { a: { escolaId: 'e', homologado: true } }), 'homologado')
})
