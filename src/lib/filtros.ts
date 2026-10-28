/**
 * Filtros da lista de alunos. Ficam na URL (?busca=...&origem=...), para que o
 * botão Voltar do navegador e os links de volta das outras telas preservem a seleção.
 */

import type { Aluno, Decisoes, Serie, Situacao } from './tipos.ts'
import { situacaoDoAluno } from './regras.ts'

export interface FiltrosAlunos {
  busca: string
  origem: string
  serie: Serie | ''
  situacao: Situacao | ''
  soIrmaos: boolean
}

export const FILTROS_VAZIOS: FiltrosAlunos = { busca: '', origem: '', serie: '', situacao: '', soIrmaos: false }

/** Remove acentos e caixa para a busca achar "Lívia" digitando "livia". */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export function filtrarAlunos(alunos: Aluno[], decisoes: Decisoes, f: FiltrosAlunos): Aluno[] {
  const termo = normalizar(f.busca)
  return alunos.filter((a) => {
    if (termo && !normalizar(a.nome).includes(termo) && !normalizar(a.cgm).includes(termo)) return false
    if (f.origem && a.origemId !== f.origem) return false
    if (f.serie && a.serie !== f.serie) return false
    if (f.situacao && situacaoDoAluno(a.id, decisoes) !== f.situacao) return false
    if (f.soIrmaos && !a.irmaoEscolaId) return false
    return true
  })
}

export function filtrosDaUrl(params: URLSearchParams): FiltrosAlunos {
  const serie = params.get('serie')
  const situacao = params.get('situacao')
  return {
    busca: params.get('busca') ?? '',
    origem: params.get('origem') ?? '',
    serie: serie === 'Infantil 5' || serie === '1º Ano' ? serie : '',
    situacao: situacao === 'aguardando' || situacao === 'alocado' || situacao === 'homologado' ? situacao : '',
    soIrmaos: params.get('irmaos') === '1',
  }
}

export function filtrosParaUrl(f: FiltrosAlunos): string {
  const p = new URLSearchParams()
  if (f.busca) p.set('busca', f.busca)
  if (f.origem) p.set('origem', f.origem)
  if (f.serie) p.set('serie', f.serie)
  if (f.situacao) p.set('situacao', f.situacao)
  if (f.soIrmaos) p.set('irmaos', '1')
  const s = p.toString()
  return s ? `?${s}` : ''
}
