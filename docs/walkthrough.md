# InfroPay / Evolux Prod — Arquitectura & Fluxo Completo

## Estrutura Final do Projecto (após limpeza)

```
InfroPay/
│
├── 📄 .env                     # Variáveis locais (nunca versionar)
├── 📄 .env.example             # Template público de variáveis
├── 📄 .env.production          # Variáveis de produção (Vercel)
├── 📄 .env.vercel.local        # Override local para Vercel CLI
├── 📄 .gitignore
├── 📄 eslint.config.js
├── 📄 index.html               # Entry point HTML (Vite)
├── 📄 package.json
├── 📄 package-lock.json
├── 📄 postcss.config.js
├── 📄 README.md
├── 📄 tailwind.config.js
├── 📄 tsconfig.json
├── 📄 tsconfig.app.json
├── 📄 tsconfig.node.json
├── 📄 vercel.json              # Rotas + Serverless config
├── 📄 vite.config.ts           # PWA + build config
│
├── 📁 api/                     # Vercel Serverless Functions (backend)
│   ├── e2payments.ts           # ★ Gateway principal (M-Pesa + e-Mola)
│   ├── webhook.ts              # Receptor de callbacks de pagamento
│   ├── mpesa.ts                # Integração directa M-Pesa
│   ├── emola.ts                # Integração directa e-Mola
│   ├── notify-lowtrack.ts      # Notificações de venda → Lowtrack
│   ├── notify-webhook.ts       # Notificações de venda → webhook custom
│   ├── upload.ts               # Upload de imagens → Supabase Storage
│   ├── catbox.ts               # Upload externo → Catbox.moe
│   ├── payblack.ts             # Gateway alternativo
│   └── push/                   # Notificações push (FCM)
│
├── 📁 public/                  # Assets estáticos (servidos pelo Vite)
│   ├── logo.png
│   ├── evolux_logo.png
│   ├── mpesa_logo.png
│   ├── emola_logo.png
│   ├── utmify-logo.png
│   ├── firebase-messaging-sw.js  # Service Worker para FCM
│   ├── awards/
│   └── integrations/
│
├── 📁 scripts/                 # Scripts utilitários (execução manual)
│   ├── approve_pending.ts      # Aprovar transacções pendentes em lote
│   ├── clear-data.js           # Limpar dados de teste
│   ├── clear-data-admin.js     # Limpar dados (admin)
│   ├── trigger-lowtrack.js     # Disparar evento Lowtrack manualmente
│   ├── e2payments-test.ts      # Teste do gateway E2
│   └── test-lowtrack.ts        # Teste Lowtrack
│
├── 📁 src/                     # Código fonte React/TypeScript
│   ├── App.tsx                 # Root: auth + routing + layout
│   ├── main.tsx                # Entry React + PWA register
│   ├── index.css               # Estilos globais + Tailwind
│   ├── config.ts               # Constantes da aplicação
│   ├── assets/                 # Imagens internas (bundled)
│   ├── components/             # Componentes UI
│   │   ├── LoginView.tsx       # Autenticação
│   │   ├── Sidebar.tsx         # Navegação lateral
│   │   ├── Dashboard.tsx       # Painel principal
│   │   ├── VendasView.tsx      # Histórico de vendas
│   │   ├── ProdutosView.tsx    # Gestão de produtos
│   │   ├── CheckoutPage.tsx    # Página de checkout pública
│   │   ├── CheckoutModal.tsx   # Modal de pagamento
│   │   ├── PagamentosView.tsx  # Métodos de pagamento
│   │   ├── SaqueView.tsx       # Levantamentos/saques
│   │   ├── AfiliadosView.tsx   # Gestão de afiliados
│   │   ├── MercadoView.tsx     # Marketplace
│   │   ├── AnalyticsView.tsx   # Análise avançada
│   │   ├── FerramentasView.tsx # Integrações externas
│   │   ├── ConfiguracoesView.tsx # Configurações da conta
│   │   ├── PremiacoesView.tsx  # Sistema de prémios
│   │   ├── DocumentacaoView.tsx # Documentação API
│   │   ├── ThankYouPage.tsx    # Página pós-compra
│   │   └── Views.tsx           # Re-exportação de views
│   └── lib/                    # Lógica partilhada
│       ├── supabase.ts         # Cliente Supabase
│       ├── store.ts            # Estado global (Zustand)
│       ├── firebase.ts         # FCM + notificações push
│       ├── e2payments.ts       # Cliente gateway E2
│       ├── e2paymentsWrapper.ts # Wrapper de pagamentos
│       ├── paymentApi.ts       # Abstracção da API de pagamentos
│       ├── lowtrack.ts         # Cliente Lowtrack
│       ├── push.ts             # Lógica de push notifications
│       ├── clearLocalData.ts   # Limpeza de dados locais
│       ├── descriptionUtils.ts # Utilitários de descrição
│       └── utils.ts            # cn() e helpers gerais
│
├── 📁 supabase/                # Configuração Supabase
│   ├── config.toml             # Config do projecto Supabase
│   ├── migrations/             # Migrações SQL da base de dados
│   └── functions/              # Edge Functions Supabase
│       └── send-push/          # Edge function de push
│
└── 📁 _archive/                # Ficheiros arquivados (não usado no build)
    ├── flex-mola/
    ├── InfroPaycredentials/
    └── scratch/
```

