/**
 * Validar paciente (QR Code) — dados reais do backend.
 *
 * O dentista logado só enxerga os PRÓPRIOS atendimentos (GET /atendimento/dentista/{cpf}),
 * então um protocolo de paciente de outro voluntário aparece como "não encontrado"
 * (proteção de dados do paciente). Confirmar = PUT /atendimento/{id}/finalizar.
 */
import { atendimentoService, dentistaService, ErroHttp, type AtendimentoBody } from '../../Services/api'
import { portalAutenticado } from '../../Services/sessao'

export type StatusConsulta = 'concluido' | 'proximo' | 'agendado'

export interface ConsultaValidacao {
  idAtendimento: number
  data:          string   // dd/mm/aaaa
  hora:          string   // HH:MM
  procedimento:  string
  status:        StatusConsulta
}

export interface PacienteValidacao {
  protocolo:           string
  nome:                string
  programa:            string
  dentista:            string
  status:              string
  sessaoAtual:         number
  totalSessoes:        number
  procedimento:        string
  historico:           ConsultaValidacao[]
  idAtendimentoAberto?: number   // a sessão que o botão "Confirmar atendimento" vai finalizar
}

export type ResultadoBusca =
  | { tipo: 'ok'; paciente: PacienteValidacao }
  | { tipo: 'nao-logado' }
  | { tipo: 'nao-encontrado' }
  | { tipo: 'erro'; mensagem: string }

const CHAVE_POS_LOGIN = 'tdb_pos_login'

/** Guarda para onde voltar depois do login (o QR abre uma aba nova, sem sessão). */
export function lembrarDestino(protocolo: string): void {
  try {
    const destino = protocolo ? `/validar-paciente?protocolo=${encodeURIComponent(protocolo)}` : '/validar-paciente'
    sessionStorage.setItem(CHAVE_POS_LOGIN, destino)
  } catch { /* navegador sem storage: só não volta sozinho */ }
}

export function dentistaLogado(): boolean {
  try {
    return portalAutenticado() && !!sessionStorage.getItem('tdb_rgCpf')
  } catch {
    return false
  }
}

function semAcento(v?: string): string {
  return (v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

function normalizarPrograma(v?: string): string {
  const p = semAcento(v)
  if (p.includes('apolon') || p.includes('saude bucal')) return 'Apolônias do Bem'
  if (p.includes('mutir')) return 'Mutirão'
  return 'Dentista do Bem'
}

function partesData(bruto?: string): { iso: string; data: string; hora: string } {
  // Backend: "2026-10-16 14:00:00.0" (ou "2026-10-16T14:00")
  const m = (bruto ?? '').match(/^(\d{4})-(\d{2})-(\d{2})[ T]?(\d{2})?:?(\d{2})?/)
  if (!m) return { iso: '', data: '—', hora: '—' }
  const [, a, mes, d, h = '00', min = '00'] = m
  return { iso: `${a}-${mes}-${d}T${h}:${min}`, data: `${d}/${mes}/${a}`, hora: `${h}:${min}` }
}

const CONCLUIDO = ['concluido', 'concluida', 'realizado', 'realizada', 'finalizado']
const DESCARTADO = ['cancelado', 'cancelada', 'no-show', 'falta']

function rotuloStatus(s?: string): string {
  const v = semAcento(s)
  if (v === 'confirmado') return 'Confirmado'
  if (v === 'em-andamento') return 'Em andamento'
  if (CONCLUIDO.includes(v)) return 'Concluído'
  return 'Agendado'
}

export function montarPaciente(protocolo: string, doProtocolo: AtendimentoBody[]): PacienteValidacao {
  const validos = doProtocolo
    .filter((a) => !DESCARTADO.includes(semAcento(a.status)))
    .map((a) => ({ a, quando: partesData(a.dataAtendimento) }))
    .sort((x, y) => x.quando.iso.localeCompare(y.quando.iso))

  const aberto = validos.find(({ a }) => !CONCLUIDO.includes(semAcento(a.status)))
  const concluidas = validos.filter(({ a }) => CONCLUIDO.includes(semAcento(a.status))).length
  const totalDeclarado = Math.max(0, ...validos.map(({ a }) => a.sessaoTotal ?? 0))
  const totalSessoes = Math.max(totalDeclarado, validos.length, 1)
  const referencia = aberto?.a ?? validos[validos.length - 1]?.a ?? doProtocolo[0]

  const historico: ConsultaValidacao[] = validos.map(({ a, quando }) => ({
    idAtendimento: a.idAtendimento ?? 0,
    data:          quando.data,
    hora:          quando.hora,
    procedimento:  a.especialidade || 'Atendimento',
    status:        CONCLUIDO.includes(semAcento(a.status)) ? 'concluido'
                 : a === aberto?.a                          ? 'proximo'
                 :                                            'agendado',
  }))

  return {
    protocolo,
    nome:          referencia?.pacienteNome ?? 'Paciente',
    programa:      normalizarPrograma(referencia?.programa),
    dentista:      referencia?.dentistaNome ?? '',
    status:        aberto ? rotuloStatus(aberto.a.status) : 'Tratamento concluído',
    sessaoAtual:   Math.min(concluidas + (aberto ? 1 : 0), totalSessoes),
    totalSessoes,
    procedimento:  referencia?.especialidade || 'Atendimento',
    historico,
    idAtendimentoAberto: aberto?.a.idAtendimento || undefined,
  }
}

/** Busca o protocolo entre os atendimentos do dentista logado. */
export async function buscarPaciente(protocolo: string): Promise<ResultadoBusca> {
  const alvo = protocolo.trim().toUpperCase()
  if (!alvo) return { tipo: 'nao-encontrado' }
  if (!dentistaLogado()) return { tipo: 'nao-logado' }

  try {
    // CPF como está no banco (o que foi digitado no login pode ter outra formatação)
    const salvo = sessionStorage.getItem('tdb_rgCpf') ?? ''
    let rgCpf = salvo
    try {
      const d = await dentistaService.buscar(salvo)
      if (d?.rgCpf) rgCpf = d.rgCpf
    } catch { /* usa o que foi digitado */ }

    const lista = await atendimentoService.listarPorDentista(rgCpf)
    const doProtocolo = (Array.isArray(lista) ? lista : [])
      .filter((a) => (a.protocolo ?? '').trim().toUpperCase() === alvo)
    if (doProtocolo.length === 0) return { tipo: 'nao-encontrado' }
    return { tipo: 'ok', paciente: montarPaciente(alvo, doProtocolo) }
  } catch (err) {
    if (err instanceof ErroHttp && err.status === 401) return { tipo: 'nao-logado' }
    console.error('[validar] erro ao buscar paciente:', err)
    return { tipo: 'erro', mensagem: 'Não foi possível consultar o sistema agora. Tente novamente.' }
  }
}

/** Marca a sessão em aberto como realizada no backend. */
export async function confirmarSessao(idAtendimento: number): Promise<void> {
  try {
    await atendimentoService.finalizar(idAtendimento)
  } catch (err) {
    if (err instanceof ErroHttp && err.status === 403) {
      throw new Error('Seu acesso ainda não permite confirmar atendimentos. Avise a equipe TdB.')
    }
    throw new Error('Não foi possível registrar. Tente novamente.')
  }
}
