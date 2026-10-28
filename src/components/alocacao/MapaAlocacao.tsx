'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import type { Map as MapaLeaflet, LayerGroup } from 'leaflet'
import type { Aluno } from '@/lib/tipos'
import type { EscolaAvaliada } from '@/lib/regras'

const COR_OPCAO = ['#15803d', '#1d4ed8', '#7c3aed']

interface Props {
  aluno: Aluno
  escolas: EscolaAvaliada[]
}

/**
 * Mapa da Central: a casa (fictícia) do aluno, as escolas e um traço até cada opção.
 * O Leaflet mexe direto no DOM, então é carregado só no navegador.
 * O mapa é complemento visual: a mesma informação está na tabela de opções.
 */
export function MapaAlocacao({ aluno, escolas }: Props) {
  const elemento = useRef<HTMLDivElement>(null)
  const mapa = useRef<MapaLeaflet | null>(null)
  const camada = useRef<LayerGroup | null>(null)
  const leaflet = useRef<typeof import('leaflet') | null>(null)

  // Cria o mapa uma única vez.
  useEffect(() => {
    let cancelado = false
    import('leaflet').then((L) => {
      if (cancelado || !elemento.current || mapa.current) return
      leaflet.current = L
      mapa.current = L.map(elemento.current, { scrollWheelZoom: false }).setView([aluno.lat, aluno.lng], 14)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; colaboradores do <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapa.current)
      camada.current = L.layerGroup().addTo(mapa.current)
      desenhar()
    })
    return () => {
      cancelado = true
      mapa.current?.remove()
      mapa.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- criação única; o desenho segue no efeito abaixo
  }, [])

  function desenhar() {
    const L = leaflet.current
    if (!L || !mapa.current || !camada.current) return
    camada.current.clearLayers()

    const pontos: [number, number][] = [[aluno.lat, aluno.lng]]
    for (const e of escolas) {
      const cor = e.posicao ? COR_OPCAO[e.posicao - 1] : e.vagas.livres > 0 ? '#64748b' : '#dc2626'
      if (e.posicao) {
        L.polyline(
          [
            [aluno.lat, aluno.lng],
            [e.escola.lat, e.escola.lng],
          ],
          { color: cor, weight: 3, dashArray: '6 6' },
        ).addTo(camada.current)
        pontos.push([e.escola.lat, e.escola.lng])
      }
      L.circleMarker([e.escola.lat, e.escola.lng], {
        radius: e.posicao ? 11 : 7,
        color: '#fff',
        weight: 2,
        fillColor: cor,
        fillOpacity: 1,
      })
        .bindTooltip(`${e.posicao ? `${e.posicao}ª opção · ` : ''}${e.escola.nome}`)
        .addTo(camada.current)
    }
    L.circleMarker([aluno.lat, aluno.lng], { radius: 9, color: '#fff', weight: 3, fillColor: '#f59e0b', fillOpacity: 1 })
      .bindTooltip(`${aluno.nome} (endereço fictício)`)
      .addTo(camada.current)

    mapa.current.fitBounds(L.latLngBounds(pontos), { padding: [40, 40], maxZoom: 15 })
  }

  // Redesenha ao trocar de aluno ou quando as vagas mudam.
  useEffect(desenhar)

  return (
    <div
      ref={elemento}
      className="h-72 w-full overflow-hidden rounded-xl border border-slate-200 sm:h-80 xl:h-full xl:min-h-[22rem]"
      role="region"
      aria-label="Mapa com a posição fictícia do aluno e das escolas. As mesmas informações estão na tabela de opções."
    />
  )
}
