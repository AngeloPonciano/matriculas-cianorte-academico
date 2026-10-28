'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, CheckCircle2, MapPin, Undo2, Users2 } from 'lucide-react'
import { ALUNOS } from '@/data/alunos'
import { ESCOLAS, escolaPorId, origemPorId } from '@/data/escolas'
import { useEstado } from '@/lib/estado'
import {
  ROTULO_SITUACAO,
  avaliarAluno,
  formatarKm,
  ocupacaoPorDecisoes,
  semDecisaoDe,
  situacaoDoAluno,
  type EscolaAvaliada,
} from '@/lib/regras'

const MapaAlocacao = dynamic(() => import('./MapaAlocacao').then((m) => m.MapaAlocacao), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-xl bg-slate-100 sm:h-80 xl:h-full xl:min-h-[22rem]" />,
})

type Aba = 'aguardando' | 'alocados'

const curto = (nome: string) => nome.replace('Escola Municipal ', 'EM ')

function Vagas({ e }: { e: EscolaAvaliada }) {
  const cor = e.vagas.livres === 0 ? 'text-red-700' : e.vagas.livres <= 2 ? 'text-amber-700' : 'text-emerald-700'
  return (
    <span className={`font-semibold ${cor}`}>
      {e.vagas.livres} <span className="font-normal text-slate-600">de {e.vagas.capacidade}</span>
    </span>
  )
}

