/**
 * Portal do dentista — histórico de consultas (GET /atendimento/dentista/{cpf}).
 * Mesmo visual do histórico do portal do paciente, mas com todos os pacientes do dentista.
 */
import { atendimentoService, type AtendimentoBody } from '../../Services/api'

export type StatusHistorico = 'concluido' | 'andamento' | 'proximo' | 'agendado'

export interface ConsultaDentista {
  idAtendimento: number
  paciente:      string
  procedimento:  string
  data:          string   // dd/mm/aaaa
  hora:          string   // HH:MM
  status:        StatusHistorico
}

function semAcento(v?: string): string {
  return (v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

const CONCLUIDO  = ['concluido', 'concluida', 'realizado', 'realizada', 'finalizado']
const DESCARTADO = ['cancelado', 'cancelada', 'no-show', 'falta']

function partesData(bruto?: string): { iso: string; data: string; hora: string } {
  // Backend: "2026-10-21 09:00:00" (ou "2026-10-21T09:00")
  const m = (bruto ?? '').match(/^(\d{4})-(\d{2})-(\d{2})[ T]?(\d{2})?:?(\d{2})?/)
  if (!m) return { iso: '', data: '—', hora: '—' }
  const [, a, mes, d, h = '00', min = '00'] = m
  return { iso: `${a}-${mes}-${d}T${h}:${min}`, data: `${d}/${mes}/${a}`, hora: `${h}:${min}` }
}

function agoraIso(): string {
  const n = new Date()
  const p = (x: number) => String(x).padStart(2, '0')
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}T${p(n.getHours())}:${p(n.getMinutes())}`
}

/** Lista os atendimentos do dentista logado. Falha de rede/permissão → []. */
export async function carregarHistoricoDentista(rgCpf: string): Promise<ConsultaDentista[]> {
  if (!rgCpf) return []
  let lista: AtendimentoBody[] = []
  try {
    const r = await atendimentoService.listarPorDentista(rgCpf)
    lista = Array.isArray(r) ? r : []
  } catch (err) {
    console.warn('[portal dentista] não foi possível carregar o histórico:', err)
    return []
  }

  const validos = lista
    .filter((a) => !DESCARTADO.includes(semAcento(a.status)))
    .map((a) => ({ a, quando: partesData(a.dataAtendimento) }))
    .sort((x, y) => x.quando.iso.localeCompare(y.quando.iso))

  // "Próximo" = o primeiro atendimento em aberto de agora em diante
  const agora = agoraIso()
  const proximo = validos.find(({ a, quando }) =>
    !CONCLUIDO.includes(semAcento(a.status)) && semAcento(a.status) !== 'em-andamento' && quando.iso >= agora)

  return validos.map(({ a, quando }) => {
    const s = semAcento(a.status)
    const esp = (a.especialidade ?? '').trim()
    return {
      idAtendimento: a.idAtendimento ?? 0,
      paciente:      (a.pacienteNome ?? '').trim() || 'Paciente',
      procedimento:  !esp || semAcento(esp) === 'clinico geral' ? 'Consulta odontológica' : esp,
      data:          quando.data,
      hora:          quando.hora,
      status:        CONCLUIDO.includes(s) ? 'concluido'
                   : s === 'em-andamento'  ? 'andamento'
                   : proximo && a === proximo.a ? 'proximo'
                   :                          'agendado',
    }
  })
}
