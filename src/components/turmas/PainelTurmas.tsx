'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { MapPin } from 'lucide-react'
import { ALUNOS } from '@/data/alunos'
import { ESCOLAS } from '@/data/escolas'
import { useEstado } from '@/lib/estado'
import { ocupacaoPorDecisoes, vagasDaSerie } from '@/lib/regras'
import { SERIES, type Serie } from '@/lib/tipos'

/** Barra de ocupação: já matriculados, alocados nesta rodada e vagas livres. */
function Barra({ capacidade, matriculados, rodada }: { capacidade: number; matriculados: number; rodada: number }) {
  const pct = (n: number) => `${capacidade ? (n / capacidade) * 100 : 0}%`
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
      <div className="bg-slate-500" style={{ width: pct(matriculados) }} />
      <div className="bg-emerald-600" style={{ width: pct(rodada) }} />
    </div>
  )
}

export function PainelTurmas() {
  const { decisoes } = useEstado()
  const [serie, setSerie] = useState<Serie | ''>('')
  const ocupacao = useMemo(() => ocupacaoPorDecisoes(ALUNOS, decisoes), [decisoes])
  const series = useMemo(() => (serie ? [serie] : SERIES), [serie])

  const totais = useMemo(() => {
    let capacidade = 0
    let ocupadas = 0
    for (const e of ESCOLAS)
      for (const s of series) {
        const v = vagasDaSerie(e, s, ocupacao)
        capacidade += v.capacidade
        ocupadas += v.ocupadas
      }
    return { capacidade, ocupadas, livres: capacidade - ocupadas }
  }, [ocupacao, series])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <label htmlFor="f-serie-turmas" className="mb-1 block text-xs font-semibold text-slate-700">
            Série
          </label>
          <select
            id="f-serie-turmas"
            value={serie}
            onChange={(e) => setSerie(e.target.value as Serie | '')}
            className="h-10 w-56 rounded-lg border border-slate-300 bg-white px-3 text-sm shadow-sm"
          >
            <option value="">Todas as séries</option>
            {SERIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <dl className="grid grid-cols-3 gap-3 text-center">
          {[
            ['Vagas', totais.capacidade, 'text-slate-900'],
            ['Ocupadas', totais.ocupadas, 'text-slate-700'],
            ['Livres', totais.livres, 'text-emerald-700'],
          ].map(([rotulo, valor, cor]) => (
            <div key={rotulo} className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
              <dt className="text-xs font-semibold uppercase text-slate-600">{rotulo}</dt>
              <dd className={`text-2xl font-black ${cor}`}>{valor}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-700">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-slate-500" aria-hidden="true" /> Já matriculados
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-emerald-600" aria-hidden="true" /> Alocados nesta rodada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-slate-200 ring-1 ring-slate-300" aria-hidden="true" /> Vagas livres
        </span>
      </p>

      <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {ESCOLAS.map((escola) => {
          const alocadosAqui = ALUNOS.filter((a) => decisoes[a.id]?.escolaId === escola.id && series.includes(a.serie))
          return (
            <li key={escola.id}>
              <article aria-labelledby={`escola-${escola.id}`} className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 id={`escola-${escola.id}`} className="text-lg font-bold text-slate-900">
                  {escola.nome}
                </h2>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-600">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {escola.setor}
                </p>

                <div className="mt-4 space-y-4">
                  {series.map((s) => {
                    const v = vagasDaSerie(escola, s, ocupacao)
                    const turma = escola.turmas.find((t) => t.serie === s)
                    const rodada = ocupacao.get(escola.id)?.[s] ?? 0
                    return (
                      <div key={s}>
                        <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                          <h3 className="font-semibold text-slate-800">{s}</h3>
                          <p className={v.livres === 0 ? 'font-semibold text-red-700' : 'text-slate-700'}>
                            {v.livres === 0 ? 'Lotada' : `${v.livres} ${v.livres === 1 ? 'vaga livre' : 'vagas livres'}`}
                          </p>
                        </div>
                        <Barra capacidade={v.capacidade} matriculados={turma?.matriculados ?? 0} rodada={rodada} />
                        <p className="mt-1 text-xs text-slate-600">
                          {turma?.matriculados ?? 0} já matriculados + {rodada} {rodada === 1 ? 'alocado' : 'alocados'} nesta rodada,
                          de {v.capacidade} vagas
                        </p>
                      </div>
                    )
                  })}
                </div>

                <details className="mt-4 rounded-xl border border-slate-200">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-slate-800">
                    Alocados nesta rodada ({alocadosAqui.length})
                  </summary>
                  {alocadosAqui.length === 0 ? (
                    <p className="px-3 pb-3 text-sm text-slate-600">Nenhum ainda.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100 px-3 pb-2 text-sm">
                      {alocadosAqui.map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-2 py-1.5">
                          <span>
                            {a.nome} <span className="text-slate-600">· {a.serie}</span>
                          </span>
                          <Link
                            href={`/alocacao?aluno=${a.id}&aba=alocados`}
                            className="shrink-0 text-xs font-semibold text-acao hover:underline"
                          >
                            Abrir<span className="sr-only"> {a.nome} na Central</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </details>
              </article>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