export function CentralAlocacao() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { decisoes, alocar, desfazer } = useEstado()
  const [mensagem, setMensagem] = useState('')

  const aba: Aba = params.get('aba') === 'alocados' ? 'alocados' : 'aguardando'
  const voltar = params.get('voltar')
  const voltarSeguro = voltar?.startsWith('/alunos') ? voltar : null

  const aguardando = useMemo(() => ALUNOS.filter((a) => situacaoDoAluno(a.id, decisoes) === 'aguardando'), [decisoes])
  const alocados = useMemo(() => ALUNOS.filter((a) => situacaoDoAluno(a.id, decisoes) !== 'aguardando'), [decisoes])
  const fila = aba === 'aguardando' ? aguardando : alocados

  const pedido = ALUNOS.find((a) => a.id === params.get('aluno'))
  const aluno = pedido ?? fila[0]

  const avaliacao = useMemo(
    () => (aluno ? avaliarAluno(aluno, ESCOLAS, ocupacaoPorDecisoes(ALUNOS, semDecisaoDe(aluno.id, decisoes))) : null),
    [aluno, decisoes],
  )

  const irPara = (mudancas: Record<string, string | null>) => {
    const p = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(mudancas)) {
      if (v === null) p.delete(k)
      else p.set(k, v)
    }
    router.replace(`${pathname}?${p.toString()}`, { scroll: false })
  }

  const aprovar = (escolaId: string) => {
    if (!aluno) return
    const escola = escolaPorId(escolaId)
    alocar(aluno.id, escolaId)
    setMensagem(`${aluno.nome} alocado(a) na ${escola?.nome}.`)
    // Segue para o próximo da fila, como na rotina da operadora.
    if (aba === 'aguardando') {
      const i = aguardando.findIndex((a) => a.id === aluno.id)
      const proximo = aguardando[i + 1] ?? aguardando[i - 1]
      irPara({ aluno: proximo?.id ?? null })
    }
  }

  const situacao = aluno ? situacaoDoAluno(aluno.id, decisoes) : null
  const escolaAtual = aluno ? escolaPorId(decisoes[aluno.id]?.escolaId) : undefined
  const demais = avaliacao?.escolas.filter((e) => !e.posicao) ?? []

  return (
    <div className="space-y-4">
      {voltarSeguro && (
        <Link
          href={voltarSeguro}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar para Alunos
        </Link>
      )}

      <p aria-live="polite" className={mensagem ? 'flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900' : 'sr-only'}>
        {mensagem && <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />}
        {mensagem}
      </p>

      <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        {/* Fila */}
        <section aria-labelledby="titulo-fila" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 id="titulo-fila" className="text-sm font-bold text-slate-800">
            Fila de alunos
          </h2>
          <fieldset className="mt-3">
            <legend className="sr-only">Mostrar na fila</legend>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              {(
                [
                  ['aguardando', `Aguardando (${aguardando.length})`],
                  ['alocados', `Alocados (${alocados.length})`],
                ] as const
              ).map(([valor, rotulo]) => (
                <label
                  key={valor}
                  className={`cursor-pointer rounded-lg px-3 py-2 text-center text-sm font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-amber-500 ${
                    aba === valor ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="aba"
                    value={valor}
                    checked={aba === valor}
                    onChange={() => irPara({ aba: valor, aluno: null })}
                    className="sr-only"
                  />
                  {rotulo}
                </label>
              ))}
            </div>
          </fieldset>

          {fila.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
              {aba === 'aguardando' ? 'Todos os alunos já foram alocados.' : 'Nenhum aluno alocado ainda.'}
            </p>
          ) : (
            <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto pr-1 xl:max-h-[calc(100vh-17rem)]">
              {fila.map((a) => {
                const selecionado = a.id === aluno?.id
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => {
                        irPara({ aluno: a.id })
                        // No celular o painel fica abaixo da fila: leva a pessoa até ele.
                        if (window.matchMedia('(max-width: 1279px)').matches)
                          setTimeout(() => document.getElementById('painel-aluno')?.scrollIntoView({ block: 'start' }), 50)
                      }}
                      aria-current={selecionado ? 'true' : undefined}
                      className={`w-full rounded-xl px-3 py-2 text-left transition-colors ${
                        selecionado ? 'bg-blue-50 ring-2 ring-blue-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        {a.nome}
                        {a.irmaoEscolaId && (
                          <Users2 className="h-4 w-4 shrink-0 text-violet-700" aria-label="tem irmão na rede" />
                        )}
                      </span>
                      <span className="block text-xs text-slate-600">
                        {a.serie} · {origemPorId(a.origemId)?.nome}
                        {aba === 'alocados' && decisoes[a.id] && ` → ${curto(escolaPorId(decisoes[a.id].escolaId)?.nome ?? '')}`}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Painel do aluno */}
        {aluno && avaliacao ? (
          <section id="painel-aluno" aria-labelledby="titulo-aluno" className="min-w-0 scroll-mt-40 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="titulo-aluno" className="text-xl font-bold text-slate-900">
                  {aluno.nome}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  <span className="font-mono">{aluno.cgm}</span> · {aluno.serie} em 2027 · {origemPorId(aluno.origemId)?.nome} (
                  {aluno.turmaOrigem})
                </p>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {aluno.endereco.logradouro}, {aluno.endereco.numero} · {aluno.endereco.setor}
                </p>
              </div>
              {situacao && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-300">
                  {ROTULO_SITUACAO[situacao]}
                </span>
              )}
            </div>

            {avaliacao.casoIrmao === 'irmao_com_vaga' && (
              <p className="flex gap-2 rounded-xl border border-violet-300 bg-violet-50 px-4 py-3 text-sm text-violet-900">
                <Users2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Tem irmão na <strong>{escolaPorId(aluno.irmaoEscolaId)?.nome}</strong>, que tem vaga: ela aparece como 1ª
                  opção, mesmo não sendo a mais próxima.
                </span>
              </p>
            )}
            {avaliacao.casoIrmao === 'irmao_sem_vaga' && (
              <p className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Tem irmão na <strong>{escolaPorId(aluno.irmaoEscolaId)?.nome}</strong>, mas ela está sem vaga em {aluno.serie}.
                  As opções seguem a proximidade; avalie com a família.
                </span>
              </p>
            )}

            {escolaAtual && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <span>
                  {situacao === 'homologado' ? 'Homologado' : 'Alocado'} na <strong>{escolaAtual.nome}</strong>.
                  {situacao === 'homologado' && ' A homologação fecha a decisão nesta tela.'}
                </span>
                {situacao === 'alocado' && (
                  <button
                    type="button"
                    onClick={() => {
                      desfazer(aluno.id)
                      setMensagem(`Alocação de ${aluno.nome} desfeita; voltou para a fila.`)
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-400 bg-white px-3 py-1.5 font-semibold text-emerald-900 hover:bg-emerald-100"
                  >
                    <Undo2 className="h-4 w-4" aria-hidden="true" />
                    Desfazer
                  </button>
                )}
              </div>
            )}

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <MapaAlocacao aluno={aluno} escolas={avaliacao.escolas} />

              <div className="min-w-0 space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Escolas sugeridas</h3>
                {avaliacao.opcoes.length === 0 ? (
                  <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
                    Nenhuma escola tem vaga em {aluno.serie}. O caso segue para análise manual da Secretaria.
                  </p>
                ) : (
                  <ol className="space-y-2">
                    {avaliacao.opcoes.map((e) => (
                      <li key={e.escola.id} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                            style={{ background: ['#15803d', '#1d4ed8', '#7c3aed'][(e.posicao ?? 1) - 1] }}
                            aria-hidden="true"
                          >
                            {e.posicao}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900">
                              <span className="sr-only">{e.posicao}ª opção: </span>
                              {e.escola.nome}
                              {e.temIrmao && (
                                <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-900">
                                  irmão
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-slate-600">
                              {formatarKm(e.distanciaKm)} em linha reta · vagas em {aluno.serie}: <Vagas e={e} />
                            </p>
                          </div>
                          {situacao !== 'homologado' && decisoes[aluno.id]?.escolaId !== e.escola.id && (
                            <button
                              type="button"
                              onClick={() => aprovar(e.escola.id)}
                              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                                e.posicao === 1
                                  ? 'bg-acao text-white hover:bg-acao-hover'
                                  : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                              }`}
                            >
                              {situacao === 'alocado' ? 'Trocar para esta' : 'Aprovar'}
                              <span className="sr-only"> {e.escola.nome}</span>
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                <details className="rounded-xl border border-slate-200">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-slate-800">
                    Outras escolas ({demais.length})
                  </summary>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <caption className="sr-only">Escolas que não estão entre as sugeridas, da mais próxima à mais distante</caption>
                      <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                        <tr>
                          <th scope="col" className="px-3 py-2">Escola</th>
                          <th scope="col" className="px-3 py-2">Distância</th>
                          <th scope="col" className="px-3 py-2">Vagas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {demais.map((e) => (
                          <tr key={e.escola.id}>
                            <th scope="row" className="px-3 py-2 font-medium text-slate-900">
                              {curto(e.escola.nome)}
                            </th>
                            <td className="px-3 py-2 text-slate-700">{formatarKm(e.distanciaKm)}</td>
                            <td className="px-3 py-2">
                              <Vagas e={e} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>

                <p className="text-xs text-slate-600">
                  A sugestão não decide sozinha: a escola só muda quando a operadora aprova. No sistema real a distância usa
                  a rota de carro; aqui, linha reta.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            Selecione um aluno na fila.
          </p>
        )}
      </div>
    </div>
  )
}
