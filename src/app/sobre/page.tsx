import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sobre o projeto' }

const EVOLUCAO = [
  ['31/08/2026', 'Início do repositório do sistema real (Next.js).'],
  ['08 a 11/09', 'Base: login, banco de dados, CI, identidade visual, geocodificação, irmãos, matriz de distâncias e mapa.'],
  ['13 a 15/09', 'Telas principais: Alunos, Central de Alocação com motor de regras e funções transacionais, Escolas & Turmas, Homologação, Trilha de Auditoria e Guia de Regras.'],
  ['20 a 22/09', 'Verificação de lançamento e primeira carga real (947 crianças), com qualificação de endereços. Sistema liberado à Diretoria em 22/09.'],
  ['24 e 25/09', 'Pedidos da reunião com a Direção: tabelão da aba Alunos, PDF e planilha. Início do fluxo com Pull Requests (PR #1).'],
  ['12/10', 'Relação geral em PDF na Homologação e atualização de dependências por segurança (PRs #2 a #5).'],
  ['15/10', 'Edição de endereço do aluno e carga de novos alunos (PRs #6 a #8).'],
  ['27/10', 'Esta versão demonstrativa, com dados fictícios, para a UFMS Digital.'],
]

const DECISOES = [
  ['Next.js com App Router', 'Rotas por pastas, componentes React e renderização no servidor, a mesma base do sistema real.'],
  ['TypeScript', 'Tipos das entidades (aluno, escola, turma) evitam erros nas regras de vagas.'],
  ['Tailwind CSS', 'Estilos responsivos com pontos de quebra (sm, md, lg, xl) direto nos componentes.'],
  ['Regras em funções puras', 'O motor de sugestão não depende da tela nem do banco, por isso é testado isoladamente.'],
  ['Filtros na URL', 'O botão Voltar e os links entre telas preservam a seleção da operadora.'],
  ['Dados fictícios gerados por código', 'Semente fixa: a lista é sempre a mesma e qualquer pessoa pode conferir que foi inventada.'],
  ['Estado no navegador', 'Sem banco nesta versão; no sistema real as decisões são gravadas por funções transacionais no PostgreSQL.'],
]

export default function PaginaSobre() {
  return (
    <article className="max-w-4xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Sobre o projeto</h1>
        <p className="mt-2 text-slate-700">
          Esta é a versão acadêmica do <strong>Matrículas Escolares Cianorte</strong>, um sistema web de apoio à decisão
          usado pela Secretaria Municipal de Educação de Cianorte/PR para direcionar as crianças dos CMEIs às escolas
          municipais. Ela foi feita para a atividade do Módulo 2 do Projeto Integrador de TI da UFMS Digital.
        </p>
      </header>

      <section aria-labelledby="s-privacidade" className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
        <h2 id="s-privacidade" className="text-lg font-bold text-amber-950">
          Por que dados fictícios
        </h2>
        <p className="mt-2 text-sm text-amber-950">
          O sistema real trata nomes, endereços e informações de matrícula de crianças. Pela Lei Geral de Proteção de Dados
          (Lei nº 13.709/2018) e pelo Estatuto da Criança e do Adolescente, esse código e esses dados ficam em ambiente
          privado, sob responsabilidade da Prefeitura. Esta versão reproduz as telas e as regras com alunos, escolas e
          endereços inventados: nenhum registro vem da base real.
        </p>
      </section>

      <section aria-labelledby="s-evolucao">
        <h2 id="s-evolucao" className="text-xl font-bold text-slate-900">
          Evolução do sistema real
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Linha do tempo tirada do histórico do repositório privado: 97 commits, 8 Pull Requests e 336 testes automatizados.
        </p>
        <ol className="mt-4 space-y-3 border-l-2 border-blue-200 pl-5">
          {EVOLUCAO.map(([data, texto]) => (
            <li key={data} className="relative">
              <span className="absolute -left-[1.72rem] top-1.5 h-3 w-3 rounded-full bg-blue-600" aria-hidden="true" />
              <p className="text-sm">
                <strong className="text-slate-900">{data}</strong> — <span className="text-slate-700">{texto}</span>
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="s-decisoes">
        <h2 id="s-decisoes" className="text-xl font-bold text-slate-900">
          Principais decisões de desenvolvimento
        </h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {DECISOES.map(([titulo, texto]) => (
            <div key={titulo} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <dt className="font-semibold text-slate-900">{titulo}</dt>
              <dd className="mt-1 text-sm text-slate-700">{texto}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="s-acessibilidade">
        <h2 id="s-acessibilidade" className="text-xl font-bold text-slate-900">
          Acessibilidade e responsividade
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Estrutura semântica: header, nav, aside, main, section, article e footer; um h1 por página.</li>
          <li>Link “Pular para o conteúdo”, foco visível e navegação completa pelo teclado.</li>
          <li>Tabelas com legenda e cabeçalhos com escopo; todos os campos com rótulo.</li>
          <li>Mensagens de confirmação anunciadas para leitores de tela (aria-live).</li>
          <li>Mapa como complemento: as mesmas informações aparecem em texto.</li>
          <li>Tabelas no computador e cartões no celular, sem rolagem lateral; menu lateral vira menu deslizante.</li>
          <li>Respeito à preferência do sistema por menos animação.</li>
        </ul>
      </section>

      <section aria-labelledby="s-ia">
        <h2 id="s-ia" className="text-xl font-bold text-slate-900">
          Uso de inteligência artificial
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          O desenvolvimento usou o Claude Code como ferramenta de apoio na escrita do código. O levantamento de requisitos
          com a Secretaria, a definição das regras, a validação de cada tela e a aprovação de cada publicação foram feitos
          pelo estudante. Os commits registram essa coautoria de forma explícita.
        </p>
      </section>
    </article>
  )
}
