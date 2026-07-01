# Análise de Fluxo de Utilizador — InfroPay / Evolux Prod

> **Versão:** 1.0 | **Data:** Julho 2026  
> **Âmbito:** Análise completa dos fluxos de interação de todos os perfis de utilizador da plataforma

---

## 1. Perfis de Utilizador (Personas)

| Persona | Descrição | Objectivos Principais | Frequência de Uso |
|---|---|---|---|
| 🧑‍💼 **Vendedor** | Criador de conteúdo / empresário que vende produtos digitais em Moçambique | Criar produtos, acompanhar vendas, receber pagamentos | Diária |
| 🛒 **Cliente Final** | Comprador que acede ao link de checkout público | Pagar um produto digital via M-Pesa ou e-Mola | Única / Pontual |
| 🤝 **Afiliado** | Parceiro que promove produtos de outros vendedores | Ver comissões, partilhar links de afiliado | Semanal |
| 👑 **Administrador** | Gestor da plataforma | Aprovar contas, monitorizar transacções, gerir sistema | Diária |

---

## 2. Mapa de Fluxo Global (High-Level)

```mermaid
graph TD
    ENTRADA["🚪 Entrada na Plataforma"] --> AUTH{Autenticado?}

    AUTH -- Não --> LOGIN["LoginView\n(email + senha)"]
    AUTH -- Sim --> APP["App Principal"]

    LOGIN -- "Sucesso" --> APP
    LOGIN -- "Novo utilizador" --> REGISTO["Formulário de Registo\n(Nome, Tel, BI/NUIT, Email, Senha)"]
    REGISTO --> VERIFY["Verificação de Email\n(Supabase Auth)"]
    VERIFY --> LOGIN

    APP --> DASH["📊 Dashboard"]
    APP --> VENDAS["🧾 Vendas"]
    APP --> PRODUTOS["📦 Produtos"]
    APP --> AFILIADOS["🤝 Afiliados"]
    APP --> MERCADO["🛍️ Mercado"]
    APP --> PAGAMENTOS["💳 Pagamentos"]
    APP --> LEVANT["💸 Levantamentos"]
    APP --> PREMIOS["🏆 Premiações"]
    APP --> INTEGRACOES["🔧 Integrações"]
    APP --> CONFIG["⚙️ Configurações"]
    APP --> DOCS["📖 Documentação"]

    CHECKOUT_EXT["🌐 Link Público de Checkout"] --> CHECKOUT_PAGE["CheckoutPage\n(Acesso sem login)"]
    CHECKOUT_PAGE -- "Após pagamento" --> THANKYOU["ThankYouPage\n(/obrigado)"]
```

---

## 3. Fluxo Detalhado — Vendedor

### 3.1 Primeiro Acesso (Onboarding)

```mermaid
journey
    title Onboarding do Vendedor
    section Registo
      Visita o site: 5: Vendedor
      Clica em Registar-se: 4: Vendedor
      Preenche formulário (Nome, Tel, BI, Email, Senha): 3: Vendedor
      Recebe email de verificação: 2: Vendedor
      Confirma email: 3: Vendedor
    section Primeiro Login
      Entra com credenciais: 4: Vendedor
      Vê Dashboard vazio: 3: Vendedor
      Cria primeiro produto: 5: Vendedor
      Gera link de checkout: 5: Vendedor
      Partilha link com clientes: 5: Vendedor
    section Primeira Venda
      Cliente paga via M-Pesa: 5: Cliente
      Recebe notificação push: 5: Vendedor
      Dashboard actualiza em tempo real: 5: Vendedor
```

### 3.2 Fluxo Diário do Vendedor

```mermaid
stateDiagram-v2
    [*] --> Dashboard : Login
    Dashboard --> Dashboard : Ver métricas do dia
    Dashboard --> Vendas : Investigar transacções
    Dashboard --> Produtos : Gerir catálogo
    Dashboard --> Levantamentos : Solicitar saque

    Vendas --> DetalheVenda : Clicar numa venda
    DetalheVenda --> Vendas : Voltar
    DetalheVenda --> Dashboard : Ir ao início

    Produtos --> CriarProduto : Novo produto
    Produtos --> EditarProduto : Editar existente
    Produtos --> GerarCheckout : Gerar link
    CriarProduto --> Produtos : Salvar
    EditarProduto --> Produtos : Salvar
    GerarCheckout --> Produtos : Copiar link

    Levantamentos --> SolicitarSaque : Preencher valor
    SolicitarSaque --> Levantamentos : Aguardar aprovação

    Dashboard --> Configuracoes : Gerir perfil
    Configuracoes --> Dashboard : Guardar
```

### 3.3 Fluxo de Criação de Produto

