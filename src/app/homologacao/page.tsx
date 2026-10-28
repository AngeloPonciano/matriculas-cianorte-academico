import type { Metadata } from 'next'
import { PainelHomologacao } from '@/components/homologacao/PainelHomologacao'

export const metadata: Metadata = { title: 'Homologação' }

export default function PaginaHomologacao() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Homologação</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Confirmação final das alocações. Selecione os alunos, homologue e baixe a relação em planilha. Depois de
          homologado, o aluno não pode mais ser trocado de escola pela Central.
        </p>
      </header>
      <PainelHomologacao />
    </>
  )
}
