# Feirô — Especificação Frontend do Painel Admin

> **Destino do código:** `C:\TCC\Feiro\front`
> **Contexto:** Extensão do app React Native / Expo já existente. O painel admin é uma área dentro do mesmo projeto, com rotas separadas em `src/app/admin/`. O login é unificado via `POST /admins/login`.

---

## 1. Design System — Tokens Exatos do Projeto

### Cores (extraídas do código-fonte)

```ts
// Usar exatamente esses valores em todo o painel admin
export const COLORS = {
  // Marca
  primary:        '#255336',   // verde escuro — botões principais, ícones ativos, títulos
  primaryMedium:  '#4A7C59',   // verde médio — banners, destaques, hover
  primaryLight:   '#E8F5E8',   // verde claro — backgrounds de avatar placeholder, badges success

  // Background
  appBackground:  '#FFF7E4',   // fundo global de TODAS as telas (incluindo admin)
  cardBackground: '#FFFFFF',   // fundo de cards, inputs, modais
  inputBackground:'#FAFAFA',   // fundo de TextInput

  // Texto
  textPrimary:    '#333333',   // títulos e textos principais
  textSecondary:  '#666666',   // subtítulos, labels secundários
  textMuted:      '#999999',   // placeholders, textos desabilitados
  textInverse:    '#FFFFFF',   // texto sobre fundos escuros

  // Status / Semântico
  success:        '#047857',   // texto de badge "Aberto"
  successBg:      '#d1fae5',   // fundo de badge "Aberto"
  danger:         '#dc2626',   // texto de badge "Fechado", erros
  dangerBg:       '#fee2e2',   // fundo de badge "Fechado"
  dangerButton:   '#FF5722',   // botão sair, ações destrutivas
  dangerButtonBg: '#FFF3F3',   // fundo botão sair
  warning:        '#F59E0B',   // status PENDENTE
  warningBg:      '#FEF3C7',
  info:           '#3B82F6',   // status EM_PREPARACAO
  infoBg:         '#DBEAFE',

  // Bordas / Divisores
  border:         '#E0E0E0',
  borderLight:    '#E5E5E5',
  borderCard:     '#EEEEEE',

  // Status de Pedido (pipeline)
  statusPendente:     { bg: '#FEF3C7', text: '#92400E' },
  statusEmPreparacao: { bg: '#DBEAFE', text: '#1E40AF' },
  statusEmAndamento:  { bg: '#EDE9FE', text: '#5B21B6' },
  statusEmRota:       { bg: '#F3E8FF', text: '#7E22CE' },
  statusEntregue:     { bg: '#D1FAE5', text: '#065F46' },
  statusFinalizado:   { bg: '#E8F5E8', text: '#255336' },
  statusCancelado:    { bg: '#FEE2E2', text: '#DC2626' },
  statusRetornando:   { bg: '#FFEDD5', text: '#C2410C' },
} as const
```

### Tipografia

```ts
// Fontes carregadas no _layout.tsx do projeto
// "Poppins-Regular" e "Poppins-SemiBold" já estão disponíveis

export const FONTS = {
  regular:  'Poppins-Regular',
  semibold: 'Poppins-SemiBold',
} as const

export const TYPOGRAPHY = {
  h1:      { fontSize: 24, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  h2:      { fontSize: 20, fontFamily: 'Poppins-SemiBold', color: '#333333' },
  h3:      { fontSize: 18, fontFamily: 'Poppins-SemiBold', color: '#333333' },
  body:    { fontSize: 16, fontFamily: 'Poppins-Regular',  color: '#333333' },
  small:   { fontSize: 14, fontFamily: 'Poppins-Regular',  color: '#666666' },
  caption: { fontSize: 12, fontFamily: 'Poppins-Regular',  color: '#999999' },
  label:   { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#333333' },
} as const
```

### Espaçamento e Forma

```ts
export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 }

export const RADIUS = { sm: 8, md: 12, lg: 16, full: 9999 }

// Shadow padrão dos cards do projeto
export const SHADOW = {
  card: {
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
    elevation: 2,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
}
```

---

## 2. Estrutura de Pastas — Espelhar o Projeto Existente

Adicionar dentro de `src/` as seguintes pastas/arquivos. **Não alterar** nada fora dessas pastas:

