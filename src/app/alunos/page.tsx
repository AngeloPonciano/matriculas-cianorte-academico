import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ListaAlunos } from '@/components/alunos/ListaAlunos'

export const metadata: Metadata = { title: 'Alunos' }

export default function PaginaAlunos() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Alunos</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Crianças dos CMEIs que precisam de vaga nas escolas municipais em 2027. Filtre a lista e acompanhe a
          situação de cada uma: aguardando alocação, alocada pela operadora ou já homologada.
        </p>
      </header>
      {/* Os filtros moram na URL; o Suspense deixa o restante da página ser pré-renderizado. */}
      <Suspense fallback={<p className="text-sm text-slate-600">Carregando a lista…</p>}>
        <ListaAlunos />
      </Suspense>
    </>
  )
}
