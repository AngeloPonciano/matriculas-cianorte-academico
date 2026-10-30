# Decisões de desenvolvimento

Registro das principais escolhas, no formato contexto → decisão → consequência.

## 1. Publicar uma versão demonstrativa, e não o código de produção

- **Contexto:** o sistema real trata nome, endereço e matrícula de crianças, e seu repositório guarda documentação
  operacional da Secretaria. Uma auditoria (27/10/2026) concluiu que ele não pode ser tornado público.
- **Decisão:** manter o sistema real privado e criar este repositório novo, com dados fictícios, reproduzindo as telas
  e as regras.
- **Consequência:** nenhum risco à LGPD ou à produção. O histórico real é descrito em [`EVOLUCAO.md`](EVOLUCAO.md), sem
  commits fabricados; o histórico deste repositório é o da construção desta versão.

## 2. Next.js com App Router

- **Contexto:** a atividade pede um framework; o sistema real já usa Next.js.
- **Decisão:** Next.js 16.4, uma pasta por tela em `src/app`, layout comum em `layout.tsx`.
- **Consequência:** rotas e layout organizados por convenção; páginas pré-renderizadas (estáticas) e componentes de
  cliente só onde há interação. A versão 16.4.3 foi escolhida por corrigir alertas críticos de segurança da 16.3.

## 3. TypeScript estrito

- **Decisão:** tipos para aluno, escola, turma e decisão (`src/lib/tipos.ts`), com `strict: true`.
- **Consequência:** erros de série, vaga ou id de escola aparecem na compilação, não na tela.

## 4. Tailwind CSS para estilo e responsividade

- **Decisão:** classes utilitárias com pontos de quebra (`sm`, `md`, `lg`, `xl`, `2xl`) e tokens de cor no `@theme`.
- **Consequência:** cada componente declara como se adapta. Tabelas viram cartões abaixo de 768 px; o menu lateral fixo
  vira menu deslizante abaixo de 1024 px; colunas secundárias aparecem só em telas largas.

## 5. Regras de negócio em funções puras

- **Decisão:** o motor de sugestão (`src/lib/regras.ts`) recebe dados e devolve a avaliação, sem React, sem banco e sem
  rede — o mesmo desenho do sistema real.
- **Consequência:** as regras são testadas isoladamente (`tests/regras.test.ts`) e reutilizadas por três telas.

## 6. Filtros e seleção na URL

- **Decisão:** filtros da lista e aluno selecionado ficam em parâmetros de busca (`?serie=...&aluno=...`).
- **Consequência:** o botão Voltar do navegador funciona, links podem ser compartilhados e a Central devolve a operadora
  à lista com os mesmos filtros — padrão pedido pela Secretaria no sistema real.

## 7. Estado das decisões no navegador

- **Contexto:** sem banco nesta versão.
- **Decisão:** React Context + `localStorage`, com tratamento de erro quando o armazenamento não está disponível.
- **Consequência:** a demonstração é dinâmica e persiste entre recarregamentos. No sistema real a gravação é feita por
  funções transacionais no PostgreSQL, que evitam que dois acessos ocupem a mesma vaga.

## 8. Dados fictícios gerados por código

- **Decisão:** sorteio com semente fixa (`src/data/alunos.ts`): CGM `D-`, ruas com letras gregas, escolas com nomes de
  árvores, CMEIs com nomes de aves.
- **Consequência:** a lista é sempre a mesma (testável) e qualquer pessoa confirma que foi inventada.

## 9. Mapa como complemento

- **Decisão:** Leaflet com OpenStreetMap, carregado só no navegador (`next/dynamic` com `ssr: false`), usando marcadores
  circulares.
- **Consequência:** sem chave de API; a mesma informação do mapa (escolas, distância, vagas) está em texto, para quem usa
  leitor de tela.

## 10. Acessibilidade verificada, não presumida

- **Decisão:** HTML semântico desde o início e auditoria automática com axe-core em todas as telas e em duas larguras.
- **Consequência:** 0 violações registradas em [`ACESSIBILIDADE.md`](ACESSIBILIDADE.md). A ferramenta não substitui
  testes com pessoas usando leitores de tela, que ficam como melhoria futura.

## 11. PostgreSQL, executado embutido pelo PGlite

- **Contexto:** o Módulo 3 pede um banco relacional implementado em SQL. O sistema real usa PostgreSQL (Supabase), e
  quem avalia o repositório não deveria precisar instalar e configurar um servidor para conferir os scripts.
- **Decisão:** escrever os scripts em SQL do PostgreSQL e executá-los com o PGlite 0.5.8, que é o PostgreSQL 18
  compilado para WebAssembly e roda dentro do Node, em memória.
- **Consequência:** `npm run db` e `npm test` executam o banco em qualquer máquina e no CI, sem servidor nem senha. Os
  mesmos arquivos rodam num PostgreSQL comum com `psql -f`. A versão foi fixada (`--save-exact`) e escolhida entre as
  publicadas há mais de dois meses.

## 12. Regras críticas garantidas pelo banco, não só pela aplicação

- **Contexto:** no sistema real, duas operadoras podem decidir ao mesmo tempo; uma validação apenas na tela permitiria
  ocupar a mesma última vaga duas vezes.
- **Decisão:** além de chaves e `CHECK`, gatilhos validam série e vaga (travando a turma com `FOR UPDATE`), impedem a
  troca de uma alocação homologada e registram cada ação num histórico que não aceita `UPDATE` nem `DELETE`. Vagas
  livres e situação do aluno são calculadas por visões, nunca armazenadas.
- **Consequência:** nenhum caminho de escrita (tela, script ou acesso direto) consegue gravar uma alocação inválida;
  `05_restricoes.sql` demonstra os 12 bloqueios. Sem contadores redundantes, não há o que dessincronizar.

## 13. Carga gerada a partir dos dados da aplicação, e testes que comparam os dois

- **Decisão:** `database/gerar-dados.ts` produz `02_dados.sql` a partir de `src/data` e do mesmo motor de regras
  (alocações iniciais); os testes comparam a visão de ocupação com `vagasDaSerie()` e a consulta de sugestões com
  `avaliarAluno()`.
- **Consequência:** banco e telas mostram a mesma rodada, e uma mudança de regra que só fosse feita num dos lados
  quebra o CI. As telas continuam usando o `localStorage`; ligá-las ao banco (por rotas de servidor do Next.js) é o
  próximo passo.
