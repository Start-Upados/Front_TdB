import { useState, useEffect, useMemo } from 'react'  // ← NOVO: useMemo
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity, Calendar, MapPin, ClipboardList, Info,
  Stethoscope, LogOut, MessageSquare,
  Check, ArrowRight, Circle,
  Send, Inbox,  // ← NOVO
} from 'lucide-react'
import { useSessionTimeout } from '../../Hooks/useSessionTimeout'
import SessionWarning from '../../Components/SessionWarning/SessionWarning'
import { solicitacaoService } from '../../Services/api'
// NOVO ↓ — ajusta o caminho se a pasta do seu Dashboard for diferente
import { listarSolicitacoes, responderComoPaciente } from '../Dashboard/services/central'
import type { Solicitacao } from '../Dashboard/data/central'

import { CalendarHeart } from 'lucide-react';   // ← já tem MapPin, renomeia se conflitar
import {
  listarProximosPorCidade,
  pacienteEstaConfirmado,
  confirmarPresencaPaciente,
  cancelarPresencaPaciente,
} from '../Dashboard/services/mutiroes';
import type { Mutirao } from '../Dashboard/data/mutiroes';


interface Consulta {
  data:         string
  hora:         string
  procedimento: string
  status:       'concluido' | 'proximo' | 'agendado'
}

interface Paciente {
  cpf:           string
  nome:          string
  idade:         number
  cidade:        string
  programa:      string
  dentista:      string
  clinica:       string
  endereco:      string
  status:        string
  sessaoAtual:   number
  totalSessoes:  number
  procedimento:  string
  proximaData:   string
  proximaHora:   string
  historico:     Consulta[]
}