```
src/
├── app/
│   └── admin/                          ← NOVO
│       ├── _layout.tsx                 ← Layout do painel admin (sidebar + header admin)
│       ├── index.tsx                   ← Redirect para /admin/dashboard
│       ├── login.tsx                   ← Tela de login unificada (feirante + admin)
│       ├── dashboard.tsx               ← Dashboard com stats e gráficos
│       ├── feiras/
│       │   ├── index.tsx               ← Lista de feiras
│       │   └── [id].tsx                ← Detalhe / edição de feira
│       ├── feirantes/
│       │   ├── index.tsx               ← Lista de feirantes
│       │   └── [id].tsx                ← Detalhe / edição de feirante
│       ├── mercadorias/
│       │   ├── index.tsx               ← Lista de mercadorias
│       │   └── [id].tsx                ← Detalhe / edição de mercadoria
│       ├── cestas/
│       │   ├── index.tsx               ← Lista de cestas
│       │   └── [id].tsx                ← Detalhe / edição de cesta
│       ├── pedidos/
│       │   ├── index.tsx               ← Lista de pedidos
│       │   └── [id].tsx                ← Detalhe do pedido + atualização de status
│       ├── usuarios/
│       │   ├── index.tsx               ← Lista de usuários
│       │   └── [id].tsx                ← Detalhe do usuário
│       └── perfil.tsx                  ← Perfil do admin/feirante logado
│
├── contexts/
│   └── AdminContext.tsx                ← NOVO — estado global do painel admin
│
└── components/
    ├── admin/                          ← NOVO — componentes exclusivos do admin
    │   ├── AdminHeader/
    │   │   ├── index.tsx
    │   │   └── styles.ts
    │   ├── AdminNav/
    │   │   ├── index.tsx
    │   │   └── styles.ts
    │   ├── StatsCard/
    │   │   ├── index.tsx
    │   │   └── styles.ts
    │   ├── DataTable/
    │   │   ├── index.tsx
    │   │   └── styles.ts
    │   ├── StatusBadge/
    │   │   ├── index.tsx
    │   │   └── styles.ts
    │   ├── FormInput/
    │   │   ├── index.tsx
    │   │   └── styles.ts
    │   ├── ActionButton/
    │   │   ├── index.tsx
    │   │   └── styles.ts
    │   └── ConfirmModal/
    │       ├── index.tsx
    │       └── styles.ts
    └── (manter todos os componentes existentes intactos)
```

---

## 3. Contexto Admin — `src/contexts/AdminContext.tsx`

```tsx
// Estado global do painel admin
// Gerencia: admin logado, token JWT, nível de acesso e feirante vinculado (para nível 1)

interface AdminLogado {
  id: string
  nome: string
  email: string
  nivel: 1 | 2 | 3       // 1=Feirante, 2=Moderador, 3=Administrador
  token: string
  feiranteId?: number    // preenchido automaticamente para nivel 1
}

interface AdminContextValue {
  admin: AdminLogado | null
  loading: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
  isNivel: (minNivel: number) => boolean
}
```

**Lógica de login:**
1. Chamar `POST /admins/login` com `{ email, senha }`
2. Salvar resposta no `AsyncStorage` com chave `@feiro:admin`
3. Se `nivel === 1`, chamar `GET /feirantes?adminId={id}` para obter o `feirante_id` vinculado e salvar em `admin.feiranteId`
4. Redirecionar: `nivel === 1` → `/admin/dashboard` (view restrita), `nivel >= 2` → `/admin/dashboard` (view completa)

**Lógica de logout:**
- Limpar `AsyncStorage`
- Redirecionar para `/admin/login`

**Hook de proteção de rota:**
```ts
// Usar em toda tela do admin
function useAdminGuard(minNivel = 1) {
  const { admin, loading } = useAdmin()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!admin || admin.nivel < minNivel)) {
      router.replace('/admin/login')
    }
  }, [admin, loading])
}
```

---

## 4. Layout Admin — `src/app/admin/_layout.tsx`

O layout do painel admin é **diferente** do layout principal do app. Ele não usa o `Header` nem o `Nav` existentes. Cria seus próprios componentes `AdminHeader` e `AdminNav`.

```tsx
// Estrutura do layout:
// - SafeAreaProvider + SafeAreaView (fundo: #FFF7E4)
// - AdminHeader no topo
// - Slot (conteúdo das telas)
// - AdminNav na parte inferior (condicional — não mostrar na tela de login)

// Rotas SEM AdminHeader e AdminNav:
const rotasSemLayout = ['/admin/login']
```

---

## 5. Componentes Admin

### 5.1 `AdminHeader` — `src/components/admin/AdminHeader/`

**Visual:** Espelhar o `Header` do app principal, mas com informações do admin.

```
[Logo Feirô pequena]  [Painel Admin]         [👤 Nome do admin  ▼]
backgroundColor: #FFF7E4
height: 100, paddingTop: 30
borderBottom: sombra leve (elevation: 2)
```

**Props:**
```ts
interface AdminHeaderProps {
  titulo?: string   // ex: "Feiras", "Pedidos" — exibido no centro
}
```

**Comportamento:** Toque no nome do admin abre menu com opções: "Meu Perfil" e "Sair".

**Styles (espelhar `Header/styles.ts`):**
```ts
StyleSheet.create({
  header: {
    backgroundColor: '#FFF7E4',
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 30,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
    shadowOpacity: 1,
  },
  // ... resto igual ao Header existente
})
```

---

### 5.2 `AdminNav` — `src/components/admin/AdminNav/`

**Visual:** Espelhar o `Nav` do app principal (mesmo estilo, mesma altura). Itens variam por nível.

**Itens por nível:**

