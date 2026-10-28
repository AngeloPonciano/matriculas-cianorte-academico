/**
 * Motor de regras da versão demonstrativa.
 *
 * Reproduz, de forma simplificada, as regras do sistema real:
 * - só escola com vaga na série do aluno vira opção;
 * - irmão numa escola com vaga → essa escola é sempre a 1ª opção;
 * - irmão numa escola sem vaga → só um aviso; as opções seguem a proximidade;
 * - as demais opções são as escolas mais próximas em linha reta (Haversine);
 * - a sugestão nunca decide sozinha: a operadora aprova ou escolhe outra escola.
 *
 * Funções puras, sem estado nem acesso a rede, testadas em tests/regras.test.ts.
 */

import type { Aluno, Decisoes, Escola, Serie, Situacao } from './tipos.ts'

export const TOTAL_OPCOES = 3

/** Distância em linha reta, em km, entre dois pontos (fórmula de Haversine). */
export function distanciaKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** Alunos que as decisões colocaram em cada escola, por série. */
export function ocupacaoPorDecisoes(
  alunos: Aluno[],
  decisoes: Decisoes,
): Map<string, Record<Serie, number>> {
  const mapa = new Map<string, Record<Serie, number>>()
  for (const aluno of alunos) {
    const decisao = decisoes[aluno.id]
    if (!decisao) continue
    const atual = mapa.get(decisao.escolaId) ?? { 'Infantil 5': 0, '1º Ano': 0 }
    atual[aluno.serie] += 1
    mapa.set(decisao.escolaId, atual)
  }
  return mapa
}

export interface VagasSerie {
  capacidade: number
  ocupadas: number
  livres: number
}

/** Vagas da série numa escola, somando os já matriculados e as decisões desta rodada. */
export function vagasDaSerie(
  escola: Escola,
  serie: Serie,
  ocupacao: Map<string, Record<Serie, number>>,
): VagasSerie {
  const turma = escola.turmas.find((t) => t.serie === serie)
  if (!turma) return { capacidade: 0, ocupadas: 0, livres: 0 }
  const ocupadas = turma.matriculados + (ocupacao.get(escola.id)?.[serie] ?? 0)
  return { capacidade: turma.capacidade, ocupadas, livres: Math.max(0, turma.capacidade - ocupadas) }
}

export type CasoIrmao = 'sem_irmao' | 'irmao_com_vaga' | 'irmao_sem_vaga'

export interface EscolaAvaliada {
  escola: Escola
  distanciaKm: number
  vagas: VagasSerie
  temIrmao: boolean
  /** 1, 2 ou 3 quando é uma das opções sugeridas. */
  posicao: number | null
}

export interface Avaliacao {
  casoIrmao: CasoIrmao
  /** Todas as escolas, das mais próximas para as mais distantes. */
  escolas: EscolaAvaliada[]
  /** Até 3 opções sugeridas, na ordem. */
  opcoes: EscolaAvaliada[]
}

/**
 * Avalia um aluno contra as escolas.
 * `ocupacao` deve vir SEM a decisão do próprio aluno, para que a vaga dele
 * não conte contra ele mesmo.
 */
export function avaliarAluno(
  aluno: Aluno,
  escolas: Escola[],
  ocupacao: Map<string, Record<Serie, number>>,
): Avaliacao {
  const avaliadas: EscolaAvaliada[] = escolas
    .map((escola) => ({
      escola,
      distanciaKm: distanciaKm(aluno.lat, aluno.lng, escola.lat, escola.lng),
      vagas: vagasDaSerie(escola, aluno.serie, ocupacao),
      temIrmao: escola.id === aluno.irmaoEscolaId,
      posicao: null as number | null,
    }))
    .sort((a, b) => a.distanciaKm - b.distanciaKm)

  const comVaga = avaliadas.filter((e) => e.vagas.livres > 0)
  const irmao = avaliadas.find((e) => e.temIrmao)

  let casoIrmao: CasoIrmao = 'sem_irmao'
  let opcoes: EscolaAvaliada[]
  if (irmao && irmao.vagas.livres > 0) {
    casoIrmao = 'irmao_com_vaga'
    opcoes = [irmao, ...comVaga.filter((e) => e !== irmao)].slice(0, TOTAL_OPCOES)
  } else {
    if (irmao) casoIrmao = 'irmao_sem_vaga'
    opcoes = comVaga.slice(0, TOTAL_OPCOES)
  }
  opcoes.forEach((e, i) => (e.posicao = i + 1))

  return { casoIrmao, escolas: avaliadas, opcoes }
}

/**
 * Decisões com que a demonstração começa: os alunos marcados como `preAlocado`
 * recebem a 1ª opção, um de cada vez, respeitando as vagas que vão sendo ocupadas.
 * Simula uma rodada já em andamento.
 */
export function decisoesIniciais(alunos: Aluno[], escolas: Escola[]): Decisoes {
  const decisoes: Decisoes = {}
  for (const aluno of alunos) {
    if (!aluno.preAlocado) continue
    const { opcoes } = avaliarAluno(aluno, escolas, ocupacaoPorDecisoes(alunos, decisoes))
    if (opcoes.length > 0) decisoes[aluno.id] = { escolaId: opcoes[0].escola.id, homologado: false }
  }
  return decisoes
}

export function situacaoDoAluno(alunoId: string, decisoes: Decisoes): Situacao {
  const d = decisoes[alunoId]
  if (!d) return 'aguardando'
  return d.homologado ? 'homologado' : 'alocado'
}

export const ROTULO_SITUACAO: Record<Situacao, string> = {
  aguardando: 'Aguardando alocação',
  alocado: 'Alocado',
  homologado: 'Homologado',
}