// ─── MOCK DATA (PRESERVADO — todos os 10) ─────────
const MOCK_PACIENTES: Paciente[] = [
  {
    cpf: '123.456.789-00', nome: 'João Silva', idade: 15, cidade: 'São Paulo, SP',
    programa: 'Dentista do Bem', dentista: 'Dr. Carlos Mendes', clinica: 'Clínica Oral Center',
    endereco: 'Rua das Flores, 123 — Vila Mariana, São Paulo, SP', status: 'Em andamento',
    sessaoAtual: 2, totalSessoes: 4, procedimento: 'Tratamento de Canal',
    proximaData: '18/05/2025', proximaHora: '14:00',
    historico: [
      { data: '10/05/2025', hora: '09:00', procedimento: 'Avaliação inicial',     status: 'concluido' },
      { data: '15/05/2025', hora: '10:30', procedimento: 'Extração preparatória', status: 'concluido' },
      { data: '18/05/2025', hora: '14:00', procedimento: 'Canal — sessão 1',      status: 'proximo'   },
      { data: '25/05/2025', hora: '14:00', procedimento: 'Restauração final',     status: 'agendado'  },
    ],
  },
  {
    cpf: '987.654.321-00', nome: 'Maria Santos', idade: 33, cidade: 'Rio de Janeiro, RJ',
    programa: 'Apolônias do Bem', dentista: 'Dra. Ana Paula Santos', clinica: 'Clínica Sorria Bem',
    endereco: 'Av. Atlântica, 500 — Copacabana, Rio de Janeiro, RJ', status: 'Ativo',
    sessaoAtual: 1, totalSessoes: 3, procedimento: 'Ortodontia',
    proximaData: '20/05/2025', proximaHora: '09:00',
    historico: [
      { data: '12/05/2025', hora: '09:00', procedimento: 'Avaliação e moldagem',  status: 'concluido' },
      { data: '20/05/2025', hora: '09:00', procedimento: 'Colocação do aparelho', status: 'proximo'   },
      { data: '20/06/2025', hora: '09:00', procedimento: 'Ajuste mensal',         status: 'agendado'  },
    ],
  },
  {
    cpf: '111.222.333-44', nome: 'Pedro Souza', idade: 16, cidade: 'Curitiba, PR',
    programa: 'Dentista do Bem', dentista: 'Dra. Julia Lima', clinica: 'Clinica Sorriso',
    endereco: 'Rua XV de Novembro, 500 - Centro, Curitiba, PR', status: 'Em andamento',
    sessaoAtual: 1, totalSessoes: 3, procedimento: 'Ortodontia',
    proximaData: '25/05/2025', proximaHora: '10:00',
    historico: [
      { data: '20/05/2025', hora: '09:00', procedimento: 'Avaliacao inicial',   status: 'concluido' },
      { data: '25/05/2025', hora: '10:00', procedimento: 'Ortodontia sessao 1', status: 'proximo'   },
      { data: '25/06/2025', hora: '10:00', procedimento: 'Ajuste ortodontico',  status: 'agendado'  },
    ],
  },
  {
    cpf: '222.333.444-55', nome: 'Ana Beatriz Ferreira', idade: 24, cidade: 'Salvador, BA',
    programa: 'Apolônias do Bem', dentista: 'Dr. Marcos Oliveira', clinica: 'Clinica Oral Bahia',
    endereco: 'Av. Tancredo Neves, 1000 - Salvador, BA', status: 'Em andamento',
    sessaoAtual: 3, totalSessoes: 5, procedimento: 'Tratamento de Gengivite',
    proximaData: '22/05/2025', proximaHora: '14:00',
    historico: [
      { data: '01/05/2025', hora: '09:00', procedimento: 'Avaliacao inicial',     status: 'concluido' },
      { data: '08/05/2025', hora: '14:00', procedimento: 'Limpeza profunda',      status: 'concluido' },
      { data: '15/05/2025', hora: '14:00', procedimento: 'Raspagem periodontal',  status: 'concluido' },
      { data: '22/05/2025', hora: '14:00', procedimento: 'Controle de gengivite', status: 'proximo'   },
      { data: '05/06/2025', hora: '14:00', procedimento: 'Alta periodontal',      status: 'agendado'  },
    ],
  },
  {
    cpf: '333.444.555-66', nome: 'Lucas Henrique Costa', idade: 17, cidade: 'Fortaleza, CE',
    programa: 'Dentista do Bem', dentista: 'Dra. Camila Souza', clinica: 'Clinica Dente Sadio',
    endereco: 'Rua Monsenhor Tabosa, 300 - Fortaleza, CE', status: 'Concluido',
    sessaoAtual: 4, totalSessoes: 4, procedimento: 'Restauracao Multipla',
    proximaData: '-', proximaHora: '-',
    historico: [
      { data: '10/04/2025', hora: '08:00', procedimento: 'Avaliacao inicial',      status: 'concluido' },
      { data: '17/04/2025', hora: '08:00', procedimento: 'Restauracao dente 36',   status: 'concluido' },
      { data: '24/04/2025', hora: '08:00', procedimento: 'Restauracao dente 46',   status: 'concluido' },
      { data: '05/05/2025', hora: '08:00', procedimento: 'Acabamento e polimento', status: 'concluido' },
    ],
  },
  {
    cpf: '444.555.666-77', nome: 'Isabela Martins', idade: 38, cidade: 'Belo Horizonte, MG',
    programa: 'Apolônias do Bem', dentista: 'Dr. Rafael Oliveira', clinica: 'Clinica Sorriso BH',
    endereco: 'Av. Afonso Pena, 2000 - Belo Horizonte, MG', status: 'Em andamento',
    sessaoAtual: 2, totalSessoes: 6, procedimento: 'Ortodontia com Aparelho',
    proximaData: '28/05/2025', proximaHora: '16:00',
    historico: [
      { data: '14/05/2025', hora: '16:00', procedimento: 'Moldagem e planejamento', status: 'concluido' },
      { data: '21/05/2025', hora: '16:00', procedimento: 'Colocacao do aparelho',   status: 'concluido' },
      { data: '28/05/2025', hora: '16:00', procedimento: 'Primeiro ajuste',         status: 'proximo'   },
      { data: '28/06/2025', hora: '16:00', procedimento: 'Ajuste mensal',           status: 'agendado'  },
      { data: '28/07/2025', hora: '16:00', procedimento: 'Ajuste mensal',           status: 'agendado'  },
      { data: '28/08/2025', hora: '16:00', procedimento: 'Retirada do aparelho',    status: 'agendado'  },
    ],
  },
  {
    cpf: '555.666.777-88', nome: 'Gabriel Alves Lima', idade: 15, cidade: 'Recife, PE',
    programa: 'Dentista do Bem', dentista: 'Dra. Patricia Nunes', clinica: 'Clinica Oral Recife',
    endereco: 'Rua da Aurora, 700 - Recife, PE', status: 'Em andamento',
    sessaoAtual: 1, totalSessoes: 2, procedimento: 'Extracao de Siso',
    proximaData: '20/05/2025', proximaHora: '11:00',
    historico: [
      { data: '13/05/2025', hora: '11:00', procedimento: 'Avaliacao e raio-x', status: 'concluido' },
      { data: '20/05/2025', hora: '11:00', procedimento: 'Extracao cirurgica', status: 'proximo'   },
    ],
  },
  {
    cpf: '666.777.888-99', nome: 'Sophia Rodrigues', idade: 51, cidade: 'Manaus, AM',
    programa: 'Apolônias do Bem', dentista: 'Dr. Eduardo Castro', clinica: 'Clinica Amazonia Oral',
    endereco: 'Av. Eduardo Ribeiro, 520 - Manaus, AM', status: 'Em andamento',
    sessaoAtual: 2, totalSessoes: 4, procedimento: 'Tratamento de Canal',
    proximaData: '23/05/2025', proximaHora: '09:30',
    historico: [
      { data: '09/05/2025', hora: '09:30', procedimento: 'Avaliacao e diagnostico', status: 'concluido' },
      { data: '16/05/2025', hora: '09:30', procedimento: 'Canal sessao 1',          status: 'concluido' },
      { data: '23/05/2025', hora: '09:30', procedimento: 'Canal sessao 2',          status: 'proximo'   },
      { data: '30/05/2025', hora: '09:30', procedimento: 'Restauracao final',       status: 'agendado'  },
    ],
  },
  {
    cpf: '777.888.999-00', nome: 'Mateus Oliveira Pinto', idade: 11, cidade: 'Porto Alegre, RS',
    programa: 'Dentista do Bem', dentista: 'Dra. Fernanda Lima', clinica: 'Clinica Gaucha Oral',
    endereco: 'Av. Ipiranga, 1500 - Porto Alegre, RS', status: 'Ativo',
    sessaoAtual: 1, totalSessoes: 2, procedimento: 'Selante e Fluor',
    proximaData: '27/05/2025', proximaHora: '08:00',
    historico: [
      { data: '27/05/2025', hora: '08:00', procedimento: 'Aplicacao de selante', status: 'proximo'  },
      { data: '27/06/2025', hora: '08:00', procedimento: 'Aplicacao de fluor',   status: 'agendado' },
    ],
  },
  {
    cpf: '888.999.000-11', nome: 'Julia Caroline Santos', idade: 31, cidade: 'Goiania, GO',
    programa: 'Apolônias do Bem', dentista: 'Dr. Bruno Carvalho', clinica: 'Clinica Central Goias',
    endereco: 'Av. Goias, 900 - Goiania, GO', status: 'Em andamento',
    sessaoAtual: 3, totalSessoes: 4, procedimento: 'Clareamento Dental',
    proximaData: '21/05/2025', proximaHora: '15:00',
    historico: [
      { data: '07/05/2025', hora: '15:00', procedimento: 'Avaliacao e profilaxia',   status: 'concluido' },
      { data: '10/05/2025', hora: '15:00', procedimento: 'Clareamento sessao 1',     status: 'concluido' },
      { data: '17/05/2025', hora: '15:00', procedimento: 'Clareamento sessao 2',     status: 'concluido' },
      { data: '21/05/2025', hora: '15:00', procedimento: 'Clareamento sessao final', status: 'proximo'   },
    ],
  },
]

