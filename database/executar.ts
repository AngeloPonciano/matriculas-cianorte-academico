/**
 * Roda todos os scripts SQL, em ordem, e mostra o resultado de cada consulta.
 *
 * Uso: npm run db            (todos os arquivos)
 *      npm run db -- 04      (só até o arquivo que começa com 04)
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { ARQUIVOS, PASTA, criarBanco, executarArquivo } from './banco.ts'

const ate = process.argv[2]
const MAX_LINHAS = 15

function formatar(valor: unknown): string {
  if (valor === null || valor === undefined) return '—'
  if (valor instanceof Date) return valor.toISOString().slice(0, 16).replace('T', ' ')
  return String(valor)
}

function imprimirTabela(campos: string[], linhas: Record<string, unknown>[]) {
  const celulas = linhas.slice(0, MAX_LINHAS).map((l) => campos.map((c) => formatar(l[c])))
  const larguras = campos.map((c, i) => Math.max(c.length, ...celulas.map((l) => l[i].length)))
  const linha = (valores: string[]) => ' ' + valores.map((v, i) => v.padEnd(larguras[i])).join(' │ ')
  console.log(linha(campos))
  console.log('─' + larguras.map((l) => '─'.repeat(l)).join('─┼─') + '─')
  for (const l of celulas) console.log(linha(l))
  const resto = linhas.length - celulas.length
  console.log(resto > 0 ? `(${linhas.length} linhas, mostrando ${celulas.length})` : `(${linhas.length} ${linhas.length === 1 ? 'linha' : 'linhas'})`)
}

const db = await criarBanco()

for (const arquivo of ARQUIVOS) {
  if (!existsSync(join(PASTA, arquivo))) continue
  console.log(`\n══ ${arquivo} ${'═'.repeat(Math.max(0, 70 - arquivo.length))}`)
  for (const bloco of await executarArquivo(db, arquivo)) {
    if (bloco.resultados.length === 0) {
      if (bloco.id) console.log(`✓ [${bloco.id}] ${bloco.titulo}`)
      continue
    }
    for (const r of bloco.resultados) {
      console.log(`\n▶ [${bloco.id}] ${bloco.titulo}`)
      imprimirTabela(r.fields.map((f) => f.name), r.rows as Record<string, unknown>[])
    }
  }
  if (ate && arquivo.startsWith(ate)) break
}

console.log('\nTodos os scripts executados sem erro.')
await db.close()
