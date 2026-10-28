# Matrículas Escolares Cianorte — versão demonstrativa

> **Dados fictícios.** Este repositório é a versão acadêmica (UFMS Digital) de um sistema real usado pela
> Secretaria Municipal de Educação de Cianorte/PR. O sistema em produção e os dados das crianças ficam em
> ambiente privado da Prefeitura. Aqui, alunos, escolas e endereços foram **gerados por código**: nenhum registro
> vem da base real.

Aplicação web de apoio à decisão para direcionar as crianças que saem dos CMEIs às escolas municipais no ciclo de 2027.
O sistema sugere até três escolas para cada criança, considerando **distância**, **vagas na série** e **irmão já
matriculado**, e a **operadora da Secretaria decide**. Depois, as alocações são homologadas e exportadas.

Atividade do **Módulo 2 — Desenvolvimento Web com frameworks e HTML/CSS** do Projeto Integrador de Tecnologia da
Informação (UFMS Digital, 2026/2).

![Central de Alocação no computador](docs/capturas/02-central-desktop.png)

## Telas

| Tela | O que faz |
|---|---|
| **Alunos** | Totais da rodada, filtros (nome/CGM, CMEI, série, situação, irmão) guardados na URL, tabela no computador e cartões no celular. |
| **Central de Alocação** | Fila de alunos, até 3 escolas sugeridas, mapa (Leaflet/OpenStreetMap), aprovar, trocar e desfazer. |
| **Escolas & Turmas** | Ocupação de cada escola por série: já matriculados, alocados nesta rodada e vagas livres. |
| **Homologação** | Seleção dos alocados, homologação em lote e exportação da relação em CSV. |
| **Sobre o projeto** | Evolução do sistema real, decisões, acessibilidade, proteção de dados e uso de IA. |

Capturas de todas as telas, no computador e no celular, estão em [`docs/capturas`](docs/capturas).

## Tecnologias

| Camada | Escolha |
|---|---|
| Framework | [Next.js 16.4](https://nextjs.org) com App Router |
| Interface | React 19 + TypeScript 5 |
| Estilo | Tailwind CSS 4 (responsivo por pontos de quebra) |
| Mapa | Leaflet 1.9 + OpenStreetMap |
| Ícones | lucide-react |
| Testes | `node:test` (Node 24, TypeScript sem compilação) |
| Acessibilidade | axe-core 4.10 (auditoria WCAG 2.1 AA) |
| Integração contínua | GitHub Actions |

O sistema real usa a mesma base (Next.js, React, TypeScript, Tailwind) e, além disso, Supabase/PostgreSQL com
autenticação e funções transacionais, e Google Maps para endereços e rotas. Nesta versão não há banco nem chaves:
as decisões ficam no navegador (`localStorage`).

## Como executar

Requisitos: Node.js 24 (os testes leem TypeScript direto) e npm.

```bash
npm install
npm run dev        # http://localhost:3000
```

Outros comandos:

```bash
npm test           # 19 testes das regras, dos dados, dos filtros e da exportação
npm run lint       # ESLint (regras do Next.js)
npm run build      # build de produção
npm start          # serve o build
```

Não há variáveis de ambiente. Para recomeçar a demonstração, use **Reiniciar demonstração** na tela de Homologação.

## Estrutura

```
src/
  app/                 rotas (App Router): alunos, alocacao, turmas, homologacao, sobre
  components/          Shell (layout acessível) e um componente por tela
  data/                escolas e alunos FICTÍCIOS (gerados com semente fixa)
  lib/
    regras.ts          motor de sugestão (Haversine, vagas, irmão) — funções puras
    filtros.ts         filtros da lista e conversão de/para a URL
    exportar.ts        CSV da homologação
    estado.tsx         decisões da operadora (React Context + localStorage)
tests/                 testes com node:test
docs/                  decisões, evolução do sistema real, acessibilidade e capturas
```

## Regras de sugestão

1. Só escola **com vaga na série** do aluno vira opção.
2. **Irmão** numa escola com vaga → essa escola é sempre a **1ª opção**.
3. Irmão numa escola sem vaga → só um **aviso**; as opções seguem a proximidade.
4. As demais opções são as escolas **mais próximas** (linha reta, fórmula de Haversine).
5. A sugestão **não decide sozinha**: a escola só muda quando a operadora aprova.

## Acessibilidade e responsividade

- HTML semântico: `header`, `nav`, `aside`, `main`, `section`, `article`, `footer`, um `h1` por página.
- Link “Pular para o conteúdo”, foco visível, navegação completa pelo teclado.
- Tabelas com `caption` e `th scope`; todos os campos com `label`; mensagens em `aria-live`.
- Tabelas no computador, cartões no celular, menu lateral que vira menu deslizante; sem rolagem lateral de 390 px a 1920 px.
- **Auditoria axe-core (WCAG 2.1 AA + boas práticas): 0 violações nas 5 telas**, no computador e no celular.
  Detalhes em [`docs/ACESSIBILIDADE.md`](docs/ACESSIBILIDADE.md).

## Documentação

- [`docs/DECISOES.md`](docs/DECISOES.md): principais decisões de desenvolvimento e o porquê de cada uma.
- [`docs/EVOLUCAO.md`](docs/EVOLUCAO.md): linha do tempo do sistema real (repositório privado) e desta versão.
- [`docs/ACESSIBILIDADE.md`](docs/ACESSIBILIDADE.md): como a acessibilidade foi verificada e o resultado.

## Proteção de dados e uso de IA

Nenhum dado pessoal real está neste repositório. Os nomes são combinações sorteadas de listas comuns, o CGM tem
prefixo `D-`, as ruas têm nomes sintéticos (letras gregas), as escolas têm nomes de árvores e os CMEIs, de aves; um
teste automatizado confere esse padrão.

O desenvolvimento usou o **Claude Code** como ferramenta de apoio na escrita do código. Requisitos, regras, validação
das telas e aprovação das publicações foram feitos pelo estudante; os commits registram a coautoria (`Co-Authored-By`).

## Autor

Angelo Ponciano — Tecnologia da Informação, UFMS Digital.
