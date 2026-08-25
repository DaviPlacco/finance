# DAVI FINANCE — REGRAS E DIRETRIZES DE ENGENHARIA & UI/UX

Este repositório segue os mais rigorosos padrões de UX/UI, engenharia de software e design system. Todo e qualquer agente de IA ou desenvolvedor deve cumprir escrupulosamente as seguintes regras inegociáveis:

---

## 🚫 1. PROIBIÇÃO ABSOLUTA DE ALERTS E DIÁLOGOS NATIVOS DO BROWSER

- **NUNCA utilizar `window.alert()`, `window.confirm()` ou `window.prompt()`.**
- Diálogos e alerts nativos do navegador quebram a imersão visual, transmitem amadorismo e degradam severamente a experiência do utilizador.
- **Toda e qualquer ação de confirmação, exclusão, cancelamento ou aviso DEVE utilizar:**
  1. **Modais/Pop-ups customizados do projeto** (como o componente `@/components/ConfirmModal`), integrados com animações suaves (`backdrop-blur`, transições `fade-in`/`zoom-in-95`), suporte a tema escuro/claro e botões de ação estilizados.
  2. **Toast Notifications premium** (via `sonner` com `toast.success()`, `toast.error()`, `toast.info()` ou toasts com ações interativas).
  3. **Estados de feedback em linha** (inline banners ou badges) quando apropriado.

---

## 🎨 2. PADRÕES DE DESIGN SYSTEM & UX/UI

- **Consistência de Cores & Temas**:
  - Respeitar sempre o suporte a Dark Mode e Light Mode (`dark:bg-slate-900`, `dark:border-slate-800`, `dark:text-white`, `bg-white`, `border-slate-200`, `text-slate-900`).
  - Utilizar a cor primária dinâmica configurável pelo utilizador (`text-primary`, `bg-primary`, `border-primary`) e paletas harmónicas (Tailwind CSS tokens).
- **Redução de Fricção e Acessibilidade**:
  - Diálogos de confirmação devem fechar com a tecla `Escape` e suportar navegação/foco acessível.
  - Ações destrutivas (excluir meta, ativo, transação ou grupo) devem ter botões destacados (`bg-rose-600 hover:bg-rose-700`) e botão de cancelamento neutro.
  - Toda a ação assíncrona deve exibir estados de carregamento (spinners, botões `disabled`).

---

## ✨ 3. TRANSIÇÕES FLUIDAS E ANIMAÇÕES DE ENTRADA/SAÍDA (ZERO DESAPARIÇÕES ABRUPTAS)

- **Transições de Aparição e Desaparição**:
  - Toda e qualquer barra flutuante (floating action bar de seleção em lote), toast, modal, pop-up ou elemento dinâmico **DEVE ter transições suaves tanto ao surgir como ao desaparecer**.
  - **Proibição de Desmontagem Abrupta**: Nunca remover subitamente da tela elementos flutuantes com desmontagem instantânea sem transição de fade/slide.
  - Utilizar classes de transição refinadas do Tailwind com curvas de física natural:
    - Estado Visível: `translate-y-0 opacity-100 scale-100 pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`
    - Estado Oculto: `translate-y-8 opacity-0 scale-95 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`
  - Modais e overlays devem utilizar sempre `backdrop-blur` com transições coordenadas de escala (`zoom-in-95`) e opacidade (`fade-in` / `fade-out`).

---

## 🛠️ 4. ARQUITETURA & QUALIDADE DO CÓDIGO

- **Zero Placeholders**: Nunca deixar comentários de omissão ou código incompleto.
- **Sincronização de Estado**: Manter sincronização reativa através de eventos globais de dashboard (`categories-updated`, `groups-updated`, etc.) e mutações otimistas com feedback de Toast.
- **Tratamento Resiliente de Erros**: Toda a chamada à API deve ter blocos `try/catch` com feedback visual imediato via `toast.error()` e fallback elegante caso o backend esteja indisponível.
