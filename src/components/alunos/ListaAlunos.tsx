'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Search, Users2, RotateCcw } from 'lucide-react'
import { ALUNOS } from '@/data/alunos'
import { ORIGENS, escolaPorId, origemPorId } from '@/data/escolas'
import { useEstado } from '@/lib/estado'
import { FILTROS_VAZIOS, filtrarAlunos, filtrosDaUrl, filtrosParaUrl, type FiltrosAlunos } from '@/lib/filtros'
import { ROTULO_SITUACAO, situacaoDoAluno } from '@/lib/regras'
import { SERIES, type Situacao } from '@/lib/tipos'

const ESTILO_SITUACAO: Record<Situacao, string> = {
  aguardando: 'bg-amber-100 text-amber-900 ring-amber-300',
  alocado: 'bg-emerald-100 text-emerald-900 ring-emerald-300',
  homologado: 'bg-blue-100 text-blue-900 ring-blue-300',
}

function Selo({ situacao }: { situacao: Situacao }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${ESTILO_SITUACAO[situacao]}`}>
      {ROTULO_SITUACAO[situacao]}
    </span>
  )
}

function SeloIrmao({ escolaId }: { escolaId: string | null }) {
  if (!escolaId) return <span className="text-slate-500">—</span>
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-900 ring-1 ring-violet-300">
      <Users2 className="h-3.5 w-3.5" aria-hidden="true" />
      {escolaPorId(escolaId)?.nome.replace('Escola Municipal ', 'EM ')}
    </span>
  )
}

const campo =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-blue-600'

export function ListaAlunos() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { decisoes } = useEstado()

  const filtros = useMemo(() => filtrosDaUrl(new URLSearchParams(params.toString())), [params])
  // A busca tem estado próprio: cada letra filtra na hora e a URL é atualizada logo depois.
  const [busca, setBusca] = useState(filtros.busca)
  const lista = useMemo(() => filtrarAlunos(ALUNOS, decisoes, { ...filtros, busca }), [decisoes, filtros, busca])

  const totais = useMemo(() => {
    const t = { aguardando: 0, alocado: 0, homologado: 0 }
    for (const a of ALUNOS) t[situacaoDoAluno(a.id, decisoes)] += 1
    return t
  }, [decisoes])

  const mudar = (parcial: Partial<FiltrosAlunos>) =>
    router.replace(`${pathname}${filtrosParaUrl({ ...filtros, busca, ...parcial })}`, { scroll: false })

  useEffect(() => {
    if (busca === filtros.busca) return
    const espera = setTimeout(
      () => router.replace(`${pathname}${filtrosParaUrl({ ...filtros, busca })}`, { scroll: false }),
      300,
    )
    return () => clearTimeout(espera)
  }, [busca, filtros, pathname, router])

  const limpar = () => {
    setBusca('')
    router.replace(`${pathname}${filtrosParaUrl(FILTROS_VAZIOS)}`, { scroll: false })
  }

  const temFiltro = filtrosParaUrl({ ...filtros, busca }) !== ''

  // Leva os filtros atuais para o botão "Voltar para Alunos" da Central.
  const linkCentral = (alunoId: string, situacao: Situacao) => {
    const p = new URLSearchParams({
      aluno: alunoId,
      aba: situacao === 'aguardando' ? 'aguardando' : 'alocados',
      voltar: `${pathname}${filtrosParaUrl({ ...filtros, busca })}`,
    })
    return `/alocacao?${p.toString()}`
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="titulo-resumo">
        <h2 id="titulo-resumo" className="sr-only">
          Resumo da rodada
        </h2>
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { rotulo: 'Total de alunos', valor: ALUNOS.length, cor: 'text-slate-900' },
            { rotulo: 'Aguardando alocação', valor: totais.aguardando, cor: 'text-amber-700' },
            { rotulo: 'Alocados', valor: totais.alocado, cor: 'text-emerald-700' },
            { rotulo: 'Homologados', valor: totais.homologado, cor: 'text-blue-700' },
          ].map((c) => (
            <div key={c.rotulo} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-600">{c.rotulo}</dt>
              <dd className={`mt-1 text-3xl font-black ${c.cor}`}>{c.valor}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="titulo-filtros" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 id="titulo-filtros" className="mb-3 text-sm font-bold text-slate-800">
          Filtros
        </h2>
        <form role="search" onSubmit={(e) => e.preventDefault()} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto_auto] xl:items-end">
          <div>
            <label htmlFor="f-busca" className="mb-1 block text-xs font-semibold text-slate-700">
              Nome ou CGM
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                id="f-busca"
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Ex.: Lívia ou D-00121"
                className={`${campo} pl-9`}
                autoComplete="off"
              />
            </div>
          </div>
          <div>
            <label htmlFor="f-origem" className="mb-1 block text-xs font-semibold text-slate-700">
              CMEI de origem
            </label>
            <select id="f-origem" value={filtros.origem} onChange={(e) => mudar({ origem: e.target.value })} className={campo}>
              <option value="">Todos</option>
              {ORIGENS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-serie" className="mb-1 block text-xs font-semibold text-slate-700">
              Série em 2027
            </label>
            <select
              id="f-serie"
              value={filtros.serie}
              onChange={(e) => mudar({ serie: e.target.value as FiltrosAlunos['serie'] })}
              className={campo}
            >
              <option value="">Todas</option>
              {SERIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-situacao" className="mb-1 block text-xs font-semibold text-slate-700">
              Situação
            </label>
            <select
              id="f-situacao"
              value={filtros.situacao}
              onChange={(e) => mudar({ situacao: e.target.value as FiltrosAlunos['situacao'] })}
              className={campo}
            >
              <option value="">Todas</option>
              {(Object.keys(ROTULO_SITUACAO) as Situacao[]).map((s) => (
                <option key={s} value={s}>
                  {ROTULO_SITUACAO[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex h-10 items-center gap-2">
            <input
              id="f-irmaos"
              type="checkbox"
              checked={filtros.soIrmaos}
              onChange={(e) => mudar({ soIrmaos: e.target.checked })}
              className="h-4 w-4 rounded border-slate-400 accent-blue-700"
            />
            <label htmlFor="f-irmaos" className="text-sm font-medium text-slate-800">
              Só com irmão na rede
            </label>
          </div>
          <button
            type="button"
            onClick={limpar}
            disabled={!temFiltro}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Limpar
          </button>
        </form>
      </section>

      <section aria-labelledby="titulo-lista">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="titulo-lista" className="text-lg font-bold text-slate-900">
            Lista de alunos
          </h2>
          <p className="text-sm text-slate-600" aria-live="polite">
            {lista.length === ALUNOS.length ? `${lista.length} alunos` : `${lista.length} de ${ALUNOS.length} alunos`}
          </p>
        </div>

        {lista.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            Nenhum aluno com esses filtros.
          </p>
        ) : (
          <>
            {/* Tabela: tablet e computador */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
              <table className="w-full table-fixed text-left text-sm">
                <caption className="sr-only">
                  Alunos fictícios com série, unidade de origem, endereço, irmão na rede e situação
                </caption>
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th scope="col" className="w-28 px-4 py-3 font-semibold">CGM</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Aluno</th>
                    <th scope="col" className="w-28 px-4 py-3 font-semibold">Série 2027</th>
                    <th scope="col" className="hidden w-44 px-4 py-3 font-semibold xl:table-cell">Origem</th>
                    <th scope="col" className="hidden w-52 px-4 py-3 font-semibold lg:table-cell">Endereço</th>
                    <th scope="col" className="w-48 px-4 py-3 font-semibold">Irmão na rede</th>
                    <th scope="col" className="w-48 px-4 py-3 font-semibold">Situação</th>
                    <th scope="col" className="w-24 px-4 py-3 font-semibold">
                      <span className="sr-only">Ação</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lista.map((a) => {
                    const situacao = situacaoDoAluno(a.id, decisoes)
                    const escola = escolaPorId(decisoes[a.id]?.escolaId)
                    return (
                      <tr key={a.id} className="align-top hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{a.cgm}</td>
                        <th scope="row" className="px-4 py-3 font-semibold text-slate-900">
                          {a.nome}
                          {escola && <span className="mt-0.5 block text-xs font-normal text-slate-600">→ {escola.nome}</span>}
                        </th>
                        <td className="px-4 py-3 text-slate-800">{a.serie}</td>
                        <td className="hidden px-4 py-3 text-slate-800 xl:table-cell">
                          {origemPorId(a.origemId)?.nome}
                          <span className="block text-xs text-slate-600">{a.turmaOrigem}</span>
                        </td>
                        <td className="hidden px-4 py-3 text-slate-800 lg:table-cell">
                          {a.endereco.logradouro}, {a.endereco.numero}
                          <span className="block text-xs text-slate-600">{a.endereco.setor}</span>
                        </td>
                        <td className="px-4 py-3">
                          <SeloIrmao escolaId={a.irmaoEscolaId} />
                        </td>
                        <td className="px-4 py-3">
                          <Selo situacao={situacao} />
                        </td>
                        <td className="px-4 py-3">
                          <Link href={linkCentral(a.id, situacao)} className="font-semibold text-acao underline-offset-2 hover:underline">
                            Abrir<span className="sr-only"> {a.nome} na Central de Alocação</span>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Cartões: celular */}
            <ul className="space-y-3 md:hidden">
              {lista.map((a) => {
                const situacao = situacaoDoAluno(a.id, decisoes)
                const escola = escolaPorId(decisoes[a.id]?.escolaId)
                return (
                  <li key={a.id}>
                    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby={`nome-${a.id}`}>
                      <div className="flex items-start justify-between gap-3">
                        <h3 id={`nome-${a.id}`} className="font-semibold text-slate-900">
                          {a.nome}
                        </h3>
                        <Selo situacao={situacao} />
                      </div>
                      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                        <dt className="text-slate-600">CGM</dt>
                        <dd className="font-mono text-slate-800">{a.cgm}</dd>
                        <dt className="text-slate-600">Série</dt>
                        <dd className="text-slate-800">{a.serie}</dd>
                        <dt className="text-slate-600">Origem</dt>
                        <dd className="text-slate-800">
                          {origemPorId(a.origemId)?.nome} · {a.turmaOrigem}
                        </dd>
                        <dt className="text-slate-600">Endereço</dt>
                        <dd className="text-slate-800">
                          {a.endereco.logradouro}, {a.endereco.numero} · {a.endereco.setor}
                        </dd>
                        <dt className="text-slate-600">Irmão</dt>
                        <dd>
                          <SeloIrmao escolaId={a.irmaoEscolaId} />
                        </dd>
                        {escola && (
                          <>
                            <dt className="text-slate-600">Escola</dt>
                            <dd className="text-slate-800">{escola.nome}</dd>
                          </>
                        )}
                      </dl>
                      <Link
                        href={linkCentral(a.id, situacao)}
                        className="mt-3 inline-flex rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-acao hover:bg-slate-50"
                      >
                        Abrir na Central<span className="sr-only"> — {a.nome}</span>
                      </Link>
                    </article>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}