---

## Diagrama de Arquitectura Geral

```mermaid
graph TB
    subgraph CLIENTE["🌐 Cliente (Browser)"]
        PWA["PWA React + Vite<br/>(SPA com Tailwind)"]
        SW["Service Worker<br/>(Firebase Messaging)"]
    end

    subgraph VERCEL["☁️ Vercel (Hosting + Serverless)"]
        STATIC["Static Files<br/>(dist/)"]
        subgraph API["API Routes (/api/*)"]
            E2["e2payments.ts<br/>Gateway Principal"]
            HOOK["webhook.ts<br/>Callbacks"]
            NOTIF["notify-*.ts<br/>Notificações"]
            UPLOAD["upload.ts / catbox.ts<br/>Ficheiros"]
        end
    end

    subgraph SUPABASE["🗄️ Supabase"]
        AUTH["Auth<br/>(JWT)"]
        DB["PostgreSQL<br/>Transacções, Produtos,<br/>Utilizadores, Subs"]
        STORAGE["Storage<br/>(Imagens de produtos)"]
        RLS["Row Level Security<br/>(por utilizador)"]
    end

    subgraph GATEWAYS["💳 Gateways de Pagamento"]
        E2PAY["E2Payments API<br/>(M-Pesa + e-Mola)"]
        MPESADIRECT["M-Pesa API Directa"]
        EMOLADIRECT["e-Mola API Directa"]
    end

    subgraph NOTIFICACOES["🔔 Notificações"]
        FCM["Firebase FCM<br/>(Push)"]
        LOWTRACK["Lowtrack.com<br/>(Marketing)"]
        WEBHOOKEXT["Webhook Externo<br/>(Custom URL)"]
    end

    PWA -- "Supabase JS SDK" --> AUTH
    PWA -- "Supabase JS SDK" --> DB
    PWA -- "REST /api/*" --> API
    SW -- "FCM Token" --> FCM

    E2 -- "Processar pagamento" --> E2PAY
    E2 -- "Fallback M-Pesa" --> MPESADIRECT
    E2 -- "Fallback e-Mola" --> EMOLADIRECT
    E2PAY -- "Callback aprovado" --> HOOK
    HOOK -- "Gravar transacção" --> DB
    HOOK -- "Disparar" --> NOTIF
    NOTIF --> FCM
    NOTIF --> LOWTRACK
    NOTIF --> WEBHOOKEXT

    UPLOAD --> STORAGE
    DB -- "RLS" --> RLS

    FCM -- "Push notification" --> SW
```

---

## Diagrama de Fluxo — Autenticação

```mermaid
sequenceDiagram
    participant U as Utilizador
    participant APP as App.tsx
    participant SB as Supabase Auth
    participant LS as localStorage

    U->>APP: Abre a aplicação
    APP->>LS: Verifica evolux_prod_fake_session
    alt Sessão local encontrada
        LS-->>APP: Sessão JSON (offline/fallback)
        APP->>APP: setSession(parsed)
    end
    APP->>SB: getSession()
    alt Sessão Supabase válida
        SB-->>APP: Session com JWT
        APP->>APP: setSession(session)
    else Sem sessão
        SB-->>APP: null
        APP->>APP: Mostra LoginView
    end

    U->>APP: Submete email + senha
    APP->>SB: signInWithPassword(email, pwd)
    alt Login OK
        SB-->>APP: Session JWT
        APP->>APP: setSession → mostra Dashboard
    else Login Falhou
        SB-->>APP: AuthError
        APP->>U: Mostra mensagem de erro
    end

    Note over APP,SB: onAuthStateChange() escuta<br/>sempre mudanças de sessão em tempo real
```

---

