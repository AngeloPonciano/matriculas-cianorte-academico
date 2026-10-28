import type { Metadata, Viewport } from 'next'
import { Shell } from '@/components/Shell'
import { EstadoProvider } from '@/lib/estado'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Matrículas Escolares Cianorte — versão demonstrativa',
    template: '%s · Matrículas Cianorte (demo)',
  },
  description:
    'Versão acadêmica, com dados fictícios, do sistema de apoio à alocação de matrículas da rede municipal de Cianorte/PR.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a2552',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <EstadoProvider>
          <Shell>{children}</Shell>
        </EstadoProvider>
      </body>
    </html>
  )
}
