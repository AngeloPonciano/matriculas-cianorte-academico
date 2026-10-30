/**
 * Executa os scripts SQL de `database/` num PostgreSQL embutido (PGlite).
 *
 * O PGlite é o próprio PostgreSQL compilado para WebAssembly: roda dentro do
 * Node, em memória, sem instalar servidor. Os mesmos arquivos .sql também rodam
 * num PostgreSQL comum com `psql -f`.
 *
 * Cada arquivo é dividido em blocos pelos marcadores `-- [ID] Título`, para que
 * o resultado de cada consulta apareça com o nome dela.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite, type Results } from '@electric-sql/pglite'

export const PASTA = import.meta.dirname

export const ARQUIVOS = [
  '01_esquema.sql',
  '02_dados.sql',
  '03_manipulacao.sql',
  '04_consultas.sql',
  '05_restricoes.sql',
] as const

export type Arquivo = (typeof ARQUIVOS)[number]

export interface Bloco {
  id: string
  titulo: string
  sql: string
}

export interface BlocoExecutado extends Bloco {
  /** Só os resultados que devolvem colunas (consultas). */
  resultados: Results[]
}

const MARCADOR = /^-- \[([A-Z0-9.]+)\] (.+)$/

export function lerBlocos(arquivo: Arquivo): Bloco[] {
  const blocos: Bloco[] = [{ id: '', titulo: '', sql: '' }]
  for (const linha of readFileSync(join(PASTA, arquivo), 'utf8').split(/\r?\n/)) {
    const marcador = MARCADOR.exec(linha)
    if (marcador) blocos.push({ id: marcador[1], titulo: marcador[2], sql: '' })
    blocos[blocos.length - 1].sql += linha + '\n'
  }
  return blocos.filter((b) => b.sql.replace(/--.*$/gm, '').trim() !== '')
}

export async function criarBanco(): Promise<PGlite> {
  return PGlite.create()
}

export async function executarArquivo(db: PGlite, arquivo: Arquivo): Promise<BlocoExecutado[]> {
  const executados: BlocoExecutado[] = []
  for (const bloco of lerBlocos(arquivo)) {
    const resultados = (await db.exec(bloco.sql)).filter((r) => r.fields.length > 0)
    executados.push({ ...bloco, resultados })
  }
  return executados
}

/** Banco pronto com esquema e dados (e, se pedido, os scripts seguintes). */
export async function bancoCarregado(ate: Arquivo = '02_dados.sql'): Promise<PGlite> {
  const db = await criarBanco()
  for (const arquivo of ARQUIVOS) {
    await executarArquivo(db, arquivo)
    if (arquivo === ate) break
  }
  return db
}
