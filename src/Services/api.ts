const API_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://backend-mjgv.onrender.com'
//console.log('API_URL:', API_URL)
 
 
// ─── CLASSE BASE (Usuario.java) ───────────────
interface UsuarioBase {
  nome:     string
  rgCpf:    string
  email:    string
  senha:    string
  telefone: string
  cep:      string
}
 
// ─── BENEFICIÁRIO (Beneficiario.java) ─────────
export interface BeneficiarioBody extends UsuarioBase {
  sexo:       string  // "masculino" | "feminino"
  dataNasc:   string  // "2000-12-20"
  numeroCasa: number
}
 
// ─── SOLICITAÇÃO (Solicitacao.java) ───────────
export interface SolicitacaoBody extends UsuarioBase {
  necessidade: string
  protocolo:   string
  sexo:        string
  descricao:   string
  dataNasc:    string
  renda:       string
  responsavel: string
  comoSoube:   string
  parentesco:  string
}
 
// ─── DENTISTA (Dentista.java) ─────────────────
export interface DentistaBody extends UsuarioBase {
  cep:            string
  nConsultorio:   number
  cro:            string
  nAtendimentos:  number
  especializacao: string
  status:         string
  avaliacao:      number
}
 
// ─── FUNCIONÁRIO (Funcionario.java) ───────────
export interface FuncionarioBody extends UsuarioBase {
  cargo:      string
  dataInicio: string  // "2000-12-20"
  status:     string  // "ativo" | "inativo"
}
 
// ─── CAMPANHA / MUTIRÃO (Campanha.java) ───────
export interface CampanhaBody {
  nome:             string
  metaAtendidos:    number
  nAtendidos:       number
  nDentistas:       number
  descricao:        string
  logradouro:       string
  bairro:           string
  estado:           string
  cidade:           string
  numeroLogradouro: number
}

// ─── MENSAGEM (Mensagem.java) ─────────────────
/*
export interface MensagemBody {
  idMensagem?: number
  idConversa?: number
  autor:       string  // 'admin' | 'paciente'
  nomeAutor?:  string
  conteudo:    string
  dataEnvio?:  string
}
  */

// ─── TRIAGEM (Triagem.java) ───────────────────
export interface TriagemBody {
  idTriagem?:                number   // gerado pelo backend
  status?:                   string   // 'pendente' | 'em-andamento' | 'concluida' | etc
  protocolo?:                string
  pacienteNome:              string
  pacienteRgCpf:             string
  programa:                  string   // 'Dentista do Bem' | 'Apolônias do Bem'
  scoreMl?:                  number
  prioridade?:               string   // 'Alta' | 'Media' | 'Baixa'
  cep?:                      string
  especialidadeNescessaria?: string   // sic — typo está no backend, manter
  observacaoAdmin?:          string
}

// ─── CONVITE (Convite.java) — para dentistas em triagens ──
export interface ConviteBody {
  idConvite?:        number
  idTriagem?:        number
  dentistaRgCpf:     string
  dentistaNome?:     string
  mensagem?:         string
  status?:           string   // 'pendente' | 'aceito' | 'recusado'
  detalhesRecusado?: string
  motivoRecusado?:   string
}

// ─── ATENDIMENTO (Atendimento.java) — gerado ao aceitar convite ──
export interface AtendimentoBody {
  idAtendimento?:  number
  idConvite?:      number
  dataAtendimento: string   // 'YYYY-MM-DD'
  horario:         string   // 'HH:MM'
  observacoes?:    string
}

// ─── MENSAGEM (Mensagem.java) ─────────────────
export interface MensagemBody {
  idMensagem?: number
  idConversa?: number
  autor:       string  // 'admin' | 'paciente'
  nomeAutor?:  string
  conteudo:    string
  dataEnvio?:  string
}

 
// ─── HELPER ───────────────────────────────────
async function request<T>(
  endpoint: string,
  method:   'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?:    object,
  params?:  Record<string, string | number>,
): Promise<T> {
  let url = `${API_URL}${endpoint}`
 
  if (params) {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString()
    url += `?${query}`
  }
 
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
 
  if (body) {
    options.body = JSON.stringify(body)
  }
 
  const res = await fetch(url, options)
 
  if (!res.ok) {
    const err = await res.json().catch(() => ({ erro: 'Erro desconhecido' }))
    throw new Error(err.erro ?? `Erro ${res.status}`)
  }
 
  const text = await res.text()
  return text ? JSON.parse(text) : ({} as T)
}
 
