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