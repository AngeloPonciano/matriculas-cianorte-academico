import type { Metadata } from 'next'
import { PainelTurmas } from '@/components/turmas/PainelTurmas'

export const metadata: Metadata = { title: 'Escolas & Turmas' }

export default function PaginaTurmas() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Escolas &amp; Turmas</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Ocupação das vagas de cada escola por série: quem já estava matriculado, quem foi alocado nesta rodada e quantas
          vagas ainda restam. Atualiza na hora a cada decisão da Central de Alocação.
        </p>
      </header>
      <PainelTurmas />
    </>
  )
}
