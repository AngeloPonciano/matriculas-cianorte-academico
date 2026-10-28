# Acessibilidade

## Práticas aplicadas

| Prática | Onde |
|---|---|
| `lang="pt-BR"` e um `h1` por página | `src/app/layout.tsx` e cada `page.tsx` |
| Marcos semânticos: `header`, `nav`, `aside`, `main`, `footer` | `src/components/Shell.tsx` |
| Link “Pular para o conteúdo” e foco visível (contorno amarelo de 3 px) | `Shell.tsx`, `globals.css` |
| Página atual indicada com `aria-current="page"` | menu lateral |
| Botão do menu do celular com `aria-expanded`/`aria-controls`; Esc fecha | `Shell.tsx` |
| Todos os campos com `label`; busca com `role="search"` | Alunos, Escolas & Turmas, Homologação |
| Tabelas com `caption` e `th scope="col"`/`scope="row"` | Alunos, Central, Homologação |
| Confirmações anunciadas com `aria-live="polite"` | Central e Homologação |
| Ícones decorativos com `aria-hidden`; ícones informativos com `aria-label` | todas as telas |
| Mapa com rótulo e informação equivalente em texto | Central |
| Contraste AA nas combinações de texto | tokens em `globals.css` |
| `prefers-reduced-motion` respeitado | `globals.css` |

## Verificação automatizada

- **Ferramenta:** axe-core 4.10.3, regras `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` e `best-practice`.
- **Data:** 27/10/2026, sobre o build de produção (`npm run build && npm start`), com Playwright/Chromium.
- **Larguras:** 1920 × 1080 (computador) e 390 × 844 (celular).

| Tela | Computador | Celular | Rolagem lateral |
|---|---|---|---|
| Alunos | 0 violações | 0 violações | não |
| Central de Alocação | 0 violações | 0 violações | não |
| Escolas & Turmas | 0 violações | 0 violações | não |
| Homologação | 0 violações | 0 violações | não |
| Sobre o projeto | 0 violações | 0 violações | não |

Como repetir: com o servidor no ar, injete `node_modules/axe-core/axe.min.js` na página (por exemplo, `page.addScriptTag`
no Playwright) e execute `axe.run(document)`.

## Limites

Ferramentas automáticas encontram parte dos problemas de acessibilidade. Testes com pessoas usando leitores de tela
(NVDA, TalkBack) e navegação só por teclado em sessões reais ficam como próximo passo.