```ts
// nivel 1 — Feirante
const navFeirante = [
  { name: 'Painel',    icon: 'grid',           route: '/admin/dashboard' },
  { name: 'Produtos',  icon: 'leaf',           route: '/admin/mercadorias' },
  { name: 'Cestas',    icon: 'basket',         route: '/admin/cestas' },
  { name: 'Pedidos',   icon: 'receipt',        route: '/admin/pedidos' },
  { name: 'Perfil',    icon: 'person',         route: '/admin/perfil' },
]

// nivel 2 — Moderador
const navModerador = [
  { name: 'Painel',    icon: 'grid',           route: '/admin/dashboard' },
  { name: 'Feirantes', icon: 'storefront',     route: '/admin/feirantes' },
  { name: 'Pedidos',   icon: 'receipt',        route: '/admin/pedidos' },
  { name: 'Usuários',  icon: 'people',         route: '/admin/usuarios' },
  { name: 'Perfil',    icon: 'person',         route: '/admin/perfil' },
]

// nivel 3 — Admin completo
const navAdmin = [
  { name: 'Painel',    icon: 'grid',           route: '/admin/dashboard' },
  { name: 'Feiras',    icon: 'map',            route: '/admin/feiras' },
  { name: 'Feirantes', icon: 'storefront',     route: '/admin/feirantes' },
  { name: 'Pedidos',   icon: 'receipt',        route: '/admin/pedidos' },
  { name: 'Usuários',  icon: 'people',         route: '/admin/usuarios' },
]
```

**Cor ativa:** `#255336` (igual ao Nav do app)
**Cor inativa:** `#666`

**Styles (copiar exatamente de `Nav/styles.ts`):**
```ts
StyleSheet.create({
  nav: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: 20,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  div: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    height: 60,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
})
```

---

### 5.3 `StatsCard` — `src/components/admin/StatsCard/`

Card de métrica para o dashboard.

```ts
interface StatsCardProps {
  titulo: string       // ex: "Total de Pedidos"
  valor: string | number
  icone: string        // nome do Ionicons
  corIcone?: string    // default: '#255336'
  corFundo?: string    // default: '#E8F5E8'
}
```

**Visual:**
```
┌─────────────────────────────┐
│  🟢  [ícone]   "42"         │  ← valor grande, Poppins-SemiBold, 28px, #255336
│      "Total de Pedidos"     │  ← label, 14px, Poppins-Regular, #666
└─────────────────────────────┘
backgroundColor: #FFFFFF
borderRadius: 12
padding: 20
elevation: 2 (shadow padrão de card)
```

**Styles:**
```ts
StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flex: 1,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
    shadowOpacity: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  valor: {
    fontSize: 28,
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
    marginBottom: 4,
  },
  titulo: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666666',
  },
})
```

---

### 5.4 `StatusBadge` — `src/components/admin/StatusBadge/`

Badge colorido para status de pedido, feira ou feirante.

```ts
type StatusPedido = 'PENDENTE' | 'EM_PREPARACAO' | 'EM_ANDAMENTO' | 'EM_ROTA' | 'ENTREGUE' | 'FINALIZADO' | 'CANCELADO' | 'RETORNANDO'
type StatusLoja = 'Aberto' | 'Fechado'

interface StatusBadgeProps {
  status: StatusPedido | StatusLoja
}
```

**Mapeamento de cores (usar os tokens acima):**
```ts
const STATUS_MAP = {
  PENDENTE:      { bg: '#FEF3C7', text: '#92400E', label: 'Pendente' },
  EM_PREPARACAO: { bg: '#DBEAFE', text: '#1E40AF', label: 'Em Preparação' },
  EM_ANDAMENTO:  { bg: '#EDE9FE', text: '#5B21B6', label: 'Em Andamento' },
  EM_ROTA:       { bg: '#F3E8FF', text: '#7E22CE', label: 'Em Rota' },
  ENTREGUE:      { bg: '#D1FAE5', text: '#065F46', label: 'Entregue' },
  FINALIZADO:    { bg: '#E8F5E8', text: '#255336', label: 'Finalizado' },
  CANCELADO:     { bg: '#FEE2E2', text: '#DC2626', label: 'Cancelado' },
  RETORNANDO:    { bg: '#FFEDD5', text: '#C2410C', label: 'Retornando' },
  Aberto:        { bg: '#d1fae5', text: '#047857', label: 'Aberto' },   // igual ao Card existente
  Fechado:       { bg: '#fee2e2', text: '#dc2626', label: 'Fechado' },  // igual ao Card existente
}
```

**Visual (espelhar o badge de status do `Card/styles.ts` existente):**
```ts
StyleSheet.create({
  badge: {
    borderRadius: 9999,          // igual ao statusClosed/Open do Card existente
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
})
```

---

### 5.5 `DataTable` — `src/components/admin/DataTable/`

Tabela reutilizável com FlatList para listas do admin.

```ts
interface DataTableProps<T> {
  dados: T[]
  colunas: { key: keyof T; titulo: string; largura?: number; render?: (item: T) => ReactNode }[]
  onPress?: (item: T) => void
  emptyMessage?: string
  loading?: boolean
}
```

**Visual:**
- Cabeçalho das colunas: fundo `#F3F4F6`, texto `Poppins-SemiBold` 13px, cor `#333`
- Linhas: fundo `#FFFFFF`, borda inferior `1px solid #EEEEEE`
- Linha ao pressionar: `backgroundColor: '#F9FFF9'` (verde levíssimo)
- Loading: `ActivityIndicator` cor `#255336`
- Vazio: texto centralizado `Poppins-Regular` 16px cor `#999`
- Usa `FlatList` com `removeClippedSubviews` para performance

---

### 5.6 `FormInput` — `src/components/admin/FormInput/`

Input reutilizável para formulários, espelhando o estilo do `login/index.tsx`.

```ts
interface FormInputProps {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  keyboardType?: KeyboardTypeOptions
  editable?: boolean
  error?: string           // mensagem de erro abaixo do input
  multiline?: boolean
  numberOfLines?: number
}
```

