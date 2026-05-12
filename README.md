|| 🚀 StartUpados() ||

> Inovação e tecnologia para transformar ideias em realidade 💡


[![Deploy](https://img.shields.io/badge/deploy-vercel-black?logo=vercel)](https://www.startupados.com.br)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.2-38BDF8?logo=tailwindcss)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite)](https://vitejs.dev)

---

## 📖 Sobre o Projeto

A **StartUpados()** é uma plataforma digital inovadora desenvolvida para conectar pessoas, empresas e oportunidades através da tecnologia. Nosso objetivo é impulsionar o acesso à tecnologia e criar soluções eficientes que transformem ideias em resultados concretos.

O projeto inclui um **site institucional completo** e um **Dashboard Executivo** desenvolvido para a ONG **Turma do Bem** — centralizando dados de atendimentos, voluntários, doações e mensagens em um único painel de gestão.

🌐 **Acesse:** [www.startupados.com.br](https://www.startupados.com.br)

---

## ⚙️ Tecnologias Utilizadas

### 💻 Frontend
| Tecnologia | Versão | Descrição |
|---|---|---|
| React | 19.2 | Interface baseada em componentes |
| TypeScript | 5.9 | Tipagem estática e segurança de código |
| Vite | 8.0 | Build tool rápida e moderna |
| Tailwind CSS | 4.2 | Estilização utilitária com classes inline |
| React Router DOM | 7.14 | Roteamento entre páginas |
| React Hook Form | 7.72 | Gerenciamento de formulários |
| Recharts | 2.x | Gráficos interativos para o Dashboard |

### ☁️ Serviços e Integrações
| Serviço | Descrição |
|---|---|
| Backend **Java + Quarkus** com banco **Oracle** |
| Google Sheets API | Banco de dados da ONG Turma do Bem |
| Google Cloud Platform | Service Account e autenticação |
| Vercel | Deploy e hospedagem com CI/CD automático |

### 🔜 Futuras Integrações (em desenvolvimento)
- **WhatsApp Business API**
- **Meta Graph API** (Instagram e Facebook)
- **Gmail API** para leitura de e-mails

---

## 🏗️ Arquitetura do Projeto

```
Front_TdB/
│
├── public/
│   ├── img/
│   │   └── banner/              # Imagens do carrossel hero
│   ├── logo-250x80.png
│   ├── favicon.png
│   ├── web_dev.png
│   ├── e-commerce.png
│   ├── aplicativos.png
│   ├── chatbot.png
│   ├── automation.png
│   └── colab.png
│
├── src/
│   │
│   ├── Components/               # Componentes reutilizáveis
│   │   ├── Header/
│   │   │   └── Header.tsx        # Navbar com link Área Admin
│   │   ├── Footer/
│   │   │   └── Footer.tsx
│   │   ├── Layout/
│   │   │   └── Layout.tsx
│   │   ├── HeroCarousel/
│   │   │   └── HeroCarousel.tsx  # Carrossel animado da Home
│   │   ├── HomeSections/
│   │   │   └── HomeSections.tsx  # Seções: Stats, Projects, Tech, Process, Partners, CTA
│   │   └── ProtectedRoute/
│   │       └── ProtectedRoute.tsx # Proteção de rota do Dashboard
│   │
│   ├── Pages/                    # Páginas do site institucional
│   │   ├── Home/
│   │   │   └── Home.tsx
│   │   ├── NossosServicos/
│   │   │   └── NossosServicos.tsx
│   │   ├── Integrantes/
│   │   │   └── Integrantes.tsx
│   │   ├── SobreNos/
│   │   │   └── SobreNos.tsx
│   │   ├── FAQ/
│   │   │   └── FAQ.tsx
│   │   ├── FaleConosco/
│   │   │   └── FaleConosco.tsx   # Formulário integrado ao Google Sheets
│   │   ├── Login/
│   │   │   └── Login.tsx         # Página de autenticação admin
│   │   └── Dashboard/
│   │       ├── Dashboard.tsx     # Container principal com sidebar
│   │       ├── mockData.ts       # Dados mock e interfaces TypeScript
│   │       ├── components/
│   │       │   └── Shared.tsx    # KPICard, Card, AlertCard, ProgressBar, etc.
│   │       └── pages/
│   │           ├── OverviewPage.tsx      # Visão geral executiva
│   │           ├── OperationsPage.tsx    # Operação e agenda
│   │           ├── VolunteersPage.tsx    # Gestão de voluntários
│   │           ├── SocialImpactPage.tsx  # Impacto social
│   │           ├── GeographyPage.tsx     # Distribuição geográfica
│   │           ├── FinancialPage.tsx     # Financeiro e parceiros
│   │           ├── DataEntryPage.tsx     # Inserção de dados via Sheets
│   │           └── MessagesPage.tsx      # Central de Mensagens omnichannel
│   │
│   ├── services/
│   │   └── googleSheets.ts       # Integração com Google Sheets API
│   │
│   ├── hooks/
│   │   └── useSheets.ts          # Hooks para leitura e escrita no Sheets
│   │
│   ├── layouts/
│   │   └── MainLayout.tsx        # Layout base com Header e Footer
│   │
│   ├── App.tsx                   # Componente principal e rotas
│   └── main.tsx                  # Entry point (Vite)
│
├── .env                          # Variáveis de ambiente (não versionado)
├── .env.example                  # Exemplo de variáveis necessárias
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 🎨 Design System

### Tipografia
| Uso | Fonte |
|---|---|
| Títulos do site | `Lobster, sans-serif` |
| Texto corrido | `Roboto, sans-serif` |
| Dashboard | `DM Sans, system-ui, sans-serif` |

### Paleta de Cores — Dashboard
| Token | Hex | Uso |
|---|---|---|
| Teal principal | `#00D4AA` | Accent, KPIs positivos |
| Azul | `#40C4FF` | Informações |
| Verde | `#00E676` | Sucesso, metas |
| Vermelho | `#FF4757` | Alertas críticos |
| Laranja | `#FF9557` | Avisos |
| Roxo | `#B39DDB` | Voluntários |
| Amarelo | `#FFD740` | Destaques |
| BG principal | `#07111E` | Fundo do dashboard |
| BG card | `#0F2035` | Cards |
| Texto primário | `#E8F4FD` | Textos principais |
| Texto secundário | `#7EB3CE` | Textos secundários |

### Paleta de Cores — Site Institucional
| Uso | Valor |
|---|---|
| Fundo hero | `from-[#1a1a2e] via-[#16213e] to-[#0f3460]` |
| Accent | `blue-600` |
| Hover accent | `amber-400` |

---

## 📄 Páginas do Site Institucional

| Página | Arquivo | Rota |
|---|---|---|
| Home | `src/Pages/Home/Home.tsx` | `/` |
| Nossos Serviços | `src/Pages/NossosServicos/NossosServicos.tsx` | `/NossosServicos` |
| Integrantes | `src/Pages/Integrantes/Integrantes.tsx` | `/Integrantes` |
| Sobre nós | `src/Pages/SobreNos/SobreNos.tsx` | `/SobreNos` |
| FAQ | `src/Pages/FAQ/FAQ.tsx` | `/FAQ` |
| Fale Conosco | `src/Pages/FaleConosco/FaleConosco.tsx` | `/FaleConosco` |
| Login Admin | `src/Pages/Login/Login.tsx` | `/login` |
| Dashboard | `src/Pages/Dashboard/Dashboard.tsx` | `/dashboard` |

---

## 📊 Dashboard Executivo — Turma do Bem

O dashboard é uma área administrativa protegida por autenticação, com 8 páginas:

| Página | Descrição |
|---|---|
| Visão Geral | KPIs executivos, evolução mensal, alertas |
| Operação | Calendário, próximos atendimentos, histórico |
| Voluntários | Top voluntários, crescimento da rede, engajamento |
| Impacto Social | Perfil dos beneficiários, antes/depois, severidade |
| Geografia | Cobertura por região e estado, alertas de baixa adesão |
| Financeiro | Doações, custos, ROI social, parceiros |
| Inserir Dados | Formulários para inserção via Google Sheets |
| Central de Mensagens | Omnichannel — Site, Email, WhatsApp (em breve) |

### Acesso ao Dashboard
```
URL:   https://www.startupados.com.br/login
Email: ...
Senha: ...
```

---

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_GOOGLE_CLIENT_EMAIL=sua-service-account@projeto.iam.gserviceaccount.com
VITE_GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
VITE_GOOGLE_SHEET_ID=id-da-sua-planilha
```

---

## 🚀 Como Rodar o Projeto

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

---

## 📱 Responsividade

| Breakpoint | Tamanho | Dispositivo |
|---|---|---|
| ES (Extra Small) | até 480px | Dispositivos móveis |
| MD (Medium) | 768px | Tablets |
| LG (Large) | acima de 1200px | Desktops |

---

## 🌐 Deploy

| Ambiente | URL | Plataforma |
|---|---|---|
| Produção | [www.startupados.com.br](https://www.startupados.com.br) | Vercel |
| Preview | [startupados.vercel.app](https://startupados.vercel.app) | Vercel |
| Domínio | [www.startupados.com.br](https://www.startupados.com.br/) | Hostinger |

O deploy é **automático** — qualquer `git push` na branch `main` atualiza o site em 1-2 minutos.

---

## 🗃️ Google Sheets — Estrutura da Planilha

A planilha `Turma_Do_Bem` no Google Sheets serve como banco de dados com 5 abas:

| Aba | Colunas |
|---|---|
| Pacientes | ID, Nome, Idade, Cidade, Programa, Status, Data Cadastro |
| Atendimentos | Paciente, Procedimento, Dentista, Status, Data |
| Voluntários | Nome, Cidade, Estado, Pacientes, Status |
| Doações | Empresa, Valor, Tipo, Data |
| Mensagens | ID, Nome, Email, Telefone, Assunto, Mensagem, Canal, Tipo, Status, Data, Hora |

---

## 👥 Integrantes da Equipe

### Desenvolvimento
| Nome | RM |
|---|---|
| Pedro Henrique Pinheiro Falchi | rm566967 |
| Matheus Guimarães | rm567912 |

---

## 🔜 Roadmap

- [ ] Backend Java + Quarkus com Oracle DB
- [ ] Conexão Frontend → Backend via REST API
- [ ] WhatsApp Business API na Central de Mensagens
- [ ] Meta Graph API (Instagram e Facebook)
- [ ] Autenticação JWT robusta
- [ ] Deploy do backend no Railway / Google Cloud Run

---

*StartUpados() — Inovação e tecnologia para transformar ideias em realidade* 🚀