// ─── BENEFICIÁRIO ─────────────────────────────
export const beneficiarioService = {
  cadastrar: (body: BeneficiarioBody) =>
    request<unknown>('/beneficiario', 'POST', body),
  listar: () =>
    request<BeneficiarioBody[]>('/beneficiario'),
  buscar: (rgCpf: string) =>
    request<BeneficiarioBody>(`/beneficiario/${rgCpf}`),
  atualizar: (rgCpf: string, body: Partial<BeneficiarioBody>) =>
    request<unknown>(`/beneficiario/${rgCpf}`, 'PUT', body),
  deletar: (rgCpf: string) =>
    request<unknown>(`/beneficiario/${rgCpf}`, 'DELETE'),
}

// ─── SOLICITAÇÃO ──────────────────────────────
export const solicitacaoService = {
  cadastrar: (body: SolicitacaoBody) =>
    request<unknown>('/solicitacao', 'POST', body),
  listar: () =>
    request<SolicitacaoBody[]>('/solicitacao'),
  buscar: (rgCpf: string) =>
    request<SolicitacaoBody>(`/solicitacao/${rgCpf}`),
  atualizar: (rgCpf: string, body: Partial<SolicitacaoBody>) =>
    request<unknown>(`/solicitacao/${rgCpf}`, 'PUT', body),
  deletar: (rgCpf: string) =>
    request<unknown>(`/solicitacao/${rgCpf}`, 'DELETE'),

  // ─── Ações por protocolo ────────────────────
  buscarPorProtocolo: (protocolo: string) =>
    request<SolicitacaoBody>(`/solicitacao/protocolo/${protocolo}`),
  listarPorStatus: (status: string) =>
    request<SolicitacaoBody[]>('/solicitacao/status', 'GET', undefined, { status }),
  aprovar: (protocolo: string, aprovadoPor: string) =>
    request<unknown>(`/solicitacao/${protocolo}/aprovar`, 'PUT', { aprovadoPor }),
  recusar: (protocolo: string, recusadoPor: string, motivo: string, detalhe?: string) =>
    request<unknown>(`/solicitacao/${protocolo}/recusar`, 'PUT', { recusadoPor, motivo, detalhe }),
  resolver: (protocolo: string) =>
    request<unknown>(`/solicitacao/${protocolo}/resolver`, 'PUT'),
  arquivar: (protocolo: string) =>
    request<unknown>(`/solicitacao/${protocolo}/arquivar`, 'PUT'),
  promover: (protocolo: string) =>
    request<unknown>(`/solicitacao/${protocolo}/promover`, 'PUT'),
  reabrir: (protocolo: string) =>
    request<unknown>(`/solicitacao/${protocolo}/reabrir`, 'PUT'),
  classificar: (protocolo: string, prioridade: string, scoreMl: number) =>
    request<unknown>(`/solicitacao/${protocolo}/classificar`, 'PUT', { prioridade, scoreMl }),

  // ─── Mensagens (thread interno por solicitação) ─
  listarMensagens: (protocolo: string) =>
    request<MensagemBody[]>(`/solicitacao/${protocolo}/mensagens`),
  inserirMensagem: (protocolo: string, mensagem: MensagemBody) =>
    request<unknown>(`/solicitacao/${protocolo}/mensagens`, 'POST', mensagem),
}
 
// ─── FUNCIONÁRIO ──────────────────────────────
export const funcionarioService = {
  cadastrar: (body: FuncionarioBody) =>
    request<unknown>('/funcionario', 'POST', body),
  listar: () =>
    request<FuncionarioBody[]>('/funcionario'),
  buscar: (rgCpf: string) =>
    request<FuncionarioBody>(`/funcionario/${rgCpf}`),
  atualizar: (rgCpf: string, body: Partial<FuncionarioBody>) =>
    request<unknown>(`/funcionario/${rgCpf}`, 'PUT', body),
  deletar: (rgCpf: string) =>
    request<unknown>(`/funcionario/${rgCpf}`, 'DELETE'),
}
 
