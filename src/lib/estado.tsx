'use client'

/**
 * Estado compartilhado entre as telas: as decisões da operadora.
 *
 * No sistema real as decisões são gravadas no banco por funções transacionais.
 * Aqui ficam no navegador (localStorage), para a demonstração funcionar sem
 * servidor de dados. Se o armazenamento não estiver disponível, tudo segue em memória.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ALUNOS } from '@/data/alunos'
import { ESCOLAS } from '@/data/escolas'
import { decisoesIniciais } from './regras'
import type { Decisoes } from './tipos'

const CHAVE = 'matriculas-demo:decisoes:v1'

interface EstadoDemo {
  decisoes: Decisoes
  alocar: (alunoId: string, escolaId: string) => void
  desfazer: (alunoId: string) => void
  homologar: (alunoIds: string[]) => void
  reiniciar: () => void
}

const Contexto = createContext<EstadoDemo | null>(null)

const INICIAIS = decisoesIniciais(ALUNOS, ESCOLAS)

export function EstadoProvider({ children }: { children: React.ReactNode }) {
  const [decisoes, setDecisoes] = useState<Decisoes>(INICIAIS)

  // Lê o que a pessoa já fez nesta demonstração (depois da hidratação, para o
  // HTML do servidor e o do navegador começarem iguais).
  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(CHAVE)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com armazenamento externo
      if (salvo) setDecisoes(JSON.parse(salvo) as Decisoes)
    } catch {
      /* sem armazenamento: segue com as decisões iniciais */
    }
  }, [])

  const gravar = useCallback((proximas: Decisoes) => {
    setDecisoes(proximas)
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(proximas))
    } catch {
      /* sem armazenamento: o estado vale só nesta aba */
    }
  }, [])

  const valor = useMemo<EstadoDemo>(
    () => ({
      decisoes,
      alocar: (alunoId, escolaId) => gravar({ ...decisoes, [alunoId]: { escolaId, homologado: false } }),
      desfazer: (alunoId) => {
        const proximas = { ...decisoes }
        delete proximas[alunoId]
        gravar(proximas)
      },
      homologar: (alunoIds) => {
        const proximas = { ...decisoes }
        for (const id of alunoIds) if (proximas[id]) proximas[id] = { ...proximas[id], homologado: true }
        gravar(proximas)
      },
      reiniciar: () => {
        try {
          window.localStorage.removeItem(CHAVE)
        } catch {
          /* nada a limpar */
        }
        setDecisoes(INICIAIS)
      },
    }),
    [decisoes, gravar],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useEstado(): EstadoDemo {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useEstado precisa estar dentro de <EstadoProvider>')
  return ctx
}
