import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Stethoscope, Star, Award, QrCode,
  Building, LogOut, MessageSquare,
  Inbox, Send, ArrowRight,
  CalendarHeart, Calendar, Activity, Check,
  ClipboardCheck, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react'

import { dentistaService, type DentistaBody } from '../../Services/api'
// NOVO ↓ — ajusta o caminho se a pasta do Dashboard for diferente
import { listarSolicitacoes, responderComoPaciente } from '../Dashboard/services/central'
import type { Solicitacao } from '../Dashboard/data/central'

import {
  listarProximosPorCidade,
  dentistaEstaConfirmado,
  autoInscreverDentista,
  cancelarPresencaDentista,
} from '../Dashboard/services/mutiroes'
import type { Mutirao } from '../Dashboard/data/mutiroes'

import {
  listarConvitesParaDentistaPorNome,
  aceitarConvite,
  recusarConvite,
} from '../Dashboard/services/triagens'
import type { Paciente } from '../Dashboard/data/triagens'


interface Dentista {
  nome:              string
  rgCpf:            string
  telefone:          string
  especializacao:    string
  email:             string
  senha:             string
  cep:               string
  numero_consultorio: string
  cro:               string
  n_atendimentos:    number
  avaliacao:         number
  status:            string
  cidade:            string
}

// (mock antigo mantido no arquivo original, comentado, foi preservado;
//  removi do trecho aqui pra não inflar, mas você pode deixar do jeito que está)