// ─── DENTISTA ─────────────────────────────────
export const dentistaService = {
  cadastrar: (body: DentistaBody) =>
    request<unknown>('/dentista', 'POST', body),
  listar: () =>
    request<DentistaBody[]>('/dentista'),
  buscar: (rgCpf: string) =>
    request<DentistaBody>(`/dentista/${rgCpf}`),
  atualizar: (rgCpf: string, body: Partial<DentistaBody>) =>
    request<unknown>(`/dentista/${rgCpf}`, 'PUT', body),
  deletar: (rgCpf: string) =>
    request<unknown>(`/dentista/${rgCpf}`, 'DELETE'),
  addAtendimento: (rgCpf: string, nAtendimento: number) =>
    request<unknown>(`/dentista/${rgCpf}/addAtendimento`, 'PUT', undefined, { nAtendimento }),
  removeAtendimento: (rgCpf: string, nAtendimento: number) =>
    request<unknown>(`/dentista/${rgCpf}/removeAtendimento`, 'PUT', undefined, { nAtendimento }),
  getDesconto: (rgCpf: string) =>
    request<{ desconto: number }>(`/dentista/${rgCpf}/getDesconto`),
}
 
// ─── CAMPANHA / MUTIRÃO ───────────────────────
export const campanhaService = {
  cadastrar: (body: CampanhaBody) =>
    request<unknown>('/campanha', 'POST', body),
  listar: () =>
    request<CampanhaBody[]>('/campanha'),
  verificarMeta: (nome: string) =>
    request<unknown>(`/campanha/${nome}`),
  atualizar: (nome: string, body: Partial<CampanhaBody>) =>
    request<unknown>(`/campanha/${nome}`, 'PUT', body),
  deletar: (nome: string) =>
    request<unknown>(`/campanha/${nome}`, 'DELETE'),
  addAtendimentos: (nome: string, nAtendimentos: number) =>
    request<unknown>(`/campanha/${nome}/addAtendimento`, 'PUT', undefined, { nAtendimentos }),
}

// ─── TRIAGEM ──────────────────────────────────
export const triagemService = {
  cadastrar: (body: TriagemBody) =>
    request<{ idTriagem: string; Status: string }>('/triagem', 'POST', body),
  listar: () =>
    request<TriagemBody[]>('/triagem'),
  buscar: (idTriagem: number) =>
    request<TriagemBody>(`/triagem/${idTriagem}`),
  buscarPorProtocolo: (protocolo: string) =>
    request<TriagemBody>(`/triagem/protocolo/${protocolo}`),
  atualizar: (idTriagem: number, body: Partial<TriagemBody>) =>
    request<unknown>(`/triagem/${idTriagem}`, 'PUT', body),
  deletar: (idTriagem: number) =>
    request<unknown>(`/triagem/${idTriagem}`, 'DELETE'),

  // ─── Convites a dentistas ───────────────────
  convidar: (idTriagem: number, convite: ConviteBody) =>
    request<{ conviteId: number }>(`/triagem/convite/${idTriagem}`, 'POST', convite),
  listarConvitesDaTriagem: (idTriagem: number) =>
    request<ConviteBody[]>(`/triagem/convite/${idTriagem}`),
  listarConvitesDoDentista: (dentistaRgCpf: string) =>
    request<ConviteBody[]>(`/triagem/dentista/${dentistaRgCpf}/convites`),
  excluirConvite: (idConvite: number) =>
    request<unknown>(`/triagem/convite/${idConvite}`, 'DELETE'),

  // ─── Ações do dentista no convite ───────────
  aceitarConvite: (idConvite: number, atendimento: AtendimentoBody) =>
    request<{ idAtendimento: number }>(`/triagem/convite/${idConvite}/aceitar`, 'POST', atendimento),
  recusarConvite: (idConvite: number, motivoRecusado: string, detalhesRecusado?: string) =>
    request<unknown>(`/triagem/convite/${idConvite}/recusar`, 'POST', {
      motivoRecusado,
      detalhesRecusado,
    }),
}
 
export const authService = {
 
  loginPaciente: (rgCpf: string, senha: string) =>
    request<boolean>(
      '/beneficiario/login',
      'GET',
      undefined,
      { rgCpf, senha }
    ),
 
  loginDentista: (rgCpf: string, senha: string) =>
    request<boolean>(
      '/dentista/login',
      'GET',
      undefined,
      { rgCpf, senha }
    ),
 
  loginAdmin: (email: string, senha: string) =>
    request<boolean>(
      '/funcionario/login',
      'GET',
      undefined,
      { email, senha }
    ),
}