/**
 * Portal do paciente — atendimentos reais (GET /atendimento/paciente/{cpf}).
 * Antes o portal só lia o cadastro do beneficiário, então a consulta marcada
 * pela dentista nunca aparecia ("A definir" em tudo).
 */
import { atendimentoService, type AtendimentoBody } from '../../Services/api'
import { montarPaciente, type ConsultaValidacao } from '../ValidarPaciente/validacao'

export interface DadosAtendimento {
  dentista:     string
  clinica:      string
  endereco:     string
  status:       string
  sessaoAtual:  number
  totalSessoes: number
  procedimento: string
  proximaData:  string
  proximaHora:  string
  historico:    ConsultaValidacao[]
  protocolos:   string[]   // todos os protocolos do paciente; o do tratamento atual vem primeiro
}

function semAcento(v?: string): string {
  return (v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

const DESCARTADO = ['cancelado', 'cancelada', 'no-show', 'falta']

/** Lista os atendimentos do paciente logado. Sem backend novo (403/404) devolve []. */
export async function carregarAtendimentosDoPaciente(rgCpf: string): Promise<AtendimentoBody[]> {
  if (!rgCpf) return []
  try {
    const lista = await atendimentoService.listarPorPaciente(rgCpf)
    return Array.isArray(lista) ? lista : []
  } catch (err) {
    console.warn('[portal paciente] não foi possível carregar os atendimentos:', err)
    return []
  }
}

const STATUS_PACIENTE: Record<string, string> = {
  'Agendado':             'Consulta agendada',
  'Confirmado':           'Presença confirmada',
  'Em andamento':         'Em atendimento',
  'Tratamento concluído': 'Tratamento concluído',
}

/** Monta os dados do tratamento a partir dos atendimentos. null = nenhum atendimento válido. */
export function dadosDoTratamento(lista: AtendimentoBody[]): DadosAtendimento | null {
  const validos = lista.filter((a) => !DESCARTADO.includes(semAcento(a.status)))
  if (validos.length === 0) return null

  // Um paciente pode ter mais de um protocolo: usa o do próximo atendimento em aberto
  const emAberto = validos.find((a) => !['concluido', 'concluida', 'realizado', 'realizada', 'finalizado'].includes(semAcento(a.status)))
  const referencia = emAberto ?? validos[validos.length - 1]
  const protocolo = (referencia.protocolo ?? '').trim().toUpperCase()
  const doProtocolo = protocolo
    ? validos.filter((a) => (a.protocolo ?? '').trim().toUpperCase() === protocolo)
    : validos

  const p = montarPaciente(protocolo, doProtocolo)

  // Cada solicitação gera um protocolo: lista todos, sem repetir, o atual primeiro
  const protocolos = [protocolo, ...lista.map((a) => (a.protocolo ?? '').trim().toUpperCase())]
    .filter((v, i, arr) => !!v && arr.indexOf(v) === i)
  const proximo = p.historico.find((c) => c.status === 'proximo')
  const especialidade = (referencia.especialidade ?? '').trim()
  const procedimento = !especialidade || semAcento(especialidade) === 'clinico geral'
    ? 'Consulta odontológica'
    : especialidade

  return {
    dentista:     p.dentista || 'A definir',
    clinica:      referencia.localAtendimento ? 'Consultório do dentista voluntário' : 'A equipe TdB vai informar',
    endereco:     referencia.localAtendimento ?? '',
    status:       STATUS_PACIENTE[p.status] ?? p.status,
    sessaoAtual:  p.sessaoAtual,
    totalSessoes: p.totalSessoes,
    procedimento,
    proximaData:  proximo?.data ?? 'Sem consulta marcada',
    proximaHora:  proximo?.hora ?? '—',
    protocolos,
    historico:    p.historico.map((c) => ({ ...c, procedimento: c.procedimento && semAcento(c.procedimento) !== 'clinico geral' ? c.procedimento : 'Consulta odontológica' })),
  }
}