## Diagrama de Fluxo — Checkout e Pagamento

```mermaid
sequenceDiagram
    participant C as Cliente Final
    participant CP as CheckoutPage.tsx
    participant API as /api/e2payments
    participant E2 as E2Payments Gateway
    participant HOOK as /api/webhook
    participant DB as Supabase DB
    participant DASH as Dashboard Vendedor

    C->>CP: Acede ao link de checkout<br/>(/?product_id=xxx)
    CP->>DB: Carrega produto (nome, preço, imagem)
    DB-->>CP: Dados do produto

    C->>CP: Escolhe método (M-Pesa / e-Mola)<br/>+ insere número de telemóvel
    CP->>API: POST /api/e2payments<br/>{ amount, phone, method, product_id }
    API->>E2: Inicia transacção
    E2-->>API: { transaction_id, status: "PENDING" }
    API-->>CP: { transaction_id }

    CP->>CP: Polling de status (5s interval)<br/>POST /api/e2payments/status

    alt Pagamento aprovado
        E2->>HOOK: Callback POST (aprovado)
        HOOK->>DB: INSERT transaction (status: Concluído)
        HOOK->>DB: Notifica vendedor
        E2-->>CP: status: "COMPLETED"
        CP->>C: Redireciona → /obrigado?thankyou=true
    else Pagamento recusado / timeout
        E2-->>CP: status: "FAILED"
        CP->>C: Mostra erro + opção de retry
    end

    DB-->>DASH: Realtime subscription<br/>(nova venda aparece automaticamente)
    DASH->>DASH: Actualiza métricas e gráficos
```

---

## Diagrama de Fluxo — Notificações Push

```mermaid
sequenceDiagram
    participant APP as App.tsx
    participant FCM as Firebase FCM
    participant SW as Service Worker
    participant HOOK as /api/webhook
    participant SB as Supabase DB
    participant PUSH as push_subscriptions

    APP->>APP: Utilizador faz login
    APP->>SW: navigator.serviceWorker.register('/sw.js')
    APP->>FCM: getFcmToken(registration)
    FCM-->>APP: FCM Token (string única)
    APP->>SB: UPSERT push_subscriptions<br/>{ user_email, token }

    Note over HOOK,PUSH: Quando uma venda é aprovada:

    HOOK->>SB: Lê push_subscriptions por email do vendedor
    SB-->>HOOK: { token: "fcm_token_xxx" }
    HOOK->>FCM: Envia mensagem push<br/>{ title, body, token }
    FCM->>SW: Entrega push notification
    SW->>SW: showNotification("Nova Venda!")
```

---

## Diagrama de Fluxo — Estado Global (Zustand Store)

```mermaid
graph LR
    subgraph STORE["lib/store.ts (Zustand)"]
        TS["useTransactionsStore<br/>transactions[]<br/>isLoading"]
        PS["useProductsStore<br/>products[]"]
        US["useUserStore<br/>user, settings"]
    end

    subgraph VIEWS["Components"]
        DASH["Dashboard.tsx"]
        VENDAS["VendasView.tsx"]
        PROD["ProdutosView.tsx"]
        CONFIG["ConfiguracoesView.tsx"]
    end

    SB["Supabase DB<br/>(Realtime)"]

    SB -- "onSnapshot / select()" --> STORE
    STORE -- "useTransactionsStore()" --> DASH
    STORE -- "useTransactionsStore()" --> VENDAS
    STORE -- "useProductsStore()" --> PROD
    STORE -- "useUserStore()" --> CONFIG

    DASH -- "filtra por período" --> DASH
    VENDAS -- "filtra por status/busca" --> VENDAS
```

---

## Resumo da Limpeza Realizada

| Acção | Quantidade | Exemplos |
|---|---|---|
| ✅ Ficheiros eliminados | 24 | `old_index.css`, `test_*.js`, `build_error.txt`... |
| ✅ Pasta `Flex Mola/` | Arquivada | → `_archive/flex-mola/` |
| ✅ Pasta `InfroPaycredentials/` | Arquivada | → `_archive/InfroPaycredentials/` |
| ✅ Pasta `scratch/` | Arquivada | → `_archive/scratch/` |
| ✅ `api/e2payments-test.ts` | Movido | → `scripts/` |
| ✅ `api/test-lowtrack.ts` | Movido | → `scripts/` |
| ✅ `next.config.js` | Eliminado | Projecto usa Vite, não Next.js |

**Raiz final: 11 pastas essenciais + 17 ficheiros de configuração = projecto limpo e organizado.**