// ─── PRESERVADO ────────────────────────────────
function buscarNaMock(cpf: string): Paciente | null {
  return MOCK_PACIENTES.find(p => p.cpf === cpf) ?? null
}

function mapearBackend(dados: Record<string, string>): Paciente {
  return {
    cpf:          dados.rgCpf       ?? '',
    nome:         dados.nome        ?? '',
    idade:        0,
    cidade:       '',
    programa:     dados.sexo === 'feminino' ? 'Apolônias do Bem' : 'Dentista do Bem',
    dentista:     'A definir',
    clinica:      'A definir',
    endereco:     '',
    status:       'Aguardando contato',
    sessaoAtual:  0,
    totalSessoes: 0,
    procedimento: dados.necessidade ?? 'A definir',
    proximaData:  'A definir',
    proximaHora:  'A definir',
    historico:    [],
  }
}

// ─── NOVO: helpers de tempo pras mensagens ────
function formatarHora(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function dataCurta(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// ─── TIMELINE (visual TdB, PRESERVADO) ─────
function TimelineItem({ consulta, isLast }: { consulta: Consulta; isLast: boolean }) {
  const config = {
    concluido: { Icon: Check,      bg: 'bg-green-500', text: 'text-green-700', label: 'Concluído', border: 'border-green-200',  cardBg: 'bg-green-50' },
    proximo:   { Icon: ArrowRight, bg: 'bg-[#E88407]', text: 'text-[#9A3412]', label: 'Próximo',   border: 'border-orange-200', cardBg: 'bg-[#FFEDD5]' },
    agendado:  { Icon: Circle,     bg: 'bg-gray-300',  text: 'text-gray-500',  label: 'Agendado',  border: 'border-gray-200',   cardBg: 'bg-gray-50' },
  }
  const c = config[consulta.status]
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center text-white shrink-0`}>
          <c.Icon size={16} strokeWidth={2.5} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
      </div>
      <div className={`flex-1 mb-5 p-4 rounded-xl border ${c.border} ${c.cardBg}`}>
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold text-[#0F172A] text-[14px]">{consulta.procedimento}</p>
          <span className={`text-[11px] font-semibold ${c.text}`}>{c.label}</span>
        </div>
        <p className="text-[#475569] text-[12px]">{consulta.data} às {consulta.hora}</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// NOVO: SEÇÃO DE MENSAGENS
// ═══════════════════════════════════════════════

function SecaoMensagens({ pacienteNome }: { pacienteNome: string }) {
  const [versao, setVersao] = useState(0)
  const [conversaAberta, setConversaAberta] = useState<string | null>(null)
  const [resposta, setResposta] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Filtra conversas onde o nome bate (case-insensitive)
  const minhasConversas = useMemo<Solicitacao[]>(() => {
    return listarSolicitacoes()
      .filter(s => s.nome.toLowerCase() === pacienteNome.toLowerCase())
      .sort((a, b) => b.ultimaAtualizacao.localeCompare(a.ultimaAtualizacao))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteNome, versao])

  const conversa = conversaAberta
    ? minhasConversas.find(c => c.id === conversaAberta)
    : null

  const naoLidas = minhasConversas.filter(c => c.status === 'aguardando-paciente').length

  async function handleResponder() {
    if (!conversa || !resposta.trim()) return
    setEnviando(true)
    try {
      await responderComoPaciente(conversa.id, resposta)
      setResposta('')
      setVersao(v => v + 1)
    } finally {
      setEnviando(false)
    }
  }

  // Sem mensagens — card simples
  if (minhasConversas.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-5 border border-[#E2E8F0]">
        <div className="flex items-center gap-2 mb-3">
          <Inbox size={18} className="text-[#E88407]" strokeWidth={2} />
          <h2 className="font-bold text-[#0F172A] text-[16px]">Minhas mensagens</h2>
        </div>
        <p className="text-[#475569] text-[13px]">
          Você ainda não tem mensagens da equipe Turma do Bem.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-5 border border-[#E2E8F0]">

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Inbox size={18} className="text-[#E88407]" strokeWidth={2} />
          <h2 className="font-bold text-[#0F172A] text-[16px]">Minhas mensagens</h2>
        </div>
        {naoLidas > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#E88407] text-white text-[11px] font-semibold">
            {naoLidas} {naoLidas === 1 ? 'nova' : 'novas'}
          </span>
        )}
      </div>

      {/* Lista de conversas */}
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

      {/* Thread aberto */}
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
              const isPaciente = msg.autor === 'paciente'
              return (
                <div key={msg.id} className={`flex gap-2 ${isPaciente ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
                    isPaciente ? 'bg-[#E88407]' : 'bg-[#0F172A]'
                  }`}>
                    {isPaciente ? 'EU' : 'TDB'}
                  </div>
                  <div className={`max-w-[80%] flex flex-col ${isPaciente ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                      isPaciente
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
                placeholder="Digite sua mensagem..."
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

function SecaoMutiroes({ paciente }: { paciente: Paciente }) {
  const [versao, setVersao] = useState(0)
  const [processando, setProcessando] = useState<string | null>(null)

  const mutiroes = useMemo<Mutirao[]>(() => {
    return listarProximosPorCidade(paciente.cidade)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paciente.cidade, versao])

  async function handleToggle(mutiraoId: string) {
    setProcessando(mutiraoId)
    try {
      if (pacienteEstaConfirmado(mutiraoId, paciente.cpf)) {
        await cancelarPresencaPaciente(mutiraoId, paciente.cpf)
      } else {
        await confirmarPresencaPaciente(mutiraoId, {
          cpf: paciente.cpf,
          nome: paciente.nome,
          cidade: paciente.cidade,
        })
      }
      setVersao((v) => v + 1)
    } finally {
      setProcessando(null)
    }
  }

  if (mutiroes.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-5 border border-[#E2E8F0]">
        <div className="flex items-center gap-2 mb-3">
          <CalendarHeart size={18} className="text-[#E88407]" strokeWidth={2} />
          <h2 className="font-bold text-[#0F172A] text-[16px]">Mutirões na sua cidade</h2>
        </div>
        <p className="text-[#475569] text-[13px]">
          Nenhum mutirão programado em <span className="font-semibold">{paciente.cidade}</span> no momento.
          Volte aqui mais tarde para conferir.
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
          const confirmado = pacienteEstaConfirmado(m.id, paciente.cpf)
          const isProcessing = processando === m.id
          const isApolonia = m.programa === 'Apolônias do Bem'
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
                  <p className="text-[#475569] text-[12px] mt-0.5">{m.local}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isApolonia
                    ? 'bg-[#ECFCCB] text-[#3F6212]'
                    : 'bg-[#FFEDD5] text-[#9A3412]'
                }`}>
                  {m.programa}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[12px] text-[#475569] mb-3">
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} strokeWidth={2} />
                  <span>{new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity size={12} strokeWidth={2} />
                  <span>{m.horario}</span>
                </div>
                {m.endereco && (
                  <div className="flex items-center gap-1.5 col-span-2 text-[11px]">
                    <MapPin size={11} strokeWidth={2} className="shrink-0" />
                    <span className="truncate">{m.endereco}</span>
                  </div>
                )}
              </div>

              {confirmado ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 inline-flex items-center justify-center gap-1.5 bg-green-100 border border-green-300 rounded-lg py-2 text-[12px] text-green-700 font-semibold">
                    <Check size={14} strokeWidth={2.5} />
                    Você confirmou presença
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
                  disabled={isProcessing}
                  className="w-full bg-[#E88407] text-white font-semibold py-2.5 rounded-lg hover:bg-[#D97706] transition-colors text-[13px] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 border-none cursor-pointer"
                >
                  <Check size={14} strokeWidth={2.5} />
                  {isProcessing ? 'Confirmando...' : 'Confirmar presença'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── PAINEL DO PACIENTE (PRESERVADO + 1 linha nova) ──
function PainelPaciente({ paciente, onVoltar }: { paciente: Paciente; onVoltar: () => void }) {
  const progresso = paciente.totalSessoes > 0
    ? Math.round((paciente.sessaoAtual / paciente.totalSessoes) * 100)
    : 0

  return (
    <div className="min-h-screen bg-[#FAFBFD]">

      <header className="bg-gradient-to-br from-[#FFEDD5] via-[#FED7AA] to-[#FDBA74] px-6 py-12 border-b border-orange-200">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-[#E88407] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-md">
            {paciente.nome.charAt(0)}
          </div>
          <h1 className="text-[26px] font-extrabold text-[#9A3412] mb-1">
            Olá, {paciente.nome.split(' ')[0]}!
          </h1>
          <p className="text-[#9A3412]/80 text-[14px]">
            {paciente.programa} · {paciente.cidade || 'Turma do Bem'}
          </p>
        </div>
      </header>

      <section className="py-8 px-6 max-w-2xl mx-auto">

        {/* Seu tratamento */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-5 border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-[#E88407]" strokeWidth={2} />
              <h2 className="font-bold text-[#0F172A] text-[16px]">Seu tratamento</h2>
            </div>
            <span className="text-[12px] font-semibold text-[#E88407] bg-[#FFEDD5] px-3 py-1 rounded-full">
              {paciente.status}
            </span>
          </div>
          <p className="text-[#475569] text-[13px] mb-3">
            {paciente.procedimento}
            {paciente.totalSessoes > 0 && ` — Sessão ${paciente.sessaoAtual} de ${paciente.totalSessoes}`}
          </p>
          {paciente.totalSessoes > 0 && (
            <>
              <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-[#E88407] to-[#F97316] rounded-full transition-all duration-1000"
                  style={{ width: `${progresso}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#94A3B8]">
                <span>Início</span>
                <span className="font-semibold text-[#E88407]">{progresso}% concluído</span>
                <span>Conclusão</span>
              </div>
            </>
          )}
        </div>

        {/* Próximo atendimento */}
        <div className="bg-gradient-to-br from-[#E88407] to-[#F97316] rounded-2xl shadow-md p-6 mb-5 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} strokeWidth={2} />
            <h2 className="font-bold text-[16px]">Próximo atendimento</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/80 text-[11px] uppercase tracking-wide mb-1">Data e hora</p>
              <p className="font-bold text-[18px]">{paciente.proximaData}</p>
              <p className="text-white/80 text-[14px]">às {paciente.proximaHora}</p>
            </div>
            <div>
              <p className="text-white/80 text-[11px] uppercase tracking-wide mb-1">Dentista</p>
              <p className="font-semibold text-[14px]">{paciente.dentista}</p>
            </div>
            <div>
              <p className="text-white/80 text-[11px] uppercase tracking-wide mb-1">Clínica</p>
              <p className="font-semibold text-[14px]">{paciente.clinica}</p>
            </div>
            <div>
              <p className="text-white/80 text-[11px] uppercase tracking-wide mb-1">Procedimento</p>
              <p className="font-semibold text-[14px]">{paciente.procedimento}</p>
            </div>
          </div>
          {paciente.endereco && (
            <div className="mt-4 pt-4 border-t border-white/30">
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin size={12} strokeWidth={2} />
                <p className="text-white/80 text-[11px] uppercase tracking-wide">Endereço</p>
              </div>
              <p className="text-[13px]">{paciente.endereco}</p>
            </div>
          )}
        </div>

        {/* NOVO ↓ — Seção de mensagens da Central */}
        <SecaoMensagens pacienteNome={paciente.nome} />
        <SecaoMutiroes paciente={paciente} />

        {/* Histórico */}
        {paciente.historico.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-5 border border-[#E2E8F0]">
            <div className="flex items-center gap-2 mb-5">
              <ClipboardList size={18} className="text-[#E88407]" strokeWidth={2} />
              <h2 className="font-bold text-[#0F172A] text-[16px]">Histórico de consultas</h2>
            </div>
            {paciente.historico.map((c, i) => (
              <TimelineItem key={i} consulta={c} isLast={i === paciente.historico.length - 1} />
            ))}
          </div>
        )}

        {/* Informações do programa */}
        <div className="bg-[#F8FAFC] rounded-2xl p-5 mb-6 border border-[#E2E8F0]">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-[#475569]" strokeWidth={2} />
            <h2 className="font-bold text-[#0F172A] text-[14px]">Informações do programa</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div>
              <p className="text-[#94A3B8] text-[11px] uppercase tracking-wide">Programa</p>
              <p className="font-semibold text-[#475569]">{paciente.programa}</p>
            </div>
            {paciente.idade > 0 && (
              <div>
                <p className="text-[#94A3B8] text-[11px] uppercase tracking-wide">Idade</p>
                <p className="font-semibold text-[#475569]">{paciente.idade} anos</p>
              </div>
            )}
            {paciente.cidade && (
              <div>
                <p className="text-[#94A3B8] text-[11px] uppercase tracking-wide">Cidade</p>
                <p className="font-semibold text-[#475569]">{paciente.cidade}</p>
              </div>
            )}
            <div>
              <div className="flex items-center gap-1 text-[#94A3B8]">
                <Stethoscope size={11} strokeWidth={2} />
                <p className="text-[11px] uppercase tracking-wide">Dentista</p>
              </div>
              <p className="font-semibold text-[#475569] mt-0.5">{paciente.dentista}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onVoltar}
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

// ─── PRINCIPAL (PRESERVADO 100%) ──────────────
const PortalBeneficiario = () => {
  const { showWarning, minutesLeft, resetTimer } = useSessionTimeout({
    timeoutMinutes: 30,
    warningMinutes: 1,
    storageKey: 'tdb_rgCpf',
  })
  const [paciente,   setPaciente]   = useState<Paciente | null>(null)
  const [carregando, setCarregando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const cpfSalvo = sessionStorage.getItem('tdb_rgCpf')
    console.log('CPF DA SESSAO:', cpfSalvo)

    if (!cpfSalvo) {
      navigate('/meu-atendimento')
      return
    }

    async function carregarDados() {
      try {
        const dados = await solicitacaoService.buscar(cpfSalvo!)
        console.log('DADOS API:', dados)
        if (dados) {
          console.log('DADOS RECEBIDOS:', dados);
          setPaciente(mapearBackend(dados as unknown as Record<string, string>))
          return
        }
      } catch {
        // Backend falhou — usa fallback
      }

      const mock = buscarNaMock(cpfSalvo!)
      if (mock) {
        setPaciente(mock)
      } else {
        navigate('/login')
      }
    }

    carregarDados().finally(() => setCarregando(false))
  }, [navigate])

  function handleVoltar() {
    sessionStorage.removeItem('tdb_cpf')
    navigate('/login')
  }

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

  if (!paciente) return null

  return (
    <>
      {showWarning && (
        <SessionWarning
          minutesLeft={minutesLeft}
          onContinuar={resetTimer}
          onSair={() => {
            sessionStorage.removeItem('tdb_cpf')
            navigate('/login')
          }}
        />
      )}
      <PainelPaciente paciente={paciente} onVoltar={handleVoltar} />
    </>
  )
}

export default PortalBeneficiario;