// ─── HELPERS pras mensagens (NOVOS) ─────────────────
function formatarHora(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function dataCurta(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function extrairInicial(nome: string): string {
  return nome.split(' ').find(p => !['Dr.', 'Dra.'].includes(p))?.charAt(0) ?? 'D'
}

// ═══════════════════════════════════════════════
// NOVO: SEÇÃO DE MENSAGENS DO DENTISTA
// ═══════════════════════════════════════════════

function SecaoMensagens({ dentistaNome }: { dentistaNome: string }) {
  const [versao, setVersao] = useState(0)
  const [conversaAberta, setConversaAberta] = useState<string | null>(null)
  const [resposta, setResposta] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Filtra conversas onde o nome do dentista bate (case-insensitive)
  const minhasConversas = useMemo<Solicitacao[]>(() => {
    return listarSolicitacoes()
      .filter(s => s.nome.toLowerCase() === dentistaNome.toLowerCase())
      .sort((a, b) => b.ultimaAtualizacao.localeCompare(a.ultimaAtualizacao))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dentistaNome, versao])

  const conversa = conversaAberta
    ? minhasConversas.find(c => c.id === conversaAberta)
    : null

  const naoLidas = minhasConversas.filter(c => c.status === 'aguardando-paciente').length

  async function handleResponder() {
    if (!conversa || !resposta.trim()) return
    setEnviando(true)
    try {
      // Reusa a função do service — "paciente" aqui significa lado solicitante (dentista ou paciente)
      await responderComoPaciente(conversa.id, resposta)
      setResposta('')
      setVersao(v => v + 1)
    } finally {
      setEnviando(false)
    }
  }

  if (minhasConversas.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-5 border border-[#E2E8F0]">
        <div className="flex items-center gap-2 mb-3">
          <Inbox size={18} className="text-[#E88407]" strokeWidth={2} />
          <h2 className="font-bold text-[#0F172A] text-[16px]">Mensagens com a equipe TdB</h2>
        </div>
        <p className="text-[#475569] text-[13px]">
          Você ainda não tem mensagens com a equipe Turma do Bem.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-5 border border-[#E2E8F0]">

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Inbox size={18} className="text-[#E88407]" strokeWidth={2} />
          <h2 className="font-bold text-[#0F172A] text-[16px]">Mensagens com a equipe TdB</h2>
        </div>
        {naoLidas > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#E88407] text-white text-[11px] font-semibold">
            {naoLidas} {naoLidas === 1 ? 'nova' : 'novas'}
          </span>
        )}
      </div>

      {!conversa && (
        <div className="space-y-2">
          {minhasConversas.map(c => {
            const ultimaMsg = c.mensagens[c.mensagens.length - 1]
            const eraDoAdmin = ultimaMsg?.autor === 'admin'
            const aguardando = c.status === 'aguardando-paciente'
            return (
              <button
                key={c.id}
                onClick={() => setConversaAberta(c.id)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${
                  aguardando
                    ? 'border-[#E88407] bg-[#FFEDD5]/40 hover:bg-[#FFEDD5]'
                    : 'border-[#E2E8F0] hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[13px] font-semibold text-[#0F172A]">
                    {eraDoAdmin ? 'Equipe TdB' : 'Você'}
                  </p>
                  <span className="text-[11px] text-[#94A3B8]">
                    {ultimaMsg ? dataCurta(ultimaMsg.timestamp) : c.data}
                  </span>
                </div>
                <p className="text-[12px] text-[#475569] line-clamp-2">
                  {ultimaMsg?.texto ?? c.preview}
                </p>
                {aguardando && (
                  <p className="text-[11px] text-[#E88407] font-semibold mt-1.5">
                    Aguardando sua resposta
                  </p>
                )}
              </button>
            )
          })}
        </div>
      )}

      {conversa && (
        <div>
          <button
            onClick={() => { setConversaAberta(null); setResposta('') }}
            className="text-[12px] text-[#E88407] hover:underline mb-3 inline-flex items-center gap-1 bg-transparent border-none cursor-pointer"
          >
            <ArrowRight size={12} className="rotate-180" />
            Voltar para mensagens
          </button>

          <div className="bg-[#F8FAFC] rounded-xl p-3 max-h-[400px] overflow-y-auto mb-3 space-y-3 border border-[#E2E8F0]">
            {conversa.mensagens.map(msg => {
              const isVoce = msg.autor === 'paciente'
              return (
                <div key={msg.id} className={`flex gap-2 ${isVoce ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
                    isVoce ? 'bg-[#E88407]' : 'bg-[#0F172A]'
                  }`}>
                    {isVoce ? 'EU' : 'TDB'}
                  </div>
                  <div className={`max-w-[80%] flex flex-col ${isVoce ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                      isVoce
                        ? 'bg-[#E88407] text-white rounded-tr-sm'
                        : 'bg-white border border-[#E2E8F0] text-[#0F172A] rounded-tl-sm'
                    }`}>
                      {msg.texto}
                    </div>
                    <span className="text-[10px] text-[#94A3B8] mt-1 px-1">
                      {formatarHora(msg.timestamp)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {conversa.status !== 'fechada' ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                placeholder="Digite sua mensagem para a equipe TdB..."
                rows={3}
                className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#E88407] focus:ring-2 focus:ring-[#E88407]/15 resize-none"
              />
              <button
                onClick={handleResponder}
                disabled={enviando || !resposta.trim()}
                className="w-full bg-[#E88407] text-white font-semibold py-2.5 rounded-lg hover:bg-[#D97706] transition-colors text-[13px] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 border-none cursor-pointer"
              >
                <Send size={14} strokeWidth={2.5} />
                {enviando ? 'Enviando...' : 'Enviar resposta'}
              </button>
            </div>
          ) : (
            <p className="text-center text-[12px] text-[#94A3B8] py-3 border-t border-[#E2E8F0]">
              Esta conversa foi finalizada
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function SecaoMutiroes({ dentista }: { dentista: Dentista }) {
  const [versao, setVersao] = useState(0)
  const [processando, setProcessando] = useState<string | null>(null)

  // Filtro de especialidade: só mutirões que precisam da especialidade dele
  // (se o dentista é "Ortodontia" e o mutirão precisa de "Clínico geral, Periodontia", não mostra)
  const mutiroes = useMemo<Mutirao[]>(() => {
    if (!dentista.cidade) return []
    return listarProximosPorCidade(dentista.cidade)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dentista.cidade, versao])

  async function handleToggle(mutiraoId: string) {
    setProcessando(mutiraoId)
    try {
      if (dentistaEstaConfirmado(mutiraoId, dentista.rgCpf)) {
        await cancelarPresencaDentista(mutiraoId, dentista.rgCpf)
      } else {
        await autoInscreverDentista(mutiraoId, {
          id: dentista.rgCpf,
          nome: dentista.nome,
          especialidade: dentista.especializacao,
          cidade: dentista.cidade,
          estado: '',   // backend não retorna UF separado, fica vazio
        })
      }
      setVersao((v) => v + 1)
    } finally {
      setProcessando(null)
    }
  }

  if (!dentista.cidade) return null

  if (mutiroes.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-5 border border-[#E2E8F0]">
        <div className="flex items-center gap-2 mb-3">
          <CalendarHeart size={18} className="text-[#E88407]" strokeWidth={2} />
          <h2 className="font-bold text-[#0F172A] text-[16px]">Mutirões na sua cidade</h2>
        </div>
        <p className="text-[#475569] text-[13px]">
          Nenhum mutirão programado em <span className="font-semibold">{dentista.cidade}</span> no momento.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-5 border border-[#E2E8F0]">
      <div className="flex items-center gap-2 mb-4">
        <CalendarHeart size={18} className="text-[#E88407]" strokeWidth={2} />
        <h2 className="font-bold text-[#0F172A] text-[16px]">Mutirões na sua cidade</h2>
      </div>

      <div className="space-y-3">
        {mutiroes.map((m) => {
          const confirmado = dentistaEstaConfirmado(m.id, dentista.rgCpf)
          const isProcessing = processando === m.id
          const vagas = m.dentistasNecessarios - m.dentistasConfirmados
          return (
            <div
              key={m.id}
              className={`rounded-xl border p-4 ${
                confirmado
                  ? 'border-green-300 bg-green-50/50'
                  : 'border-[#E2E8F0] bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0F172A] text-[14px]">{m.nome ?? m.local}</p>
                  <p className="text-[#475569] text-[12px] mt-0.5">
                    {m.tipo} · {m.programa}
                  </p>
                </div>
                <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  vagas > 0 ? 'bg-[#FFEDD5] text-[#9A3412]' : 'bg-green-100 text-green-700'
                }`}>
                  {vagas > 0 ? `${vagas} vaga${vagas > 1 ? 's' : ''}` : 'Equipe completa'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[12px] text-[#475569] mb-2">
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} strokeWidth={2} />
                  <span>{new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity size={12} strokeWidth={2} />
                  <span>{m.horario}</span>
                </div>
              </div>

              {m.especialidades.length > 0 && (
                <p className="text-[11px] text-[#475569] mb-3">
                  <span className="font-semibold">Especialidades:</span>{' '}
                  {m.especialidades.join(', ')}
                </p>
              )}

              {confirmado ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 inline-flex items-center justify-center gap-1.5 bg-green-100 border border-green-300 rounded-lg py-2 text-[12px] text-green-700 font-semibold">
                    <Check size={14} strokeWidth={2.5} />
                    Você está confirmado
                  </div>
                  <button
                    onClick={() => handleToggle(m.id)}
                    disabled={isProcessing}
                    className="px-3 py-2 text-[12px] border border-[#E2E8F0] rounded-lg text-[#475569] hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? '...' : 'Cancelar'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleToggle(m.id)}
                  disabled={isProcessing || vagas === 0}
                  className="w-full bg-[#E88407] text-white font-semibold py-2.5 rounded-lg hover:bg-[#D97706] transition-colors text-[13px] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 border-none cursor-pointer"
                >
                  <Check size={14} strokeWidth={2.5} />
                  {isProcessing ? 'Inscrevendo...' : vagas === 0 ? 'Sem vagas' : 'Quero participar'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// NOVO: SEÇÃO CONVITES PENDENTES + MODAIS
// ═══════════════════════════════════════════════

function SecaoConvitesPendentes({ dentistaNome }: { dentistaNome: string }) {
  const [versao, setVersao] = useState(0)
  const [acaoModal, setAcaoModal] = useState<'aceitar' | 'recusar' | null>(null)
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null)
  const [processando, setProcessando] = useState(false)

  const convites = useMemo<Paciente[]>(
    () => listarConvitesParaDentistaPorNome(dentistaNome),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dentistaNome, versao],
  )

  function abrirAceitar(p: Paciente) {
    setPacienteSelecionado(p)
    setAcaoModal('aceitar')
  }
  function abrirRecusar(p: Paciente) {
    setPacienteSelecionado(p)
    setAcaoModal('recusar')
  }
  function fecharModal() {
    if (processando) return
    setAcaoModal(null)
    setPacienteSelecionado(null)
  }

  async function handleAceitar(dados: { data: string; hora: string; duracao: number; observacoes: string }) {
    if (!pacienteSelecionado) return
    setProcessando(true)
    try {
      await aceitarConvite({
        pacienteId: pacienteSelecionado.id,
        dataAtendimento: dados.data,
        horaAtendimento: dados.hora,
        duracaoMinutos: dados.duracao,
        observacoes: dados.observacoes,
      })
      setVersao((v) => v + 1)
      fecharModal()
    } catch (err) {
      console.error('Erro ao aceitar:', err)
      alert('Não foi possível aceitar o convite. Tente novamente.')
    } finally {
      setProcessando(false)
    }
  }

  async function handleRecusar(motivo: string) {
    if (!pacienteSelecionado) return
    setProcessando(true)
    try {
      await recusarConvite({ pacienteId: pacienteSelecionado.id, motivo })
      setVersao((v) => v + 1)
      fecharModal()
    } catch (err) {
      console.error('Erro ao recusar:', err)
      alert('Não foi possível recusar o convite. Tente novamente.')
    } finally {
      setProcessando(false)
    }
  }

  if (convites.length === 0) return null   // não mostra a seção se não tem convite

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-5 border border-[#E2E8F0]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={18} className="text-[#E88407]" strokeWidth={2} />
            <h2 className="font-bold text-[#0F172A] text-[16px]">Convites pendentes</h2>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#E88407] text-white text-[11px] font-semibold">
            {convites.length} {convites.length === 1 ? 'paciente' : 'pacientes'}
          </span>
        </div>

        <p className="text-[#475569] text-[12px] mb-4">
          Pacientes esperando sua resposta. Aceite para agendar atendimento ou recuse para liberar outro voluntário.
        </p>

        <div className="space-y-3">
          {convites.map((p) => {
            const corSeveridade =
              p.severidade === 'Alta'  ? 'bg-red-100 text-red-700'
              : p.severidade === 'Media' ? 'bg-orange-100 text-orange-700'
              :                            'bg-blue-100 text-blue-700'
            return (
              <div key={p.id} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0F172A] text-[14px]">{p.nome}, {p.idade} anos</p>
                    <p className="text-[#475569] text-[12px] mt-0.5">
                      {p.cidade}-{p.estado} · {p.programa}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${corSeveridade}`}>
                    {p.severidade === 'Media' ? 'Média' : p.severidade}
                  </span>
                </div>

                <div className="text-[12px] text-[#475569] mb-3 space-y-1">
                  <p>
                    <span className="font-semibold">Necessidade:</span> {p.necessidade}
                  </p>
                  <p>
                    <span className="font-semibold">Especialidade:</span> {p.especialidadeNecessaria}
                  </p>
                  <p className="text-[11px] text-[#94A3B8]">
                    Na fila há {p.diasNaFila} {p.diasNaFila === 1 ? 'dia' : 'dias'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => abrirAceitar(p)}
                    className="flex-1 bg-[#E88407] text-white font-semibold py-2.5 rounded-lg hover:bg-[#D97706] transition-colors text-[13px] inline-flex items-center justify-center gap-2 border-none cursor-pointer"
                  >
                    <CheckCircle2 size={14} strokeWidth={2.5} />
                    Aceitar
                  </button>
                  <button
                    onClick={() => abrirRecusar(p)}
                    className="flex-1 bg-white border border-red-300 text-red-600 font-semibold py-2.5 rounded-lg hover:bg-red-50 transition-colors text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <XCircle size={14} strokeWidth={2} />
                    Recusar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {acaoModal === 'aceitar' && pacienteSelecionado && (
        <AceitarConviteModal
          paciente={pacienteSelecionado}
          onClose={fecharModal}
          onConfirmar={handleAceitar}
          processando={processando}
        />
      )}
      {acaoModal === 'recusar' && pacienteSelecionado && (
        <RecusarConviteModal
          paciente={pacienteSelecionado}
          onClose={fecharModal}
          onConfirmar={handleRecusar}
          processando={processando}
        />
      )}
    </>
  )
}

// ─── MODAL ACEITAR ───

function AceitarConviteModal({
  paciente, onClose, onConfirmar, processando,
}: {
  paciente: Paciente
  onClose: () => void
  onConfirmar: (dados: { data: string; hora: string; duracao: number; observacoes: string }) => Promise<void>
  processando: boolean
}) {
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [duracao, setDuracao] = useState(60)
  const [observacoes, setObservacoes] = useState('')

  // Default: amanhã às 09:00
  useEffect(() => {
    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 1)
    setData(amanha.toISOString().slice(0, 10))
    setHora('09:00')
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!data || !hora) {
      alert('Preencha data e hora')
      return
    }
    await onConfirmar({ data, hora, duracao, observacoes })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-lg"
      >
        <div className="p-6 border-b border-[#E2E8F0]">
          <h3 className="font-bold text-[#0F172A] text-[18px]">Aceitar convite</h3>
          <p className="text-[#475569] text-[13px] mt-1">
            Atendimento de <span className="font-semibold">{paciente.nome}</span>
          </p>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="bg-[#F8FAFC] rounded-xl p-3 text-[12px] text-[#475569] border border-[#E2E8F0]">
            <p className="font-semibold text-[#0F172A]">{paciente.necessidade}</p>
            <p className="mt-1">
              {paciente.especialidadeNecessaria} · {paciente.cidade}-{paciente.estado}
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#475569] mb-1.5">
              Data do atendimento *
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              required
              className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] rounded-lg px-3 py-2.5 text-[13px] outline-none focus:border-[#E88407] focus:ring-2 focus:ring-[#E88407]/15"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#475569] mb-1.5">
                Hora *
              </label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                required
                className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] rounded-lg px-3 py-2.5 text-[13px] outline-none focus:border-[#E88407] focus:ring-2 focus:ring-[#E88407]/15"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#475569] mb-1.5">
                Duração
              </label>
              <select
                value={duracao}
                onChange={(e) => setDuracao(Number(e.target.value))}
                className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] rounded-lg px-3 py-2.5 text-[13px] outline-none focus:border-[#E88407] focus:ring-2 focus:ring-[#E88407]/15 cursor-pointer"
              >
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#475569] mb-1.5">
              Observações pro paciente
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Orientações pré-consulta, documentos a trazer..."
              className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-lg px-3 py-2.5 text-[13px] outline-none focus:border-[#E88407] focus:ring-2 focus:ring-[#E88407]/15 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={processando}
              className="flex-1 bg-white border border-[#E2E8F0] text-[#475569] font-semibold py-2.5 rounded-lg hover:bg-[#F8FAFC] transition-colors text-[13px] cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={processando}
              className="flex-1 bg-[#E88407] text-white font-semibold py-2.5 rounded-lg hover:bg-[#D97706] transition-colors text-[13px] inline-flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={14} strokeWidth={2.5} />
              {processando ? 'Aceitando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── MODAL RECUSAR ───

function RecusarConviteModal({
  paciente, onClose, onConfirmar, processando,
}: {
  paciente: Paciente
  onClose: () => void
  onConfirmar: (motivo: string) => Promise<void>
  processando: boolean
}) {
  const [motivoSelect, setMotivoSelect] = useState('Sem disponibilidade na agenda')
  const [detalhes, setDetalhes] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const motivoFinal = detalhes ? `${motivoSelect} — ${detalhes}` : motivoSelect
    await onConfirmar(motivoFinal)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-lg"
      >
        <div className="p-6 border-b border-[#E2E8F0]">
          <h3 className="font-bold text-[#0F172A] text-[18px]">Recusar convite</h3>
          <p className="text-[#475569] text-[13px] mt-1">
            Convite de <span className="font-semibold">{paciente.nome}</span>
          </p>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex gap-2 items-start">
            <AlertCircle size={16} className="text-yellow-700 shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-[12px] text-yellow-900 leading-relaxed">
              Ao recusar, o paciente volta pra fila e a equipe TdB poderá convidar outro voluntário.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#475569] mb-1.5">
              Motivo *
            </label>
            <select
              value={motivoSelect}
              onChange={(e) => setMotivoSelect(e.target.value)}
              className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] rounded-lg px-3 py-2.5 text-[13px] outline-none focus:border-[#E88407] focus:ring-2 focus:ring-[#E88407]/15 cursor-pointer"
            >
              <option>Sem disponibilidade na agenda</option>
              <option>Fora da minha especialidade</option>
              <option>Distância incompatível</option>
              <option>Período de férias/afastamento</option>
              <option>Outro motivo</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#475569] mb-1.5">
              Detalhes (opcional)
            </label>
            <textarea
              value={detalhes}
              onChange={(e) => setDetalhes(e.target.value)}
              rows={3}
              placeholder="Contexto adicional pra equipe TdB..."
              className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-lg px-3 py-2.5 text-[13px] outline-none focus:border-[#E88407] focus:ring-2 focus:ring-[#E88407]/15 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={processando}
              className="flex-1 bg-white border border-[#E2E8F0] text-[#475569] font-semibold py-2.5 rounded-lg hover:bg-[#F8FAFC] transition-colors text-[13px] cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={processando}
              className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition-colors text-[13px] inline-flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-50"
            >
              <XCircle size={14} strokeWidth={2.5} />
              {processando ? 'Recusando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


// ─── PAINEL DO DENTISTA (visual TdB) ──────────
function PainelDentista({ dentista, onSair }: { dentista: Dentista; onSair: () => void }) {
  return (
    <div className="min-h-screen bg-[#FAFBFD]">

      {/* Header */}
      <header className="bg-gradient-to-br from-[#FFEDD5] via-[#FED7AA] to-[#FDBA74] px-6 py-12 border-b border-orange-200">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-[#E88407] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-md">
            {extrairInicial(dentista.nome)}
          </div>
          <h1 className="text-[26px] font-extrabold text-[#9A3412] mb-1">{dentista.nome}</h1>
          <p className="text-[#9A3412]/80 text-[14px]">{dentista.especializacao}</p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mt-5">
            <div className="text-center">
              <p className="text-[22px] font-bold text-[#9A3412]">{dentista.n_atendimentos}</p>
              <p className="text-[11px] text-[#9A3412]/70">Atendimentos</p>
            </div>
            <div className="w-px h-8 bg-orange-300" />
            <div className="text-center">
              <p className="text-[22px] font-bold text-[#9A3412] inline-flex items-center gap-1">
                <Star size={16} fill="#9A3412" strokeWidth={0} />
                {dentista.avaliacao.toFixed(1)}
              </p>
              <p className="text-[11px] text-[#9A3412]/70">Avaliação</p>
            </div>
            <div className="w-px h-8 bg-orange-300" />
            <div className="text-center">
              <p className="text-[22px] font-bold text-green-700">{dentista.status}</p>
              <p className="text-[11px] text-[#9A3412]/70">Status</p>
            </div>
          </div>
        </div>
      </header>

      <section className="py-8 px-6 max-w-2xl mx-auto">

        {/* Botão de destaque: Validar Paciente */}
        <Link
          to="/validar-paciente"
          className="w-full bg-[#E88407] text-white font-bold py-4 rounded-xl hover:bg-[#D97706] hover:-translate-y-0.5 transition-all duration-200 text-center text-[14px] no-underline inline-flex items-center justify-center gap-2 mb-5 shadow-sm"
        >
          <QrCode size={18} strokeWidth={2.5} />
          Validar paciente por QR Code
        </Link>

        <SecaoConvitesPendentes dentistaNome={dentista.nome} />

        {/* NOVO ↓ — Mensagens com a equipe TdB */}
        <SecaoMensagens dentistaNome={dentista.nome} />
        <SecaoMutiroes dentista={dentista} />

        {/* Informações profissionais */}
        <div className="bg-gradient-to-br from-[#E88407] to-[#F97316] rounded-2xl shadow-md p-6 mb-5 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope size={18} strokeWidth={2} />
            <h2 className="font-bold text-[16px]">Informações profissionais</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-white/80 text-[11px] uppercase tracking-wide mb-1">Nome</p>
              <p className="font-semibold text-[14px]">{dentista.nome}</p>
            </div>
            <div>
              <p className="text-white/80 text-[11px] uppercase tracking-wide mb-1">CRO</p>
              <p className="font-semibold text-[14px]">{dentista.cro}</p>
            </div>
            <div>
              <p className="text-white/80 text-[11px] uppercase tracking-wide mb-1">Especialidade</p>
              <p className="font-semibold text-[14px]">{dentista.especializacao}</p>
            </div>
            <div>
              <p className="text-white/80 text-[11px] uppercase tracking-wide mb-1">Status</p>
              <p className="font-semibold text-[14px]">{dentista.status}</p>
            </div>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="bg-[#F8FAFC] rounded-2xl p-5 mb-6 border border-[#E2E8F0]">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-[#475569]" strokeWidth={2} />
            <h2 className="font-bold text-[#0F172A] text-[14px]">Informações adicionais</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div>
              <p className="text-[#94A3B8] text-[11px] uppercase tracking-wide">Total de pacientes atendidos</p>
              <p className="font-extrabold text-[#475569] text-[18px] mt-1">{dentista.n_atendimentos}</p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[#94A3B8]">
                <Building size={11} strokeWidth={2} />
                <p className="text-[11px] uppercase tracking-wide">Consultório</p>
              </div>
              <p className="font-semibold text-[#475569] mt-0.5">{dentista.numero_consultorio || '—'}</p>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onSair}
            className="w-full bg-white border border-[#E2E8F0] text-[#475569] font-semibold py-3 rounded-xl hover:bg-[#F8FAFC] transition-colors duration-200 cursor-pointer text-[14px] inline-flex items-center justify-center gap-2"
          >
            <LogOut size={16} strokeWidth={2} />
            Sair
          </button>
          <Link
            to="/FaleConosco"
            className="w-full bg-[#0F172A] text-white font-bold py-3 rounded-xl hover:bg-[#1E293B] hover:-translate-y-0.5 transition-all duration-200 text-center text-[14px] no-underline inline-flex items-center justify-center gap-2"
          >
            <MessageSquare size={16} strokeWidth={2} />
            Falar com o Suporte
          </Link>
        </div>

      </section>
    </div>
  )
}

// ─── PRINCIPAL (LÓGICA 100% PRESERVADA) ──────
const PainelDentistaPage = () => {
  const [dentista,   setDentista]   = useState<Dentista | null>(null)
  const [carregando, setCarregando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function carregarDentista() {
      const rgCpfSalvo = sessionStorage.getItem('tdb_rgCpf')

      if (!rgCpfSalvo) {
        navigate('/login')
        return
      }

      try {
        const resultado: DentistaBody = await dentistaService.buscar(rgCpfSalvo)
        console.log('RESULTADO DENTISTA:', resultado)

        setDentista({
          nome: resultado.nome ?? '',
          rgCpf: resultado.rgCpf ?? '',
          telefone: resultado.telefone ?? '',
          especializacao: resultado.especializacao ?? '',
          email: resultado.email ?? '',
          senha: resultado.senha ?? '',
          cep: resultado.cep ?? '',
          numero_consultorio: String(resultado.nConsultorio ?? ''),
          cro: resultado.cro ?? '',
          n_atendimentos: resultado.nAtendimentos ?? 0,
          avaliacao: resultado.avaliacao ?? 0,
          status: resultado.status ?? 'Ativo',
          cidade: (resultado as unknown as { dto?: { localidade?: string } }).dto?.localidade ?? '',
        })

      } catch (erro) {
        console.error('Erro ao buscar dentista:', erro)
        navigate('/login')
      } finally {
        setCarregando(false)
      }
    }

    carregarDentista()
  }, [navigate])

  function handleSair() {
    sessionStorage.removeItem('tdb_rgCpf')
    navigate('/login')
  }

  // Loading em tema light TdB
  if (carregando) {
    return (
      <div className="min-h-screen bg-[#FAFBFD] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#FFEDD5] border-t-[#E88407] rounded-full animate-spin mb-3" />
          <p className="text-[#475569] text-[14px]">Carregando seus dados...</p>
        </div>
      </div>
    )
  }

  if (!dentista) return null

  return <PainelDentista dentista={dentista} onSair={handleSair} />
}

export default PainelDentistaPage;