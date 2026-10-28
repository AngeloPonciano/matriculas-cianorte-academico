/**
 * Tipos da versão demonstrativa.
 * Espelham, de forma simplificada, as entidades do sistema real
 * (aluno, escola, turma, unidade de origem), sem nenhum dado pessoal.
 */

export type Serie = 'Infantil 5' | '1º Ano'

export const SERIES: Serie[] = ['Infantil 5', '1º Ano']

export interface Turma {
  serie: Serie
  /** Vagas totais da série na escola. */
  capacidade: number
  /** Matriculados que já estavam na escola antes desta rodada. */
  matriculados: number
}

/** Escola municipal de destino. */
export interface Escola {
  id: string
  nome: string
  setor: string
  lat: number
  lng: number
  turmas: Turma[]
}

/** CMEI de onde a criança vem. */
export interface UnidadeOrigem {
  id: string
  nome: string
}

export interface Endereco {
  logradouro: string
  numero: number
  setor: string
}

export interface Aluno {
  id: string
  /** Código fictício, sempre com prefixo D- (demonstração). */
  cgm: string
  nome: string
  serie: Serie
  origemId: string
  turmaOrigem: string
  endereco: Endereco
  lat: number
  lng: number
  /** Escola municipal onde um irmão já estuda, quando houver. */
  irmaoEscolaId: string | null
  /** Entra na demonstração já alocado (simula decisões anteriores). */
  preAlocado: boolean
}

export type Situacao = 'aguardando' | 'alocado' | 'homologado'

export interface Decisao {
  escolaId: string
  homologado: boolean
}

/** Decisões da operadora, por id do aluno. */
export type Decisoes = Record<string, Decisao>