```mermaid
sequenceDiagram
    participant V as Vendedor
    participant UI as ProdutosView
    participant API as /api/upload
    participant DB as Supabase

    V->>UI: Clica em "Novo Produto"
    UI->>V: Mostra modal de criação
    V->>UI: Preenche (nome, preço, descrição)
    V->>UI: Faz upload de imagem
    UI->>API: POST /api/upload (ficheiro)
    API->>DB: Supabase Storage
    DB-->>API: URL da imagem
    API-->>UI: { url }
    V->>UI: Clica "Salvar"
    UI->>DB: INSERT produto { nome, preço, imagem_url, vendedor_id }
    DB-->>UI: Produto criado
    UI->>V: Mostra produto na lista
    V->>UI: Clica "Gerar Link Checkout"
    UI->>V: Exibe URL pública do checkout
    V->>V: Copia e partilha com clientes
```

---

## 4. Fluxo Detalhado — Cliente Final

### 4.1 Jornada Completa de Compra

```mermaid
journey
    title Jornada de Compra do Cliente
    section Descoberta
      Recebe link nas redes sociais: 5: Cliente
      Acede ao link de checkout: 4: Cliente
    section Avaliação
      Vê imagem e descrição do produto: 5: Cliente
      Verifica o preço: 3: Cliente
      Decide comprar: 4: Cliente
    section Pagamento
      Escolhe M-Pesa ou e-Mola: 4: Cliente
      Insere número de telemóvel: 4: Cliente
      Clica em Pagar: 3: Cliente
      Confirma no telemóvel USSD: 3: Cliente
      Aguarda confirmação até 2 min: 2: Cliente
    section Conclusão
      Recebe confirmação de pagamento: 5: Cliente
      É redirecionado para página de obrigado: 5: Cliente
      Recebe produto/acesso digital: 5: Cliente
```

### 4.2 Fluxo de Checkout (Detalhe Técnico)

```mermaid
flowchart TD
    A["🌐 Acede ao link\n?product_id=xxx"] --> B["CheckoutPage carrega"]
    B --> C["Supabase: busca produto"]
    C --> D{Produto existe?}
    D -- Não --> ERR["Página de erro\nProduto não encontrado"]
    D -- Sim --> E["Exibe: imagem, nome, preço"]
    E --> F["Cliente escolhe método\nM-Pesa ou e-Mola"]
    F --> G["Cliente insere telemóvel"]
    G --> H["Clica Pagar"]
    H --> I["POST /api/e2payments\n{amount, phone, method}"]
    I --> J{Gateway responde?}
    J -- Erro de rede --> K["Mostra erro\n+ botão retry"]
    J -- Pendente --> L["Polling a cada 5s\nmáx 120s"]
    L --> M{Status?}
    M -- PENDING --> L
    M -- COMPLETED --> N["✅ Redireciona\n/obrigado?thankyou=true"]
    M -- FAILED --> O["❌ Mostra erro\nPagamento não processado"]
    O --> F
    K --> H
```

---

## 5. Fluxo Detalhado — Afiliado

```mermaid
sequenceDiagram
    participant A as Afiliado
    participant UI as AfiliadosView
    participant DB as Supabase
    participant CLIENT as Cliente Final

    A->>UI: Acede à aba Afiliados
    UI->>DB: Busca produtos disponíveis para afiliação
    DB-->>UI: Lista de produtos + taxas de comissão
    A->>UI: Selecciona produto para promover
    UI->>A: Gera link personalizado com ref_id
    A->>CLIENT: Partilha link nas redes sociais
    CLIENT->>CLIENT: Clica no link com ?ref=afiliado_id
    CLIENT->>CLIENT: Faz compra no checkout
    CLIENT->>DB: Transacção gravada com ref_id
    DB->>DB: Calcula comissão do afiliado
    DB-->>UI: Actualiza dashboard do afiliado
    A->>UI: Vê nova comissão pendente
    A->>UI: Solicita levantamento de comissão
```

---

## 6. Mapa de Navegação (Sitemap)

```mermaid
mindmap
  root((Evolux Prod))
    Login e Registo
      Recuperar Senha
      Criar Conta
    Dashboard
      Metricas do Dia
        Total de Vendas
        Faturamento
        MPesa vs eMola
      Grafico de Tendencia
      Filtros de Periodo
    Vendas
      Historico Completo
      Filtro por Status
        Concluido
        Pendente
        Falhou
      Busca por ID ou Cliente
      Detalhe da Transaccao
    Produtos
      Lista de Produtos
      Criar Produto
      Editar Produto
      Gerar Link Checkout
      Upload de Imagem
    Afiliados
      Meus Links
      Comissoes Pendentes
      Historico
    Mercado
      Produtos para Afiliacao
    Pagamentos
      Configurar MPesa
      Configurar eMola
    Levantamentos
      Solicitar Saque
      Historico de Saques
      Status do Saque
    Premiacoes
      Ranking
      Meus Premios
    Integracoes
      Pixel Facebook
      Pixel TikTok
      Lowtrack
      Utmify
      Webhook Personalizado
    Configuracoes
      Perfil
      Seguranca
      Conta
    Documentacao
      API Reference
      Webhooks
      Integracoes
```

