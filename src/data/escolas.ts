import type { Escola, UnidadeOrigem } from '../lib/tipos.ts'

/**
 * Escolas FICTÍCIAS. Os nomes (árvores) e as posições foram inventados;
 * as coordenadas só espalham os pontos pela área urbana para o mapa fazer sentido.
 * A rede real tem 13 escolas — aqui são 6, o suficiente para demonstrar as regras.
 */
export const ESCOLAS: Escola[] = [
  {
    id: 'ipe',
    nome: 'Escola Municipal Ipê Amarelo',
    setor: 'Setor Central',
    lat: -23.6612,
    lng: -52.6048,
    turmas: [
      { serie: 'Infantil 5', capacidade: 25, matriculados: 19 },
      { serie: '1º Ano', capacidade: 25, matriculados: 22 },
    ],
  },
  {
    id: 'jacaranda',
    nome: 'Escola Municipal Jacarandá',
    setor: 'Setor Norte',
    lat: -23.6455,
    lng: -52.6012,
    turmas: [
      { serie: 'Infantil 5', capacidade: 20, matriculados: 14 },
      { serie: '1º Ano', capacidade: 25, matriculados: 18 },
    ],
  },
  {
    id: 'aroeira',
    nome: 'Escola Municipal Aroeira',
    setor: 'Setor Leste',
    lat: -23.6598,
    lng: -52.5832,
    turmas: [
      { serie: 'Infantil 5', capacidade: 20, matriculados: 20 },
      { serie: '1º Ano', capacidade: 25, matriculados: 17 },
    ],
  },
  {
    id: 'peroba',
    nome: 'Escola Municipal Peroba Rosa',
    setor: 'Setor Sul',
    lat: -23.6788,
    lng: -52.6071,
    turmas: [
      { serie: 'Infantil 5', capacidade: 25, matriculados: 16 },
      { serie: '1º Ano', capacidade: 25, matriculados: 21 },
    ],
  },
  {
    id: 'cedro',
    nome: 'Escola Municipal Cedro',
    setor: 'Setor Oeste',
    lat: -23.6641,
    lng: -52.6276,
    turmas: [
      { serie: 'Infantil 5', capacidade: 20, matriculados: 13 },
      { serie: '1º Ano', capacidade: 20, matriculados: 20 },
    ],
  },
  {
    id: 'paineira',
    nome: 'Escola Municipal Paineira',
    setor: 'Setor Noroeste',
    lat: -23.6489,
    lng: -52.6214,
    turmas: [
      { serie: 'Infantil 5', capacidade: 20, matriculados: 15 },
      { serie: '1º Ano', capacidade: 20, matriculados: 14 },
    ],
  },
]

/** CMEIs FICTÍCIOS de origem (nomes de aves). */
export const ORIGENS: UnidadeOrigem[] = [
  { id: 'sabia', nome: 'CMEI Sabiá' },
  { id: 'bemtevi', nome: 'CMEI Bem-te-vi' },
  { id: 'beijaflor', nome: 'CMEI Beija-flor' },
  { id: 'curio', nome: 'CMEI Curió' },
]

export function escolaPorId(id: string | null | undefined): Escola | undefined {
  return ESCOLAS.find((e) => e.id === id)
}

export function origemPorId(id: string): UnidadeOrigem | undefined {
  return ORIGENS.find((o) => o.id === id)
}
