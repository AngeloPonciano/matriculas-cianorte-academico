'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, Download, ShieldCheck } from 'lucide-react'
import { ALUNOS } from '@/data/alunos'
import { ESCOLAS, ORIGENS, escolaPorId, origemPorId } from '@/data/escolas'
import { useEstado } from '@/lib/estado'
import { gerarCsv, linhasHomologadas } from '@/lib/exportar'

export function PainelHomologacao() {
  const { decisoes, homologar, reiniciar } = useEstado()
  const [escolaId, setEscolaId] = useState('')
  const [marcados, setMarcados] = useState<Set<string>>(new Set())
  const [mensagem, setMensagem] = useState('')

  const alocados = useMemo(
    () => ALUNOS.filter((a) => decisoes[a.id] && !decisoes[a.id].homologado && (!escolaId || decisoes[a.id].escolaId === escolaId)),
    [decisoes, escolaId],
  )
  const homologados = useMemo(
    () => ALUNOS.filter((a) => decisoes[a.id]?.homologado && (!escolaId || decisoes[a.id].escolaId === escolaId)),
    [decisoes, escolaId],
  )

  const visiveisMarcados = alocados.filter((a) => marcados.has(a.id))
  const todosMarcados = alocados.length > 0 && visiveisMarcados.length === alocados.length

  const alternar = (id: string) =>
    setMarcados((atual) => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })

  const confirmar = () => {
    const ids = visiveisMarcados.map((a) => a.id)
    homologar(ids)
    setMarcados(new Set())
    setMensagem(`${ids.length} ${ids.length === 1 ? 'aluno homologado' : 'alunos homologados'}.`)
  }

  const baixar = () => {
    const csv = gerarCsv(linhasHomologadas(ALUNOS, decisoes, ESCOLAS, ORIGENS))
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'homologacao-2027-DEMO-dados-ficticios.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const totalHomologados = ALUNOS.filter((a) => decisoes[a.id]?.homologado).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <label htmlFor="f-escola" className="mb-1 block text-xs font-semibold text-slate-700">
            Escola
          </label>
          <select
            id="f-escola"
            value={escolaId}
            onChange={(e) => setEscolaId(e.target.value)}
            className="h-10 w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 text-sm shadow-sm sm:w-72"
          >
            <option value="">Todas as escolas</option>
            {ESCOLAS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={baixar}
            disabled={totalHomologados === 0}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Baixar homologados (CSV)
          </button>
          <button
            type="button"
            onClick={() => {
              reiniciar()
              setMarcados(new Set())
              setMensagem('Demonstração reiniciada: decisões voltaram ao estado inicial.')
            }}
            className="h-10 rounded-lg px-3 text-sm font-semibold text-slate-600 underline-offset-2 hover:underline"
          >
            Reiniciar demonstração
          </button>
        </div>
      </div>

      <p
        aria-live="polite"
        className={mensagem ? 'flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900' : 'sr-only'}
      >
        {mensagem && <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />}
        {mensagem}
      </p>

      <section aria-labelledby="titulo-pendentes" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <h2 id="titulo-pendentes" className="text-lg font-bold text-slate-900">
            Alocados aguardando homologação <span className="font-normal text-slate-600">({alocados.length})</span>
          </h2>
          <button
            type="button"
            onClick={confirmar}
            disabled={visiveisMarcados.length === 0}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-acao px-4 text-sm font-semibold text-white hover:bg-acao-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Homologar selecionados ({visiveisMarcados.length})
          </button>
        </div>

        {alocados.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-600">Nenhum aluno alocado aguardando homologação.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <caption className="sr-only">Alunos alocados que ainda não foram homologados</caption>
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th scope="col" className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={todosMarcados}
                      onChange={() => setMarcados(todosMarcados ? new Set() : new Set(alocados.map((a) => a.id)))}
                      aria-label="Selecionar todos os alunos da lista"
                      className="h-4 w-4 accent-blue-700"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">Aluno</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Série</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Escola</th>
                  <th scope="col" className="hidden px-4 py-3 font-semibold lg:table-cell">Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alocados.map((a) => (
                  <tr key={a.id} className={marcados.has(a.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={marcados.has(a.id)}
                        onChange={() => alternar(a.id)}
                        aria-label={`Selecionar ${a.nome}`}
                        className="h-4 w-4 accent-blue-700"
                      />
                    </td>
                    <th scope="row" className="px-4 py-3 font-semibold text-slate-900">
                      {a.nome}
                      <span className="block font-mono text-xs font-normal text-slate-600">{a.cgm}</span>
                    </th>
                    <td className="px-4 py-3 text-slate-800">{a.serie}</td>
                    <td className="px-4 py-3 text-slate-800">{escolaPorId(decisoes[a.id].escolaId)?.nome}</td>
                    <td className="hidden px-4 py-3 text-slate-800 lg:table-cell">{origemPorId(a.origemId)?.nome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="titulo-homologados" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 id="titulo-homologados" className="border-b border-slate-200 p-4 text-lg font-bold text-slate-900">
          Homologados <span className="font-normal text-slate-600">({homologados.length})</span>
        </h2>
        {homologados.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-600">Nenhum aluno homologado ainda.</p>
        ) : (
          <ul className="grid gap-x-6 divide-y divide-slate-100 px-4 py-2 text-sm sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-3">
            {homologados.map((a) => (
              <li key={a.id} className="py-1.5">
                <span className="font-medium text-slate-900">{a.nome}</span>
                <span className="block text-xs text-slate-600">
                  {a.serie} · {escolaPorId(decisoes[a.id].escolaId)?.nome}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
