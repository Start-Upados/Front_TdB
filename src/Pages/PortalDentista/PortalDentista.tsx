import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Stethoscope, Star, Award, QrCode,
  Building, LogOut, MessageSquare,
  Inbox, Send, ArrowRight,
} from 'lucide-react'
import { dentistaService, type DentistaBody } from '../../Services/api'
// NOVO ↓ — ajusta o caminho se a pasta do Dashboard for diferente
import { listarSolicitacoes, responderComoPaciente } from '../Dashboard/services/central'
import type { Solicitacao } from '../Dashboard/data/central'

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

        {/* NOVO ↓ — Mensagens com a equipe TdB */}
        <SecaoMensagens dentistaNome={dentista.nome} />

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