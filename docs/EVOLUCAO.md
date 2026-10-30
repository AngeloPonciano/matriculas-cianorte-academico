# Evolução do projeto

## Sistema real (repositório privado da Prefeitura)

Levantamento feito no histórico Git em 27/10/2026. Números e datas são reais; descrições sem dados pessoais.

| Indicador | Valor |
|---|---|
| Primeiro commit | 31/08/2026 |
| Último commit analisado | 15/10/2026 |
| Commits | 97 |
| Pull Requests | 8 (#1 a #8, de 25/09 a 15/10) |
| Testes automatizados | 336, todos passando em 27/10/2026 |
| CI | GitHub Actions: tipos, auditoria de dependências e testes |

| Período | O que foi construído |
|---|---|
| 31/08 | Projeto Next.js criado. |
| 08–11/09 | Login, banco de dados, CI, identidade visual, gestão de escolas e turmas, geocodificação, vínculo de irmãos, matriz de distâncias e mapa com Leaflet. |
| 13–15/09 | Telas principais: Alunos, Central de Alocação com motor de regras e funções transacionais, Detalhe do Aluno, Escolas & Turmas, Homologação (planilha e PDF), Trilha de Auditoria imutável, Guia de Regras. |
| 20–22/09 | Verificação de lançamento, importador da primeira carga (947 crianças), regras de CEP e qualificação de endereços. Sistema liberado à Diretoria em 22/09. |
| 24–25/09 | Pedidos da reunião com a Direção: tabelão da aba Alunos, PDF e planilha. Início do fluxo com Pull Requests e testes no CI (PR #1). |
| 12/10 | Relação geral em PDF na Homologação (PRs #2 e #3), atualização de dependências por segurança (PR #4) e script de conferência do banco (PR #5). |
| 15/10 | Edição de endereço do aluno (PR #6), documentação (PR #7) e conversor da planilha de alunos novos (PR #8). |

Etapas anteriores, registradas nos relatórios acadêmicos: diagnóstico do processo em planilhas, levantamento de
requisitos com a Diretoria (18 requisitos funcionais, 10 não funcionais e 10 regras de negócio), protótipo navegável em
HTML e inspeção de artefatos.

## Esta versão demonstrativa

O histórico Git deste repositório é o da construção desta versão.

**Módulo 2 (27/10/2026, tag `v0.1.0`)**, uma tela por vez:

1. Estrutura, layout acessível e tela de Alunos.
2. Central de Alocação com sugestões, mapa e decisão da operadora.
3. Escolas & Turmas, Homologação com exportação CSV e Sobre o projeto.
4. Documentação, auditoria de acessibilidade, capturas e CI.

**Módulo 3 (30/10/2026, tag `v0.2.0`)**, no ramo `feature/banco-de-dados`, incorporado à `main` por merge:

1. Esquema PostgreSQL: tabelas, chaves, restrições, gatilhos e visões.
2. Carga inicial gerada a partir dos dados fictícios da aplicação (e correção da ordem dos ids).
3. Scripts de inserção, atualização e remoção.
4. Consultas da rodada, incluindo a regra de sugestão em SQL.
5. Demonstração das restrições bloqueando dados inválidos.
6. Testes que comparam banco e aplicação, e o banco no CI.
7. Documentação do modelo de dados e do fluxo de versionamento.

Consulte `git log` para as datas e mensagens exatas.
