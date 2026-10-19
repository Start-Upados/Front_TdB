/**
 * Convites do Portal do Dentista — 100% backend.
 *
 * Antes o portal lia os convites do cache do navegador (só funcionava no mesmo
 * computador do admin). Agora lê GET /triagem/dentista/{cpf}/convites e responde
 * direto no convite (POST /triagem/convite/{id}/aceitar | recusar).
 */
import { triagemService, ErroHttp, type ConviteBody } from '../../Services/api'
import { normalizarSexo, programaPorPerfil } from '../Dashboard/services/programa'

export type PrioridadeConvite = 'Alta' | 'Media' | 'Baixa'

export interface ConvitePortal {
  idConvite:     number
  idTriagem:     number
  protocolo?:    string
  pacienteNome:  string
  idade?:        number
  cidade:        string
  uf:            string
  programa:      string
  prioridade?:   PrioridadeConvite
  especialidade: string   // tratamento indicado pela triagem ('' quando é o padrão "Clínico geral")
  necessidade?:  string   // o que a paciente pediu na solicitação
  diasNaFila?:   number
  mensagem?:     string
}

function semAcento(v?: string): string {
  return (v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

function normalizarPrioridade(v?: string): PrioridadeConvite | undefined {
  const p = semAcento(v)
  if (p.startsWith('alt')) return 'Alta'
  if (p.startsWith('med')) return 'Media'
  if (p.startsWith('baix')) return 'Baixa'
  return undefined
}

function normalizarPrograma(v?: string): string {
  const p = semAcento(v)
  if (p.includes('apolon') || p.includes('saude bucal')) return 'Apolônias do Bem'
  if (p.includes('mutir')) return 'Mutirão'
  return v ? 'Dentista do Bem' : ''
}

function idadeDe(dataNasc?: string): number | undefined {
  if (!dataNasc || !/^\d{4}-\d{2}-\d{2}/.test(dataNasc)) return undefined
  const [a, m, d] = dataNasc.slice(0, 10).split('-').map(Number)
  const hoje = new Date()
  let idade = hoje.getFullYear() - a
  if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) idade--
  return idade >= 0 && idade < 130 ? idade : undefined
}

function diasDesde(data?: string): number | undefined {
  if (!data || !/^\d{4}-\d{2}-\d{2}/.test(data)) return undefined
  // Diferença em dias de calendário (local), não em horas corridas
  const [a, m, d] = data.slice(0, 10).split('-').map(Number)
  const hoje = new Date()
  const dias = Math.round(
    (Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()) - Date.UTC(a, m - 1, d)) / 86_400_000,
  )
  return dias >= 0 ? dias : undefined
}

/** Mulher = Apolônias do Bem; jovem homem 11–17 = Dentista do Bem (mesma regra da Central). */
function programaDoConvite(c: ConviteBody, idade?: number): string {
  if (normalizarSexo(c.sexo)) return programaPorPerfil(c.sexo, idade, c.protocolo)
  const gravado = normalizarPrograma(c.programa)
  // Dentista do Bem não atende adulto: triagem antiga gravada errado vira Apolônias
  if (gravado === 'Dentista do Bem' && idade !== undefined && idade >= 18) return 'Apolônias do Bem'
  return gravado || programaPorPerfil(undefined, idade, c.protocolo)
}

function mapear(c: ConviteBody): ConvitePortal {
  const idade = idadeDe(c.dataNasc)
  const especialidade = (c.especialidade ?? '').trim()
  return {
    idConvite:     c.idConvite ?? 0,
    idTriagem:     c.idTriagem ?? 0,
    protocolo:     c.protocolo,
    // Backend sem o resumo da triagem ainda: mostra o nº da triagem em vez de inventar dados
    pacienteNome:  c.pacienteNome?.trim() || `Paciente da triagem #${c.idTriagem ?? '?'}`,
    idade,
    cidade:        c.cidade ?? '',
    uf:            c.uf ?? '',
    programa:      programaDoConvite(c, idade),
    prioridade:    normalizarPrioridade(c.prioridade),
    // "Clínico geral" é o padrão gravado na aprovação: não informa nada, então não mostra
    especialidade: semAcento(especialidade) === 'clinico geral' ? '' : especialidade,
    necessidade:   c.necessidade?.trim() || undefined,
    diasNaFila:    diasDesde(c.dataEntradaFila),
    mensagem:      c.mensagem,
  }
}

/** Convites em aberto (status 'pendente') do dentista logado. Lança erro se o backend falhar. */
export async function carregarConvitesPendentes(rgCpf: string): Promise<ConvitePortal[]> {
  if (!rgCpf) return []
  const lista = await triagemService.listarConvitesDoDentista(rgCpf)
  if (!Array.isArray(lista)) return []
  return lista
    .filter((c) => !c.status || semAcento(c.status) === 'pendente')
    .filter((c) => (c.idConvite ?? 0) > 0)
    .map(mapear)
}

export interface DadosAceite {
  data:        string   // YYYY-MM-DD
  hora:        string   // HH:MM
  duracao:     number   // minutos
  observacoes: string
}

/** Aceita: o backend cria o atendimento, tira o paciente da fila e cancela os outros convites. */
export async function aceitarConvitePortal(convite: ConvitePortal, dados: DadosAceite): Promise<number> {
  try {
    const res = await triagemService.aceitarConvite(convite.idConvite, {
      dataAtendimento: `${dados.data} ${dados.hora}`,
      duracaoMin:      dados.duracao,
      observacoes:     dados.observacoes || undefined,
      sessaoNumero:    1,
      sessaoTotal:     1,
    })
    return res?.idAtendimento ?? 0
  } catch (err) {
    throw new Error(mensagemDeErro(err, 'aceitar'))
  }
}

/** Recusa: o paciente volta para a fila do admin quando não sobra nenhum convite em aberto. */
export async function recusarConvitePortal(convite: ConvitePortal, motivo: string): Promise<void> {
  try {
    await triagemService.recusarConvite(convite.idConvite, motivo)
  } catch (err) {
    throw new Error(mensagemDeErro(err, 'recusar'))
  }
}

function mensagemDeErro(err: unknown, acao: 'aceitar' | 'recusar'): string {
  if (err instanceof ErroHttp) {
    if (err.status === 403) return 'Esse convite não é seu.'
    if (err.status === 404) return 'Convite não encontrado.'
    // 409 = o convite já foi aceito, recusado ou cancelado
    if (err.status === 409) {
      return 'Esse convite não está mais disponível (pode ter sido cancelado ou aceito por outro voluntário).'
    }
    // 400 = falhou ao gravar: mostra o motivo que o backend mandou, para dar pra corrigir
    if (err.status === 400) {
      return `Não foi possível ${acao} o convite. Detalhe: ${err.message}`
    }
  }
  return `Não foi possível ${acao} o convite. Tente novamente.`
}
