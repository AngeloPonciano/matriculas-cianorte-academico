'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ClipboardCheck, GraduationCap, Info, Menu, School, ShieldCheck, Users, X } from 'lucide-react'
import { ALUNOS } from '@/data/alunos'
import { useEstado } from '@/lib/estado'

const NAV = [
  { href: '/alunos', label: 'Alunos', icon: Users, pronto: true },
  { href: '/alocacao', label: 'Central de Alocação', icon: ShieldCheck, pronto: true },
  { href: '/turmas', label: 'Escolas & Turmas', icon: School, pronto: false },
  { href: '/homologacao', label: 'Homologação', icon: ClipboardCheck, pronto: false },
  { href: '/sobre', label: 'Sobre o projeto', icon: Info, pronto: false },
]

function Navegacao({ aoNavegar }: { aoNavegar?: () => void }) {
  const pathname = usePathname()
  const { decisoes } = useEstado()
  const pendentes = ALUNOS.filter((a) => !decisoes[a.id]).length
  return (
    <nav aria-label="Menu principal">
      <ul className="space-y-1.5">
        {NAV.map((item) => {
          const ativo = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icone = item.icon
          if (!item.pronto) {
            return (
              <li key={item.href}>
                <span
                  className="flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-semibold text-blue-200/70"
                  aria-disabled="true"
                >
                  <Icone className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">{item.label}</span>
                  <span className="sr-only">(em construção)</span>
                </span>
              </li>
            )
          }
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={aoNavegar}
                aria-current={ativo ? 'page' : undefined}
                className={`flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition-colors ${
                  ativo ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icone className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="whitespace-nowrap">{item.label}</span>
                {item.href === '/alocacao' && pendentes > 0 && (
                  <span className="ml-auto rounded-full bg-blue-900/60 px-2 py-0.5 font-mono text-[11px] text-blue-100">
                    {pendentes}
                    <span className="sr-only"> aguardando alocação</span>
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function Marca() {
  return (
    <Link href="/alunos" className="flex items-center gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10">
        <GraduationCap className="h-6 w-6 text-white" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Matrículas Escolares</span>
        <span className="text-base font-black tracking-wide text-white">Cianorte · 2027</span>
        <span className="text-xs font-semibold text-blue-200">Versão demonstrativa</span>
      </span>
    </Link>
  )
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(false)

  // Esc fecha o menu do celular.
  useEffect(() => {
    if (!menuAberto) return
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && setMenuAberto(false)
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [menuAberto])

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-marinho"
      >
        Pular para o conteúdo
      </a>

      {/* Menu lateral fixo (telas grandes) */}
      <aside className="hidden bg-marinho text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col" aria-label="Navegação">
        <div className="border-b border-white/10 bg-marinho-escuro px-5 py-6">
          <Marca />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-6">
          <Navegacao />
        </div>
      </aside>

      {/* Menu do celular e tablet */}
      {menuAberto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Fechar menu"
            onClick={() => setMenuAberto(false)}
          />
          <aside id="menu-movel" className="relative h-full w-72 max-w-[85vw] bg-marinho text-white shadow-xl" aria-label="Navegação">
            <div className="flex items-center justify-between border-b border-white/10 bg-marinho-escuro px-5 py-5">
              <Marca />
              <button
                type="button"
                onClick={() => setMenuAberto(false)}
                className="rounded-lg p-2 hover:bg-white/10"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="px-3 py-6">
              <Navegacao aoNavegar={() => setMenuAberto(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
              aria-label="Abrir menu"
              aria-expanded={menuAberto}
              aria-controls="menu-movel"
              onClick={() => setMenuAberto(true)}
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            <p className="truncate text-sm font-semibold text-slate-700">
              Secretaria Municipal de Educação <span className="hidden sm:inline">· Direcionamento de matrículas 2027</span>
            </p>
          </div>
          <div role="note" className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 sm:px-6 lg:px-8">
            <strong>Dados fictícios.</strong> Versão acadêmica (UFMS Digital). O sistema em produção e os dados das
            crianças ficam em ambiente privado da Prefeitura.
          </div>
        </header>

        <main id="conteudo" tabIndex={-1} className="flex-1 px-4 py-6 focus:outline-none sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-4 text-xs text-slate-600 sm:flex-row sm:px-6 lg:px-8">
          <span>
            <strong className="text-slate-800">Matrículas Escolares Cianorte</strong> · versão demonstrativa
          </span>
          <span>Projeto Integrador de TI · UFMS Digital · 2026</span>
        </footer>
      </div>
    </div>
  )
}
