import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CentralAlocacao } from '@/components/alocacao/CentralAlocacao'

export const metadata: Metadata = { title: 'Central de Alocação' }

export default function PaginaAlocacao() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Central de Alocação</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Para cada aluno, o sistema sugere até três escolas com vaga, da mais próxima para a mais distante. Irmão já
          matriculado numa escola com vaga coloca essa escola em primeiro lugar. A decisão é sempre da operadora.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-slate-600">Carregando a fila…</p>}>
        <CentralAlocacao />
      </Suspense>
    </>
  )
}