---

## 7. Pontos de Fricção Identificados

### 🔴 Críticos (impactam conversão)

| # | Ponto de Fricção | Onde Ocorre | Impacto | Solução Sugerida |
|---|---|---|---|---|
| 1 | **Tempo de espera de pagamento** | CheckoutPage | Alto | Barra de progresso + feedback animado durante os 120s de polling |
| 2 | **Login falha silenciosamente** | LoginView | Alto | Mensagens de erro mais específicas (ex: "Email não confirmado") |
| 3 | **Sessão expirada sem aviso** | Toda a app | Médio | Aviso proactivo 5min antes da expiração + refresh automático |

### 🟡 Importantes (impactam retenção)

| # | Ponto de Fricção | Onde Ocorre | Impacto | Solução Sugerida |
|---|---|---|---|---|
| 4 | **Onboarding sem tutorial** | Primeiro login | Médio | Tour guiado step-by-step para novos utilizadores |
| 5 | **Criação de produto complexa** | ProdutosView | Médio | Dividir em steps: Info → Preço → Imagem → Revisão |
| 6 | **Checkout sem elementos de confiança** | CheckoutPage | Médio | Adicionar reviews/testemunhos opcionais |
| 7 | **Notificações push não activadas** | App em geral | Médio | Prompt mais claro com valor proposto |

### 🟢 Melhorias (impactam satisfação)

| # | Ponto de Fricção | Onde Ocorre | Impacto | Solução Sugerida |
|---|---|---|---|---|
| 8 | **Filtros de data manual** | VendasView | Baixo | Atalhos rápidos: "Esta semana", "Este mês" |
| 9 | **Sem exportação de dados** | VendasView | Baixo | Botão "Exportar CSV" para relatórios |
| 10 | **Levantamento sem status em tempo real** | SaqueView | Baixo | Notificação quando saque for aprovado/rejeitado |

---

## 8. Métricas de Sucesso por Fluxo

| Fluxo | Métrica Principal | Meta |
|---|---|---|
| Registo → Primeiro Produto | Tempo até criar 1º produto | < 5 minutos |
| Produto → Primeira Venda | Taxa de conversão do checkout | > 60% |
| Checkout → Confirmação | Taxa de pagamentos concluídos | > 85% |
| Venda → Notificação | Tempo de recepção da notificação | < 10 segundos |
| Levantamento → Recebimento | Tempo de processamento | < 24 horas |

---

## 9. Fluxo de Recuperação de Erros

```mermaid
flowchart LR
    ERR_PAGAMENTO["❌ Pagamento Falhou"] --> RET1["Retry automático?\n3x"]
    RET1 -- Sim --> GATEWAY["Tenta gateway\nalternativo"]
    RET1 -- Não --> MANUAL["Mostra mensagem\nde erro ao cliente"]
    MANUAL --> SUPORTE["Link para suporte\nvia WhatsApp"]

    ERR_AUTH["❌ Sessão Inválida"] --> REFRESH["Tenta refresh\ndo token JWT"]
    REFRESH -- OK --> CONTINUA["Utilizador continua\nsem interrupção"]
    REFRESH -- Falha --> LOGOUT["Logout automático\n+ redireciona para Login"]

    ERR_REDE["❌ Sem Conexão"] --> CACHE["Serve dados\ncached via PWA"]
    CACHE --> OFFLINE["Modo offline:\napenas leitura"]
    OFFLINE --> SYNC["Ao reconectar:\nsincronia automática"]
```

---

## 10. Resumo Executivo

| Aspecto | Estado Actual | Prioridade de Melhoria |
|---|---|---|
| **Autenticação** | Funcional com fallback offline | 🟡 Melhorar mensagens de erro |
| **Checkout** | Funcional, M-Pesa + e-Mola | 🔴 Melhorar feedback de espera |
| **Dashboard** | Completo com gráficos | 🟢 Adicionar exportação |
| **Produtos** | Funcional | 🟡 Simplificar criação |
| **Notificações** | Implementadas via FCM | 🟡 Melhorar activação |
| **Afiliados** | Básico implementado | 🟡 Expandir funcionalidades |
| **Levantamentos** | Fluxo manual | 🔴 Automatizar aprovação |
| **Onboarding** | Ausente | 🔴 Criar tour guiado |

---

*Documento gerado em Julho 2026 — InfroPay / Evolux Prod*
