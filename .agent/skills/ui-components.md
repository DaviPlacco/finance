---
name: ui_components_and_design_standards
description: Diretrizes obrigatórias de UI/UX, componentes customizados e proibição de seletores HTML nativos.
triggers:
  - "criar select"
  - "criar dropdown"
  - "ajustar layout"
  - "adicionar seletor"
  - "revisar design"
---

# UI Components & Design Standards Skill

## Regra Inegociável: Proibição de `<select>` Nativo do HTML
1. **Nunca utilize o elemento `<select>` padrão do HTML.**
   - O `<select>` nativo invoca menus padrão do sistema operacional que rompem o tema visual (dark/light mode), não suportam ícones ricos, truncam texto e quebram layouts fluidos.
2. **Utilize sempre o `<CustomSelect>` do projeto:**
   - Localização: `@/components/CustomSelect`
   - Fornece suporte a:
     - Pesquisa e filtros contextuais
     - Ícones, cores personalizadas e badges em cada opção
     - Ações de criação dinâmica (ex: `✨ + Criar Novo...`)
     - Animações refinadas de abertura e alinhamento responsivo (`min-w-full w-full`)
     - Suporte nativo a Dark Mode e acessibilidade (fecho via clique externo e teclado)

## Padrões de Design e Prevenção de Quebras de Linha
- **Containers Estreitos**: Em colunas de formulário ou cards modais (~300px), títulos e badges nunca devem quebrar desordenadamente.
- Utilize:
  - `truncate` e `min-w-0` nos containers de texto
  - `shrink-0` e `whitespace-nowrap` em badges laterais
  - Hierarquia clara: título com `leading-tight` acompanhado de subtítulo explicativo