**Styles (copiar exatamente do login):**
```ts
StyleSheet.create({
  container: { gap: 8 },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    backgroundColor: '#FAFAFA',
    color: '#333333',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#DC2626',
  },
})
```

---

### 5.7 `ActionButton` — `src/components/admin/ActionButton/`

Botão de ação primária, espelhando o botão "Entrar" do login.

```ts
interface ActionButtonProps {
  label: string
  onPress: () => void
  loading?: boolean
  variant?: 'primary' | 'outline' | 'danger'
  disabled?: boolean
  icon?: string   // nome do Ionicons
}
```

**Variants (baseadas nos botões existentes no projeto):**
```ts
// primary — igual ao botão "Entrar" do login
primary: {
  backgroundColor: '#255336',
  height: 56,
  borderRadius: 8,
  // texto: #FFFFFF, Poppins-SemiBold 16px
}

// outline — igual ao feiraAbertaMapButton do styles.ts
outline: {
  borderWidth: 1,
  borderColor: '#255336',
  height: 56,
  borderRadius: 8,
  backgroundColor: 'transparent',
  // texto: #255336, Poppins-SemiBold 16px
}

// danger — igual ao sairButton do perfil
danger: {
  backgroundColor: '#FFF3F3',
  borderWidth: 1,
  borderColor: '#FFE0E0',
  height: 56,
  borderRadius: 8,
  // texto: #FF5722, Poppins-SemiBold 16px
}
```

---

### 5.8 `ConfirmModal` — `src/components/admin/ConfirmModal/`

Modal de confirmação para ações destrutivas (delete, cancelamento).

```ts
interface ConfirmModalProps {
  visible: boolean
  titulo: string
  mensagem: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  confirmLabel?: string   // default: "Confirmar"
  confirmVariant?: 'primary' | 'danger'
}
```

**Visual:** Modal centralizado com fundo `#FFFFFF`, `borderRadius: 16`, `padding: 24`. Overlay semitransparente `rgba(0,0,0,0.5)`.

---

## 6. Telas do Painel Admin

### 6.1 Login — `src/app/admin/login.tsx`

**Rota:** `/admin/login`
**Proteção:** Pública. Se já logado, redirecionar para `/admin/dashboard`.

**Layout — copiar estrutura EXATA de `src/app/login/index.tsx`:**

