## StartUpados() — Dashboard Turma do Bem

> Sistema fullstack desenvolvido pelo grupo **StartUpados()** para a ONG **Turma do Bem**, integrando site institucional, portais de atendimento, dashboard executivo e inteligência artificial para priorização de pacientes.
---
Sumário
Sobre o Projeto
Stack Tecnológica
Funcionalidades
Estrutura de Rotas
Estrutura de Arquivos
Integrações
Machine Learning
Variáveis de Ambiente
Como Rodar Localmente
Deploy
Equipe
---
Sobre o Projeto
A Turma do Bem é uma ONG que oferece tratamento odontológico gratuito para jovens de 11 a 17 anos em vulnerabilidade social (Dentista do Bem) e para mulheres vítimas de violência (Apolônias do Bem).
O sistema StartUpados() foi desenvolvido para digitalizar e otimizar os processos da ONG, oferecendo:
Site institucional com informações sobre os programas
Portal para solicitação de atendimento online
Portal do beneficiário para acompanhamento do tratamento
Painel do dentista voluntário
Dashboard executivo com indicadores em tempo real
Validação de pacientes por QR Code
Cadastro de voluntários, funcionários e mutirões
Integração com banco de dados Oracle via backend Java
Modelo de Machine Learning para priorização de atendimentos
---
Stack Tecnológica
Frontend
Tecnologia	Versão	Uso
React	19	Framework principal
TypeScript	5+	Tipagem estática
Vite	6+	Build tool
Tailwind CSS	v4	Estilização
React Router DOM	v7	Roteamento
React Hook Form	—	Formulários
Recharts	—	Gráficos do dashboard
qrcode.react	—	Geração de QR Code
Backend
Tecnologia	Uso
Java 21	Linguagem
Quarkus	Framework
Jakarta REST (JAX-RS)	API REST
JDBC	Conexão com banco
Oracle Database	Banco de dados
Integrações
Serviço	Uso
Google Sheets	Backup e armazenamento secundário
Google Apps Script	API intermediária para o Sheets
Render.com	Hospedagem do backend Java
Vercel	Deploy do frontend
VLibras	Acessibilidade em Libras
Machine Learning
Tecnologia	Uso
Python	Linguagem
Pandas	Manipulação de dados
Scikit-learn	Modelo Random Forest
Seaborn / Matplotlib	Visualizações
Google Colab	Ambiente de execução
---
Funcionalidades
Site Institucional
Home com carrossel e seções informativas
Nossos Serviços, Sobre Nós, Integrantes, FAQ, Fale Conosco
Acessibilidade completa com VLibras
Solicitação de Atendimento
Seleção entre Dentista do Bem (jovens 11-17 anos) e Apolônias do Bem (mulheres vítimas de violência)
Formulário em 3 steps para jovens (dados do adolescente, responsável, atendimento)
Formulário em 2 steps para mulheres (dados pessoais, atendimento)
Geração automática de protocolo único (`TDB-2026-XXXX` / `APO-2026-XXXX`)
Geração automática de senha de acesso
QR Code único por paciente
Salvamento no banco Oracle + Google Sheets como backup
Portal do Beneficiário
Login por CPF e senha
Visualização do histórico de consultas
Progresso do tratamento
Próximos atendimentos
Session timeout de 30 minutos com aviso
Busca no backend Java com fallback para mock
Validação de Paciente (QR Code)
Acesso por QR Code ou digitação manual do protocolo
Busca no Google Sheets com fallback para mock
Exibição da ficha completa do paciente
Histórico de atendimentos em timeline
Progresso do tratamento
Confirmação de atendimento registrada na aba Atendimentos
Painel do Dentista
Login por CRO e senha
Agenda de próximos atendimentos
Botão de acesso rápido para validar paciente por QR Code
Session timeout de 30 minutos
Cadastro de Voluntário (Dentista)
Formulário em 3 steps (dados pessoais, profissionais, atuação)
Protocolo automático `VOL-2026-XXXX`
Senha gerada automaticamente
Integração com backend Java (`POST /dentista`)
Backup no Google Sheets aba Voluntarios
Dashboard Executivo (Admin)
Acesso exclusivo com login admin. Contém 10 módulos:
Página	Descrição
Visão Geral	KPIs consolidados da ONG
Operação	Agenda e atendimentos
Voluntários	Rede de dentistas
Impacto Social	Beneficiários e transformação
Geografia	Distribuição nacional
Financeiro	Doações e parceiros
Inserir Dados	Adicionar registros
Central de Mensagens	Todas as solicitações em tempo real
Cadastrar Funcionário	Registro de funcionários com senha gerada
Gerenciar Mutirões	Cadastro de mutirões de atendimento
Central de Mensagens
Lê dados do backend Java (`GET /solicitacao`) como fonte primária
Fallback para Google Sheets se backend indisponível
Filtros por tipo (Beneficiário, Voluntário, Doador, Parceiro)
Busca por nome, email ou mensagem
Alteração de status (Nova, Em atendimento, Resolvida)
Notas internas por mensagem
Cadastrar Funcionário
Formulário completo com CPF, cargo, email, telefone, data de início e status
Senha gerada automaticamente
Integração com backend Java (`POST /funcionario`)
Backup no Google Sheets aba Funcionarios
Exibe senha gerada até o formulário ser limpo
Gerenciar Mutirões
Cadastro com nome, descrição, metas, número de dentistas e localização completa
Backup no Google Sheets aba Mutiroes
---
Estrutura de Rotas
```
/                        → Home (site institucional)
/NossosServicos          → Nossos Serviços
/SobreNos                → Sobre Nós
/Integrantes             → Integrantes
/FAQ                     → Perguntas Frequentes
/FaleConosco             → Fale Conosco
/login                   → Login (4 perfis + doação)
/solicitar-atendimento   → Solicitação de atendimento
/validar-paciente        → Validação por QR Code ou protocolo
/meu-atendimento         → Portal do Beneficiário (protegido)
/meu-painel              → Painel do Dentista (protegido)
/cadastrar-voluntario    → Cadastro de dentista voluntário
/dashboard               → Dashboard Executivo (protegido admin)
*                        → 404 Not Found
```
---
Estrutura de Arquivos
```
src/
├── Components/
│   ├── Header/
│   ├── Footer/
│   ├── Layout/
│   ├── HeroCarousel/
│   ├── HomeSections/
│   ├── ProtectedRoute/
│   │   ├── ProtectedRoute.tsx
│   │   ├── ProtectedRoutePaciente.tsx
│   │   └── ProtectedRouteDentista.tsx
│   └── SessionWarning/
├── Pages/
│   ├── Home/
│   ├── Login/
│   ├── Dashboard/
│   │   ├── Dashboard.tsx
│   │   └── pages/
│   │       ├── OverviewPage.tsx
│   │       ├── OperationsPage.tsx
│   │       ├── VolunteersPage.tsx
│   │       ├── SocialImpactPage.tsx
│   │       ├── GeographyPage.tsx
│   │       ├── FinancialPage.tsx
│   │       ├── DataEntryPage.tsx
│   │       ├── MessagesPage.tsx
│   │       ├── CadastrarFuncionario.tsx
│   │       └── GerenciarMutiroes.tsx
│   ├── PortalBeneficiario/
│   ├── PainelDentista/
│   ├── SolicitarAtendimento/
│   ├── ValidarPaciente/
│   ├── CadastrarVoluntario/
│   ├── NotFound/
│   ├── FAQ/
│   ├── FaleConosco/
│   ├── Integrantes/
│   ├── NossosServicos/
│   └── SobreNos/
├── Services/
│   ├── api.ts              # Integração backend Java
│   └── googleSheets.ts     # Integração Google Sheets
└── Hooks/
    └── useSessionTimeout.ts
```
---
Integrações
Backend Java — Endpoints
Base URL: `https://backend-mjgv.onrender.com`
Método	Endpoint	Descrição
POST	`/solicitacao`	Cadastrar solicitação de atendimento
GET	`/solicitacao`	Listar todas as solicitações
GET	`/solicitacao/{rgCpf}`	Buscar solicitação por CPF
POST	`/beneficiario`	Cadastrar beneficiário
GET	`/beneficiario/{rgCpf}`	Buscar beneficiário
POST	`/dentista`	Cadastrar dentista voluntário
PUT	`/dentista/{rgCpf}/addAtendimento`	Adicionar atendimento
GET	`/dentista/{rgCpf}/getDesconto`	Buscar desconto por atendimentos
POST	`/funcionario`	Cadastrar funcionário
PUT	`/funcionario/{rgCpf}`	Atualizar funcionário
POST	`/campanha`	Cadastrar mutirão
PUT	`/campanha/{nome}/addAtendimento`	Adicionar atendimentos ao mutirão
Google Sheets — Abas
Planilha: `Turma_Do_Bem`
Aba	Alimentada por
Mensagens	SolicitarAtendimento
Pacientes	SolicitarAtendimento
Voluntarios	CadastrarVoluntario
Funcionarios	CadastrarFuncionario
Mutiroes	GerenciarMutiroes
Atendimentos	ValidarPaciente
Credenciais de Acesso (Demo)
Perfil	Login	Senha
Admin	turmadobem@tdb.org.br	tdb2026
Paciente	CPF do cadastro	Gerada no formulário
Dentista	CRO do cadastro	Gerada no cadastro
---
Machine Learning
Modelo de classificação de prioridade de atendimento desenvolvido em Python com Random Forest.
Dataset
Arquivo: `base_ong_prioridade_v2.csv`
Registros: 2.638 (após remoção de 9 duplicatas)
Colunas: `tipo_pedido`, `sexo`, `idade`, `tempo_espera`, `vulnerabilidade`, `tipo_violencia`, `elegivel`, `programa`, `dano_dentario`, `tipo_tratamento`, `prioridade`
Distribuição de Prioridade
Prioridade	Quantidade	%
BAIXA	1.151	44%
MÉDIA	937	35%
ALTA	550	21%
Lógica de Priorização
Apolônias do Bem (mulheres):
ALTA: dano grave + violência grave
ALTA: dano grave + idade maior ou igual a 50
ALTA: dano moderado + violência grave + idade maior ou igual a 45
Dentista do Bem (jovens 11-17 anos):
ALTA: vulnerabilidade alta + tratamento canal ou extração
ALTA: vulnerabilidade alta + restauração + tempo de espera maior que 20 dias
Parâmetros do Modelo
```python
RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    class_weight='balanced',
    random_state=42
)
```
Build para produção
```bash
npm run build
npm run preview
```
---
Deploy
Frontend: Vercel — deploy automático a cada push na branch `main`
URL de produção: www.startupados.com.br
Backend: Render.com
> **Atenção:** O backend no Render.com hiberna após 15 minutos de inatividade. A primeira requisição pode demorar até 60 segundos para acordar o serviço. O frontend trata esse cenário com fallback automático para o Google Sheets.
---

## Links
Github -> https://github.com/Start-Upados/Front_TdB
Youtube -> https://www.youtube.com/watch?v=wU_QVad8MSQ
Vercel -> startupados.vercel.app
Domínio -> https://www.startupados.com.br/

Equipe
Desenvolvido com pelo grupo StartUpados() — FIAP 2026

Pedro Falchi - www.linkedin.com/in/pedro-henrique-falchi-4ab4b937b
Matheus Guimarães - https://www.linkedin.com/in/matheus-guimar%C3%A3es-rosa-04522435b/

---
<div align="center">
  <p>Desenvolvido por <strong>StartUpados()</strong> para a <strong>Turma do Bem</strong></p>
  <p>Transformando sorrisos, transformando vidas</p>
</div>

## Contato: startupados@gmail.com
