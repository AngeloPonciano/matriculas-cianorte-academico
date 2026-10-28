import type { Aluno, Serie } from '../lib/tipos.ts'
import { ESCOLAS, ORIGENS } from './escolas.ts'

/**
 * Alunos FICTÍCIOS, gerados por sorteio com semente fixa.
 *
 * Nenhum registro vem da base real: nomes são combinações sorteadas de listas
 * de nomes comuns, as ruas têm nomes sintéticos (letras gregas), o CGM tem o
 * prefixo D- e as coordenadas são pontos aleatórios em volta do centro da cidade.
 * A semente fixa faz a lista sair sempre igual, o que permite testar e conferir.
 */

const SEMENTE = 2027
const TOTAL_ALUNOS = 48
const CENTRO = { lat: -23.6625, lng: -52.6055 }

const PRENOMES = [
  'Ana', 'Alice', 'Helena', 'Laura', 'Manuela', 'Sofia', 'Valentina', 'Isabela',
  'Lívia', 'Cecília', 'Luísa', 'Beatriz', 'Clara', 'Lara', 'Melissa', 'Antonella',
  'Miguel', 'Arthur', 'Gael', 'Theo', 'Vicente', 'Ravi', 'Davi', 'Bernardo',
  'Noah', 'Gabriel', 'Samuel', 'Pedro', 'Lucas', 'Benício', 'Matheus', 'Joaquim',
]

const SOBRENOMES = [
  'Almeida', 'Barbosa', 'Cardoso', 'Carvalho', 'Castro', 'Correia', 'Dias', 'Fernandes',
  'Gomes', 'Lima', 'Lopes', 'Martins', 'Melo', 'Moreira', 'Nunes', 'Oliveira',
  'Pereira', 'Ribeiro', 'Rocha', 'Santos', 'Silva', 'Souza', 'Teixeira', 'Vieira',
]

const LOGRADOUROS = [
  'Rua Alfa', 'Rua Beta', 'Rua Gama', 'Rua Delta', 'Rua Épsilon', 'Rua Zeta',
  'Rua Eta', 'Rua Teta', 'Rua Iota', 'Rua Capa', 'Avenida Lambda', 'Avenida Ômega',
]

const SETORES = ['Setor Central', 'Setor Norte', 'Setor Sul', 'Setor Leste', 'Setor Oeste', 'Setor Noroeste']

/** Gerador pseudoaleatório mulberry32: mesmo resultado em qualquer máquina. */
function criarSorteio(semente: number) {
  let a = semente >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function gerarAlunos(semente = SEMENTE, total = TOTAL_ALUNOS): Aluno[] {
  const sorteio = criarSorteio(semente)
  const escolher = <T,>(lista: readonly T[]): T => lista[Math.floor(sorteio() * lista.length)]
  const usados = new Set<string>()
  const alunos: Aluno[] = []

  for (let i = 0; i < total; i++) {
    let nome = ''
    do {
      nome = `${escolher(PRENOMES)} ${escolher(SOBRENOMES)} ${escolher(SOBRENOMES)}`
    } while (usados.has(nome))
    usados.add(nome)

    const serie: Serie = sorteio() < 0.5 ? 'Infantil 5' : '1º Ano'
    const turmaOrigem = `${serie === 'Infantil 5' ? 'Infantil 4' : 'Infantil 5'} ${escolher(['A', 'B', 'C'])}`
    // Raio de até ~3 km em volta do centro.
    const raio = 0.028 * Math.sqrt(sorteio())
    const angulo = sorteio() * 2 * Math.PI

    alunos.push({
      id: `a${String(i + 1).padStart(2, '0')}`,
      cgm: `D-${String(100 + i * 7).padStart(5, '0')}`,
      nome,
      serie,
      origemId: escolher(ORIGENS).id,
      turmaOrigem,
      endereco: {
        logradouro: escolher(LOGRADOUROS),
        numero: 10 + Math.floor(sorteio() * 990),
        setor: escolher(SETORES),
      },
      lat: Number((CENTRO.lat + raio * Math.sin(angulo)).toFixed(5)),
      lng: Number((CENTRO.lng + raio * 1.1 * Math.cos(angulo)).toFixed(5)),
      irmaoEscolaId: sorteio() < 0.2 ? escolher(ESCOLAS).id : null,
      preAlocado: sorteio() < 0.35,
    })
  }

  return alunos.sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR'))
}

export const ALUNOS: Aluno[] = gerarAlunos()