```
fundo: #FFF7E4

┌─────────────────────────────┐
│                             │
│     [Logo Feirô]            │
│   "Painel Administrativo"   │  ← subtitle: Poppins-Regular 16px #4A4A4A
│                             │
│  ┌───────────────────────┐  │
│  │ Acesso Administrativo │  │  ← card branco, borderRadius: 16, padding: 32, elevation: 5
│  │                       │  │
│  │  [Label: E-mail]      │  │
│  │  [TextInput email]    │  │  ← estilo exato do login existente
│  │                       │  │
│  │  [Label: Senha]       │  │
│  │  [TextInput senha]    │  │
│  │                       │  │
│  │  [Botão: Entrar]      │  │  ← bg: #255336, height: 56, borderRadius: 8
│  │    (ActivityIndicator │  │    se isLoading)
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

**Chamada de API:**
```ts
// POST /admins/login
const response = await fetch(`${API_BASE}/admins/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, senha }),
})
const data = await response.json()
// data: { id, nome, email, nivel, token }

// Salvar no AdminContext e AsyncStorage
// nivel 1 → buscar feirante vinculado → redirecionar
// nivel 2/3 → redirecionar direto para /admin/dashboard
```

**Tratamento de erro:** `alert(data.erro || 'Login ou senha incorretos')` — igual ao padrão do app.

---

### 6.2 Dashboard — `src/app/admin/dashboard.tsx`

**Rota:** `/admin/dashboard`
**Proteção:** `useAdminGuard(1)` — qualquer nivel.

**Layout:**

```
fundo: #FFF7E4
paddingHorizontal: 16

[AdminHeader titulo="Dashboard"]

ScrollView:
  ┌─────────────────────────────────┐
  │ "Bom dia, [Nome]! 👋"           │  ← h2 Poppins-SemiBold, cor #255336
  │ "Nível: Administrador"          │  ← caption Poppins-Regular, cor #999
  └─────────────────────────────────┘

  [Somente nivel >= 2: Cards de Stats — em grid 2x2]
  ┌────────────────┬────────────────┐
  │ 👥 Usuários    │ 🏪 Feirantes   │  ← StatsCard
  │ "312"          │ "28"           │
  ├────────────────┼────────────────┤
  │ 📦 Pedidos     │ 🏷️ Cestas      │  ← StatsCard
  │ "1.204"        │ "47"           │
  └────────────────┴────────────────┘
  gap: 12 entre os cards

  [Somente nivel 1: Cards restritos ao feirante]
  ┌────────────────┬────────────────┐
  │ 🥦 Produtos    │ 🧺 Cestas      │
  │ "12"           │ "3"            │
  ├────────────────┼────────────────┤
  │ 📦 Pedidos     │ ⭐ Avaliação   │
  │ "47"           │ "4.8"          │
  └────────────────┴────────────────┘

  [Pedidos recentes — últimos 5]
  Título: "Pedidos Recentes"  ← secaoTitulo do styles.ts existente
  ┌─────────────────────────────────┐
  │ #123  João Silva    R$ 45,90    │
  │ ● EM_ROTA                       │  ← StatusBadge
  ├─────────────────────────────────┤
  │ #122  Maria Santos  R$ 89,00    │
  │ ● PENDENTE                      │
  └─────────────────────────────────┘
  Toque no item → navegar para /admin/pedidos/[id]
```

**Chamadas de API:**
```ts
// Para nivel >= 2:
GET /dashboard/stats           → { totalUsuarios, totalFeirantes, totalPedidos }
GET /cestas                    → contar length do array
GET /pedido                    → primeiros 5 (orderBy id desc, já retorna assim)

// Para nivel 1 (feirante):
GET /mercadorias/feirantes/:feiranteId   → contar produtos
GET /cestas                              → filtrar por feirante_id
GET /pedido                              → filtrar itens do feirante
```

---

### 6.3 Lista de Feiras — `src/app/admin/feiras/index.tsx`

**Rota:** `/admin/feiras`
**Proteção:** `useAdminGuard(3)` — apenas nivel 3.

**Layout:**

```
fundo: #FFF7E4
paddingHorizontal: 16

[AdminHeader titulo="Feiras"]

[Barra de busca — mesmo estilo da Busca existente]
┌────────────────────────────────┐
│ 🔍 Buscar feira...             │  ← TextInput, bg: #FFFFFF, borderRadius: 25, elevation: 3
└────────────────────────────────┘

[Botão "+ Nova Feira" — ActionButton primary, largura total]

FlatList de cards de feira:
┌────────────────────────────────┐
│ Feira Central        [Aberto]  │  ← nome: Poppins-SemiBold 18px
│ Av. Principal, 1234            │  ← endereço: Poppins-Regular 14px #666
│ ⏰ 7h às 14h  📍 5 feirantes   │  ← detalhes: igual ao Card existente
│ [✏️ Editar]  [🗑️ Excluir]      │  ← botões outline e danger pequenos
└────────────────────────────────┘
backgroundColor: #FFFFFF, borderRadius: 12, padding: 16
marginBottom: 12, elevation: 2

Toggle de status (Aberto/Fechado): Switch nativo
trackColor: { false: '#DDD', true: '#255336' }  ← igual ao Switch do Perfil
```

**Chamadas de API:**
```ts
GET /feiras        → lista completa com feirantes inclusos
PATCH /feiras/:id  → { status: 'Aberto' | 'Fechado' }
DELETE /feiras/:id → confirmação via ConfirmModal antes
```

---

### 6.4 Detalhe/Edição de Feira — `src/app/admin/feiras/[id].tsx`

**Rota:** `/admin/feiras/[id]` (id = número ou `'novo'`)

**Layout:**

```
fundo: #FFF7E4
ScrollView, paddingHorizontal: 16

[AdminHeader titulo="Nova Feira" ou "Editar Feira"]

Card de formulário (bg: #FFFFFF, borderRadius: 16, padding: 24, elevation: 5):
  FormInput label="Nome da Feira"
  FormInput label="Endereço"
  FormInput label="Horário" placeholder="7h às 14h"
  FormInput label="Latitude" keyboardType="numeric"
  FormInput label="Longitude" keyboardType="numeric"

  [Select de Status]
  ┌────────────────────────────────┐
  │ Status: [Aberto ▼]             │  ← Picker ou dois TouchableOpacity como tabs
  └────────────────────────────────┘

  FormInput label="URL da Imagem" placeholder="https://..."

  [Botão "Salvar Feira"] ← ActionButton primary

[Somente em edição: Lista de Feirantes da Feira]
Título: "Feirantes desta Feira"
Card simples por feirante com nome, banca e status
```

**Chamadas de API:**
```ts
// Nova feira:
POST /feiras { nome, endereco, horario, latitude, longitude, status, imagem }

// Edição:
GET  /feiras/:id        → preencher formulário
PUT  /feiras/:id        → salvar alterações
```

---

### 6.5 Lista de Feirantes — `src/app/admin/feirantes/index.tsx`

**Rota:** `/admin/feirantes`
**Proteção:** `useAdminGuard(2)` — nivel 2 e 3.

**Layout:**

```
fundo: #FFF7E4
paddingHorizontal: 16

[AdminHeader titulo="Feirantes"]
[Busca igual às outras listas]
[Botão "+ Novo Feirante"] ← apenas nivel 3

[Filtro de Status — dois botões tab]
  [Todos]  [Aberto]  [Fechado]
  botão ativo: bg #255336, texto branco
  botão inativo: border #255336, texto #255336

FlatList de cards:
┌────────────────────────────────────┐
│  [Avatar/Emoji] João da Silva      │  ← Poppins-SemiBold 16px
│  Banca 23 · Feira Central          │  ← Poppins-Regular 14px #666
│  ⭐ 4.8 (234 avaliações)           │
│  Especialidade: Frutas e Verduras  │
│  [Aberto ●]   [✏️ Editar]          │  ← StatusBadge + ActionButton outline pequeno
└────────────────────────────────────┘
backgroundColor: #FFFFFF, borderRadius: 12, padding: 16
marginBottom: 12, elevation: 2
```

**Chamadas de API:**
```ts
GET /feirantes        → lista com feira, mercadorias e cestas inclusos
DELETE /feirantes/:id → com ConfirmModal
```

---

### 6.6 Detalhe/Edição de Feirante — `src/app/admin/feirantes/[id].tsx`

**Rota:** `/admin/feirantes/[id]`

**Layout:**

```
ScrollView, paddingHorizontal: 16

[AdminHeader titulo="Novo Feirante" ou "Editar Feirante"]

Card de formulário:
  FormInput label="Nome completo"
  FormInput label="E-mail" keyboardType="email-address"
  FormInput label="Senha" secureTextEntry (mostrar só ao criar, ocultar ao editar)
  FormInput label="Telefone" keyboardType="phone-pad"
  FormInput label="Endereço"
  FormInput label="Nome da Banca" placeholder="ex: Banca 23"
  FormInput label="Especialidade" placeholder="ex: Frutas e Verduras"

  [Select de Feira — Picker com lista de feiras]
  [Select de Status — Aberto / Fechado]

  [Botão "Salvar Feirante"] ← ActionButton primary

[Somente em edição: seção de Mercadorias]
Título: "Mercadorias"
Lista horizontal de cards simples (nome + preço)
[+ Adicionar mercadoria] → navegar para /admin/mercadorias/novo
```

**Chamadas de API:**
```ts
GET  /feiras              → popular select de feira
GET  /feirantes/:id       → preencher formulário (ao editar)
POST /feirantes           → criar
PUT  /feirantes/:id       → editar (senha opcional — validar no front antes de enviar)
```

> **Atenção:** A senha é obrigatória na API ao criar, mas opcional ao editar. No formulário: ao editar, só enviar o campo `senha` se o usuário preencheu. Se vazio, não incluir no body do PUT.

---

### 6.7 Lista de Mercadorias — `src/app/admin/mercadorias/index.tsx`

**Rota:** `/admin/mercadorias`
**Proteção:** `useAdminGuard(1)`. Para nivel 1, mostrar apenas do `feiranteId` do admin logado.

**Layout:**

```
[AdminHeader titulo="Mercadorias"]
[Busca]
[Botão "+ Nova Mercadoria"]

[Filtro de Categoria — ScrollView horizontal]
  [Todos] [🍎 Frutas] [🥦 Legumes] [🥬 Verduras] [🌿 Temperos]
  estilo dos filtros: igual ao BotaoFiltro existente

FlatList de cards:
┌─────────────────────────────────────┐
│ 🍅 Tomate Italiano                  │  ← emoji + nome, Poppins-SemiBold 16px
│ R$ 8,90/kg · Estoque: 12 unid.      │  ← Poppins-Regular 14px #666
│ Feirante: João da Silva             │  ← apenas para nivel >= 2
│ [FRUTAS]  [★ Destaque]              │  ← badges de categoria e destaque
│ [✏️ Editar]  [🗑️ Excluir]            │
└─────────────────────────────────────┘
```

**Chamadas de API:**
```ts
// nivel 1:
GET /mercadorias/feirantes/:feiranteId

// nivel >= 2:
GET /mercadorias

DELETE /mercadorias/:id  → com ConfirmModal
PATCH  /mercadorias/:id  { destaque: boolean }  → toggle direto na lista
```

---

### 6.8 Detalhe/Edição de Mercadoria — `src/app/admin/mercadorias/[id].tsx`

**Layout:**

```
ScrollView, paddingHorizontal: 16

[AdminHeader titulo="Nova Mercadoria" ou "Editar Mercadoria"]

Card de formulário:
  FormInput label="Nome"
  FormInput label="Preço (R$)" keyboardType="numeric"
  FormInput label="Quantidade em estoque" keyboardType="numeric"
  FormInput label="Emoji" placeholder="🍅" maxLength={2}

  [Select de Categoria]
  Botões tab: FRUTAS | LEGUMES | VERDURAS | TEMPEROS
  ativo: bg #255336, texto branco, borderRadius 8
  inativo: border #255336, borderRadius 8

  [Select de Unidade]
  Botões tab: UN | KG | CX

  [Toggle de Destaque]
  ┌────────────────────────────────────┐
  │ Produto em destaque    [Switch]    │  ← Switch igual ao perfil
  └────────────────────────────────────┘

  FormInput label="URL da Foto" placeholder="https://..."

  [Somente nivel >= 2: Select de Feirante]

  [Botão "Salvar Mercadoria"] ← ActionButton primary
```

---

### 6.9 Lista de Cestas — `src/app/admin/cestas/index.tsx`

**Rota:** `/admin/cestas`
**Proteção:** `useAdminGuard(1)`. Nivel 1: filtrar por feiranteId.

**Layout:**

```
[AdminHeader titulo="Cestas"]
[Busca]
[Botão "+ Nova Cesta"]

FlatList de cards:
┌────────────────────────────────────┐
│ 🥕 Kit Sopão              R$25,90  │  ← emoji + nome + preço
│ Feirante: João da Silva             │
│ 5 itens  · 10% OFF                 │
│ [✏️ Editar]  [🗑️ Excluir]          │
└────────────────────────────────────┘
```

---

### 6.10 Detalhe/Edição de Cesta — `src/app/admin/cestas/[id].tsx`

**Layout:**

```
[AdminHeader titulo="Nova Cesta" ou "Editar Cesta"]

Card de formulário:
  FormInput label="Nome da Cesta"
  FormInput label="Preço (R$)"
  FormInput label="Desconto" placeholder="ex: 10% OFF"
  FormInput label="Emoji" placeholder="🧺"
  FormInput label="Categoria" placeholder="ex: Semanal"
  FormInput label="URL da Imagem"

  [Select de Feirante — Picker (apenas nivel >= 2)]

  [Seletor de Mercadorias]
  Título: "Mercadorias da Cesta"
  Lista de mercadorias disponíveis com checkbox
  ┌────────────────────────────────┐
  │ ☑️ Tomate Italiano — R$ 8,90   │
  │ ☑️ Cenoura — R$ 5,90           │
  │ ☐ Alface — R$ 3,50             │
  └────────────────────────────────┘

  [Botão "Salvar Cesta"]
```

---

### 6.11 Lista de Pedidos — `src/app/admin/pedidos/index.tsx`

**Rota:** `/admin/pedidos`
**Proteção:** `useAdminGuard(1)`.

**Layout:**

```
[AdminHeader titulo="Pedidos"]

[Filtro de Status — ScrollView horizontal]
  [Todos] [Pendente] [Em Preparação] [Em Andamento] [Em Rota] [Entregue] [Finalizado] [Cancelado]
  estilo igual aos filtros de categoria acima

FlatList de cards:
┌───────────────────────────────────────┐
│ Pedido #123              R$ 45,90     │  ← id Poppins-SemiBold #255336, valor #255336
│ João Silva               ● PENDENTE   │  ← nome + StatusBadge
│ 3 itens · 15/01/2025 14:32            │  ← Poppins-Regular 12px #999
└───────────────────────────────────────┘
backgroundColor: #FFFFFF, borderRadius: 12, padding: 16, marginBottom: 8
borderLeftWidth: 4, borderLeftColor: cor do status (usar COLORS.statusXxx.text)

Toque → navegar para /admin/pedidos/[id]
```

**Chamadas de API:**
```ts
GET /pedido   → lista completa com usuario e items inclusos
// Para nivel 1: filtrar no front por mercadorias do feiranteId
```

---

### 6.12 Detalhe do Pedido — `src/app/admin/pedidos/[id].tsx`

**Layout:**

```
[AdminHeader titulo="Pedido #123"]

ScrollView:

Card de info do pedido (bg #FFFFFF, borderRadius 12, padding 20):
  "Pedido #123"              ← Poppins-SemiBold 22px #255336
  "15/01/2025 às 14:32"      ← Poppins-Regular 14px #666
  StatusBadge grande         ← o status atual

Card de cliente:
  "Cliente"                  ← secaoTitulo
  Nome: João Silva
  E-mail: joao@email.com
  Endereço: Rua X, 123

Card de itens:
  "Itens do Pedido"          ← secaoTitulo
  ┌─────────────────────────────────────────┐
  │ 🍅 Tomate Italiano   2x   R$ 17,80      │
  │     R$ 8,90/kg                          │
  ├─────────────────────────────────────────┤
  │ 🥬 Alface Crespa     1x   R$ 3,50       │
  ├─────────────────────────────────────────┤
  │ Total                       R$ 21,30    │  ← Poppins-SemiBold 18px #255336
  └─────────────────────────────────────────┘

[Atualizar Status]
  Título: "Atualizar Status do Pedido"
  ┌────────────────────────────────────────────┐
  │ [Pendente] [Em Prep.] [Em Andamento] ...   │  ← Botões/chips por status
  └────────────────────────────────────────────┘
  Chip selecionado: bg #255336, texto branco
  Chip desmarcado: border #E0E0E0, texto #666

  [Botão "Confirmar Atualização"] ← ActionButton primary
  ⚠️ "O cliente receberá um e-mail automático"  ← caption #999

[Somente nivel 3: Botão "Excluir Pedido"] ← ActionButton danger
```

**Chamadas de API:**
```ts
GET   /pedido/:id (ou filtrar da lista)
PATCH /pedido/:id   { status }   → dispara e-mail automático na API
DELETE /pedido/:id               → com ConfirmModal, apenas nivel 3
```

---

### 6.13 Lista de Usuários — `src/app/admin/usuarios/index.tsx`

**Rota:** `/admin/usuarios`
**Proteção:** `useAdminGuard(2)`.

**Layout:**

```
[AdminHeader titulo="Usuários"]
[Busca — chama GET /usuarios/pesquisa/:termo]

FlatList de cards:
┌────────────────────────────────────┐
│ 👤 João Silva                       │  ← Poppins-SemiBold 16px
│ joao@email.com                     │  ← Poppins-Regular 14px #666
│ (51) 99999-9999 · Bairro Centro    │
│ Cadastrado: 15/01/2025             │
│ [Ver Perfil]                       │  ← ActionButton outline pequeno
└────────────────────────────────────┘

[Somente nivel 3: Botão "Excluir" em cada card]
```

---

### 6.14 Detalhe do Usuário — `src/app/admin/usuarios/[id].tsx`

**Layout:**

```
[AdminHeader titulo="Usuário"]

Card de avatar (espelhar usuarioCard do Perfil existente):
  [Ícone pessoa circular, bg #E8F5E8]  ← igual ao avatarPlaceholder do perfil
  Nome completo — Poppins-SemiBold 20px #333
  E-mail — Poppins-Regular 14px #666
  Telefone | Endereço | Bairro

Card de estatísticas:
  "X pedidos realizados"  ← StatCard simples

Lista de pedidos do usuário:
  Título: "Histórico de Pedidos"
  ← igual ao pedidoCard do perfil existente
  ┌──────────────────────────────────────────┐
  │ Pedido #123  3 itens   R$ 45,90  ● PEND. │
  └──────────────────────────────────────────┘
  Toque → /admin/pedidos/[id]

[Somente nivel 3: Botão "Excluir Usuário"] ← ActionButton danger
```

**Chamadas de API:**
```ts
GET    /usuarios/:id
GET    /pedido/usuario/:usuario_id
DELETE /usuarios/:id   → com ConfirmModal
```

---

### 6.15 Perfil do Admin/Feirante — `src/app/admin/perfil.tsx`

**Layout — espelhar exatamente `src/app/perfil/index.tsx`:**

```
[AdminHeader titulo="Meu Perfil"]

Card de avatar e info (igual ao usuarioCard do perfil):
  [Avatar circular] ← avatarPlaceholder com ícone person
  Nome — Poppins-SemiBold 20px
  E-mail — 14px #666
  "Nível: Administrador" ou "Nível: Feirante" ou "Nível: Moderador"

[Somente nivel 1: Card de dados do feirante]
  Banca, Especialidade, Avaliação

[Botão "Sair da conta"] ← igual ao sairButton do perfil
  bg: #FFF3F3, border: #FFE0E0
  ícone: log-out-outline, cor: #FF5722
  texto: "Sair da conta", cor: #FF5722
  → chama logout() do AdminContext → redireciona para /admin/login
```

---

## 7. Variáveis de Ambiente

Adicionar ao `.env` do projeto front:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
# A mesma URL base já usada no app — o painel admin usa os mesmos endpoints
```

---

## 8. Constante da API Admin

Criar `src/utils/adminApi.ts`:

```ts
const API_BASE = (process.env.EXPO_PUBLIC_API_URL as string) || 'http://localhost:3001'

// Helper com token automático
export async function adminFetch(
  path: string,
  options?: RequestInit,
  token?: string
) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers || {}) },
  })
  return response
}
```

---

## 9. Regras de Implementação Obrigatórias

1. **Fundo de todas as telas:** `backgroundColor: '#FFF7E4'` — NUNCA usar branco puro como fundo de tela.

2. **Cards sempre brancos:** `backgroundColor: '#FFFFFF'` com `borderRadius: 12` e `elevation: 2` (shadow padrão).

3. **Cor primária:** `#255336` — usada em botões ativos, ícones selecionados, valores monetários, títulos de seção.

