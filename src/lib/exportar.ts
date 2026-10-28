/**
 * Exportação da relação homologada em CSV (abre direto no Excel/LibreOffice).
 * Separador ";" e BOM UTF-8, como as planilhas brasileiras esperam.
 * No sistema real a saída é a planilha oficial e o PDF por escola.
 */

import type { Aluno, Decisoes, Escola, UnidadeOrigem } from './tipos.ts'

export const CABECALHO_CSV = ['ESCOLA', 'CGM', 'ALUNO', 'SÉRIE 2027', 'ORIGEM', 'TURMA DE ORIGEM', 'ENDEREÇO', 'SETOR']

function celula(valor: string): string {
  return /[";\n\r]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor
}

export function linhasHomologadas(
  alunos: Aluno[],
  decisoes: Decisoes,
  escolas: Escola[],
  origens: UnidadeOrigem[],
): string[][] {
  const nomeEscola = new Map(escolas.map((e) => [e.id, e.nome]))
  const nomeOrigem = new Map(origens.map((o) => [o.id, o.nome]))
  return alunos
    .filter((a) => decisoes[a.id]?.homologado)
    .map((a) => [
      nomeEscola.get(decisoes[a.id].escolaId) ?? '',
      a.cgm,
      a.nome,
      a.serie,
      nomeOrigem.get(a.origemId) ?? '',
      a.turmaOrigem,
      `${a.endereco.logradouro}, ${a.endereco.numero}`,
      a.endereco.setor,
    ])
    .sort((x, y) => x[0].localeCompare(y[0], 'pt-BR') || x[2].localeCompare(y[2], 'pt-BR'))
}

export function gerarCsv(linhas: string[][], cabecalho = CABECALHO_CSV): string {
  return '﻿' + [cabecalho, ...linhas].map((l) => l.map(celula).join(';')).join('\r\n') + '\r\n'
}
