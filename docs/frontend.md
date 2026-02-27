# Documentação de Alterações — Frontend React + Vite

## 1. React Router — Configuração de Roteamento

**Pacote instalado:**
```bash
npm install react-router-dom
```

**Arquivos alterados:** `App.jsx`

`App.jsx` foi refatorado para ser exclusivamente o roteador da aplicação. O conteúdo original foi movido para `src/pages/dashboard.jsx`.

```
src/
├── pages/
│   ├── dashboard.jsx     ← conteúdo original do App.jsx
│   └── configuracoes.jsx ← página nova
├── App.jsx               ← apenas o roteador
```

---

## 2. Barra de Progresso de Navegação

**Pacote instalado:**
```bash
npm install nprogress
```

**Arquivo criado:** `src/components/route-progress-bar.jsx`

Componente que escuta mudanças de rota e exibe uma barra de progresso no topo da página (estilo YouTube). Adicionado dentro do `<BrowserRouter>` no `App.jsx`.

Para personalizar a cor, adicionar no `index.css`:
```css
#nprogress .bar {
  background: #1E3A5F; /* cor primária da empresa */
  height: 3px;
}
```

---

## 3. NavSecondary — Troca de `<a href>` por `<Link>`

**Arquivo alterado:** `src/components/nav-secondary.jsx`

- `<a href={item.url}>` → `<Link to={item.url}>`
- Adicionado `useLocation` para marcar o item ativo com `isActive`
- Navegação sem reload completo do browser

---

## 4. NavMain — Troca de `<a href>` por `<Link>` e Refatoração

**Arquivo alterado:** `src/components/nav-main.jsx`

- Botão hardcoded "Aéreo" (Quick Create do template) removido — movido para o array `navMain` no `app-sidebar.jsx`
- Adicionado `asChild` com `<Link to>` nos itens do `.map()`
- Adicionado `useLocation` para marcar item ativo com `isActive`
- Itens com `url: "#"` redirecionam para `/` como fallback
- Adicionado `SidebarGroupLabel` para título acima do menu

---

## 5. SiteHeader — Título Dinâmico

**Arquivo alterado:** `src/components/site-header.jsx`

- Adicionada prop `title` com valor padrão `"Dashboard"`
- Permite que cada página defina seu próprio título no header
- Botão de alternância dark/light mode mantido

Uso nas páginas:
```jsx
<SiteHeader title="Configurações" />
<SiteHeader title="Dashboard" />
```

---

## 6. AppSidebar — Logo Dinâmica e Separador

**Arquivo alterado:** `src/components/app-sidebar.jsx`

- `<a href="#">` do logo → `<Link to="/">` (React Router)
- `IconInnerShadowTop` substituído por `<img>` dinâmica
- Fallback para `/logoAuth.png` quando a empresa não tiver logo cadastrada
- `onError` na `<img>` garante fallback mesmo se a URL do backend quebrar
- Bloco `navClouds` removido (era conteúdo de exemplo do template shadcn)
- `IconInnerShadowTop` removido dos imports
- Adicionado `Separator` abaixo do logo/nome no `SidebarHeader`
- Botões **Aéreo** e **Cotação** adicionados ao array `navMain`

Estrutura do objeto `empresa` adicionada para futura integração com API:
```js
empresa: {
  nome: "7C Turismo",
  logo: null, // null = usa /logoAuth.png
}
```

---

## 7. Página de Configurações — Criação

**Arquivo criado:** `src/pages/configuracoes.jsx`

**Rota:** `/configuracoes`

### Seção: Link de Captação
- Campo `readOnly` exibindo o link (não editável pelo usuário)
- Badge "Em breve" sinalizando feature pendente
- Botão copiar com feedback visual (ícone vira check verde por 2,5s) + toast

### Seção: Personalização Visual
- **Upload de logo:** botão que aciona `<input type="file" hidden>`, valida formato (JPG/PNG) e tamanho (máx 2MB), preview local com `URL.createObjectURL`
- **Cor primária e secundária:** seletor nativo `type="color"` + campo hex editável, sincronizados entre si
- **Preview em tempo real** das cores combinadas
- Skeleton de loading enquanto carrega dados da API
- Botão salvar com estado de loading

### Endpoints utilizados
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/empresas/minha/personalizacao/` | Carrega cores e logo |
| `PUT` | `/api/empresas/minha/personalizacao/` | Salva cores e logo |

> Chamadas à API estão comentadas no código com `// TODO` — prontas para descomentar quando o backend for conectado. O upload de logo usa `FormData` para envio multipart.

---

## 8. Rotas Registradas

**Arquivo:** `App.jsx`

| Path | Componente |
|------|------------|
| `/` | `Dashboard` |
| `/configuracoes` | `Configuracoes` |

---

## Pendências Futuras

- Conectar chamadas reais à API (remover mocks)
- Implementar Context ou store global para compartilhar logo/cores entre componentes (sidebar + páginas)
- Criar páginas para: Aéreo, Cotação, Gráficos, Kanban, Clientes, Financeiro, Tarefas
- Registrar rotas no `App.jsx` conforme páginas forem criadas
- Adicionar `<Link>` nos itens do `NavUser` (Conta, Cobrança, Notificações) quando as páginas existirem