4. **Fontes:** Sempre `fontFamily: 'Poppins-SemiBold'` para títulos e valores; `fontFamily: 'Poppins-Regular'` para corpo. As fontes já estão carregadas no `_layout.tsx` raiz.

5. **Botão principal:** `backgroundColor: '#255336'`, `height: 56`, `borderRadius: 8`, `color: '#FFFFFF'` — copiar exatamente do botão "Entrar" do login.

6. **Switch:** `trackColor: { false: '#DDD', true: '#255336' }`, `thumbColor: '#FFF'` — copiar do `perfil/index.tsx`.

7. **ActivityIndicator de loading:** sempre `color: '#255336'`.

8. **Inputs:** `borderColor: '#E5E5E5'`, `borderRadius: 8`, `padding: 16`, `backgroundColor: '#FAFAFA'` — copiar do login.

9. **Deletar:** sempre abrir `ConfirmModal` antes de chamar a API. Nunca deletar diretamente.

10. **Mensagens de erro:** usar `alert(data.erro || data.error || 'Erro desconhecido')` — padrão já usado no login e no perfil.

11. **Estrutura de arquivo:** cada componente em sua própria pasta com `index.tsx` + `styles.ts` — padrão de todos os componentes existentes em `src/components/`.

12. **Importação de contexto:** o `AdminContext` envolve apenas as rotas `/admin/*` no `_layout.tsx` do admin. Não alterar o `AppProvider`, `UserProvider` ou `CestaProvider` existentes.

13. **Ícones:** usar exclusivamente `@expo/vector-icons` (Ionicons) — já instalado e em uso no projeto.

---

## 10. Resumo de Rotas e Permissões

| Rota | Nivel mínimo | Descrição |
|---|---|---|
| `/admin/login` | Pública | Login unificado feirante/admin |
| `/admin/dashboard` | 1 | Painel restrito por nivel |
| `/admin/feiras` | 3 | Apenas admin total |
| `/admin/feiras/[id]` | 3 | Criar/editar feira |
| `/admin/feirantes` | 2 | Moderador e admin |
| `/admin/feirantes/[id]` | 2 | Criar/editar feirante |
| `/admin/mercadorias` | 1 | Feirante vê só os seus |
| `/admin/mercadorias/[id]` | 1 | Criar/editar mercadoria |
| `/admin/cestas` | 1 | Feirante vê só as suas |
| `/admin/cestas/[id]` | 1 | Criar/editar cesta |
| `/admin/pedidos` | 1 | Feirante vê pedidos dos seus produtos |
| `/admin/pedidos/[id]` | 1 | Detalhe + atualizar status |
| `/admin/usuarios` | 2 | Moderador e admin |
| `/admin/usuarios/[id]` | 2 | Detalhe do usuário |
| `/admin/perfil` | 1 | Perfil de quem está logado |
