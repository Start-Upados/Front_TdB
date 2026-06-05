import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Smile, ShieldCheck, QrCode, Stethoscope, ClipboardList,
  CheckCircle2, ArrowLeft, Check, ArrowRight, Circle, AlertCircle,
} from 'lucide-react'
import { readSheet, appendSheet } from '../../Services/googleSheets'


interface Consulta {
  data:         string
  hora:         string
  procedimento: string
  status:       'concluido' | 'proximo' | 'agendado'
}

interface Paciente {
  protocolo:     string
  cpf:           string
  nome:          string
  idade:         number
  cidade:        string
  programa:      string
  dentista:      string
  clinica:       string
  status:        string
  sessaoAtual:   number
  totalSessoes:  number
  procedimento:  string
  historico:     Consulta[]
}

// ─── MOCK DATA ──────────────────────── (preservado, 2 pacientes)
// TODO: substituir por fetch(`${import.meta.env.VITE_API_URL}/api/pacientes/protocolo/${protocolo}`)
const MOCK_PACIENTES: Paciente[] = [
  {
    protocolo:    'TDB-2026-3118',
    cpf:          '123.456.789-00',
    nome:         'Joao Silva',
    idade:        15,
    cidade:       'Sao Paulo, SP',
    programa:     'Dentista do Bem',
    dentista:     'Dr. Carlos Mendes',
    clinica:      'Clinica Oral Center',
    status:       'Em andamento',
    sessaoAtual:  2,
    totalSessoes: 4,
    procedimento: 'Tratamento de Canal',
    historico: [
      { data: '10/05/2025', hora: '09:00', procedimento: 'Avaliacao inicial',     status: 'concluido' },
      { data: '15/05/2025', hora: '10:30', procedimento: 'Extracao preparatoria', status: 'concluido' },
      { data: '18/05/2025', hora: '14:00', procedimento: 'Canal - sessao 1',      status: 'proximo'   },
      { data: '25/05/2025', hora: '14:00', procedimento: 'Restauracao final',     status: 'agendado'  },
    ],
  },
  {
    protocolo:    'TDB-2026-9616',
    cpf:          '987.654.321-00',
    nome:         'Maria Santos',
    idade:        13,
    cidade:       'Rio de Janeiro, RJ',
    programa:     'Apolônias do Bem',
    dentista:     'Dra. Ana Paula Santos',
    clinica:      'Clinica Sorria Bem',
    status:       'Ativo',
    sessaoAtual:  1,
    totalSessoes: 3,
    procedimento: 'Ortodontia',
    historico: [
      { data: '12/05/2025', hora: '09:00', procedimento: 'Avaliacao e moldagem',  status: 'concluido' },
      { data: '20/05/2025', hora: '09:00', procedimento: 'Colocacao do aparelho', status: 'proximo'   },
      { data: '20/06/2025', hora: '09:00', procedimento: 'Ajuste mensal',         status: 'agendado'  },
    ],
  },
]

function buscarPorProtocolo(protocolo: string): Paciente | null {
  return MOCK_PACIENTES.find(
    p => p.protocolo.toLowerCase() === protocolo.toLowerCase()
  ) ?? null
}


// ─── TIMELINE (visual TdB) ───────────────────
function TimelineItem({ consulta, isLast }: { consulta: Consulta; isLast: boolean }) {
  const config = {
    concluido: { Icon: Check,      bg: 'bg-green-500', text: 'text-green-700', label: 'Concluído', border: 'border-green-200',  cardBg: 'bg-green-50' },
    proximo:   { Icon: ArrowRight, bg: 'bg-[#E88407]', text: 'text-[#9A3412]', label: 'Próximo',   border: 'border-orange-200', cardBg: 'bg-[#FFEDD5]' },
    agendado:  { Icon: Circle,     bg: 'bg-gray-300',  text: 'text-gray-500',  label: 'Agendado',  border: 'border-gray-200',   cardBg: 'bg-gray-50' },
  }
  const c = config[consulta.status]

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center text-white shrink-0`}>
          <c.Icon size={14} strokeWidth={2.5} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
      </div>
      <div className={`flex-1 mb-4 p-3 rounded-xl border ${c.border} ${c.cardBg}`}>
        <div className="flex items-center justify-between mb-0.5">
          <p className="font-semibold text-[#0F172A] text-[13px]">{consulta.procedimento}</p>
          <span className={`text-[10px] font-semibold ${c.text}`}>{c.label}</span>
        </div>
        <p className="text-[#475569] text-[11px]">{consulta.data} às {consulta.hora}</p>
      </div>
    </div>
  )
}

// ─── FICHA DO PACIENTE (visual TdB) ───────────
function FichaPaciente({
  paciente, onConfirmar, onVoltar, confirmando, confirmado,
}: {
  paciente:    Paciente
  onConfirmar: () => void
  onVoltar:    () => void
  confirmando: boolean
  confirmado:  boolean
}) {
  const progresso = Math.round((paciente.sessaoAtual / paciente.totalSessoes) * 100)

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">

        {/* Header laranja TdB */}
        <div className="bg-gradient-to-br from-[#FFEDD5] via-[#FED7AA] to-[#FDBA74] px-6 py-8 text-center border-b border-orange-200">
          <div className="w-16 h-16 rounded-full bg-[#E88407] flex items-center justify-center text-white text-xl font-bold mx-auto mb-3 shadow-md">
            {paciente.nome.charAt(0)}
          </div>
          <h2 className="text-[20px] font-extrabold text-[#9A3412] mb-1">{paciente.nome}</h2>
          <p className="text-[#9A3412]/80 text-[13px]">{paciente.idade} anos · {paciente.cidade}</p>
          <p className="text-[#9A3412]/70 text-[12px] mt-1">{paciente.programa}</p>

          <div className="inline-flex items-center gap-1.5 bg-green-100 border border-green-300 rounded-full px-4 py-1.5 mt-3">
            <ShieldCheck size={14} className="text-green-700" strokeWidth={2.5} />
            <span className="text-green-700 text-[12px] font-bold">Paciente validado</span>
          </div>
        </div>

        <div className="p-6">

          {/* Protocolo — destaque laranja TdB */}
          <div className="bg-[#FFEDD5] border border-orange-200 rounded-xl px-4 py-3 mb-5">
            <p className="text-[10px] text-[#9A3412] uppercase tracking-wide font-bold mb-0.5">Protocolo</p>
            <p className="text-[16px] font-extrabold text-[#E88407] font-mono">#{paciente.protocolo}</p>
          </div>

          {/* Tratamento atual */}
          <div className="bg-[#F8FAFC] rounded-xl p-4 mb-5 border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-[#0F172A] text-[14px]">Tratamento atual</p>
              <span className="text-[11px] font-semibold text-[#E88407] bg-[#FFEDD5] px-2 py-0.5 rounded-full">
                {paciente.status}
              </span>
            </div>
            <p className="text-[#475569] text-[12px] mb-3">
              {paciente.procedimento} — Sessão {paciente.sessaoAtual} de {paciente.totalSessoes}
            </p>
            <div className="h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-gradient-to-r from-[#E88407] to-[#F97316] rounded-full"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#94A3B8]">
              <span>Início</span>
              <span className="font-semibold text-[#E88407]">{progresso}% concluído</span>
              <span>Conclusão</span>
            </div>
          </div>

          {/* Dentista responsável */}
          <div className="bg-[#F8FAFC] rounded-xl p-4 mb-5 border border-[#E2E8F0]">
            <div className="flex items-center gap-1.5 mb-2">
              <Stethoscope size={12} className="text-[#94A3B8]" strokeWidth={2} />
              <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide font-bold">Dentista responsável</p>
            </div>
            <p className="font-semibold text-[#0F172A] text-[14px]">{paciente.dentista}</p>
            <p className="text-[#475569] text-[12px]">{paciente.clinica}</p>
          </div>

          {/* Histórico */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-3">
              <ClipboardList size={14} className="text-[#E88407]" strokeWidth={2} />
              <p className="font-bold text-[#0F172A] text-[14px]">Histórico de consultas</p>
            </div>
            {paciente.historico.map((c, i) => (
              <TimelineItem key={i} consulta={c} isLast={i === paciente.historico.length - 1} />
            ))}
          </div>

          {/* Confirmação */}
          {confirmado ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mb-4">
              <CheckCircle2 size={24} className="text-green-600 mx-auto mb-2" strokeWidth={2} />
              <p className="text-green-700 font-bold text-[15px] mb-1">Atendimento confirmado!</p>
              <p className="text-green-600 text-[12px]">Registrado com sucesso no histórico da ONG.</p>
            </div>
          ) : (
            <button
              onClick={onConfirmar}
              disabled={confirmando}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none text-[14px] mb-3 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} strokeWidth={2.5} />
              {confirmando ? 'Registrando...' : 'Confirmar atendimento'}
            </button>
          )}

          <button
            onClick={onVoltar}
            className="w-full bg-white border border-[#E2E8F0] text-[#475569] font-semibold py-3 rounded-xl hover:bg-[#F8FAFC] transition-colors cursor-pointer text-[14px] inline-flex items-center justify-center gap-2"
          >
            <QrCode size={16} strokeWidth={2} />
            Escanear outro paciente
          </button>

        </div>
      </div>
    </div>
  )
}

// ─── TELA DE BUSCA (visual TdB) ───────────────
function TelaBusca({
  onEncontrado, protocoloInicial,
}: {
  onEncontrado:     (p: Paciente) => void
  protocoloInicial: string
}) {
  const [protocolo,  setProtocolo]  = useState(protocoloInicial)
  const [buscando,   setBuscando]   = useState(false)
  const [naoAchado,  setNaoAchado]  = useState(false)

  // LÓGICA 100% PRESERVADA: readSheet com mesmos índices [16][6][0]..., fallback mock.
  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault()
    if (!protocolo.trim()) return

    setBuscando(true)
    setNaoAchado(false)

    try {
        // 1. Busca no Google Sheets primeiro
        const rows = await readSheet('Pacientes!A:Q')
        const encontrado = rows.slice(1).find(r => r[16] === protocolo.trim())

        if (encontrado) {
            onEncontrado({
            protocolo:    encontrado[16] ?? '',
            cpf:          encontrado[6]  ?? '',
            nome:         encontrado[0]  ?? '',
            idade:        Number(encontrado[1]) || 0,
            cidade:       encontrado[2]  ?? '',
            programa:     encontrado[3]  ?? '',
            dentista:     encontrado[7]  ?? 'A definir',
            clinica:      encontrado[10] ?? 'A definir',
            status:       encontrado[4]  ?? 'Aguardando',
            sessaoAtual:  Number(encontrado[12]) || 0,
            totalSessoes: Number(encontrado[13]) || 0,
            procedimento: encontrado[14] ?? '',
            historico:    [],
        })
        return
        }

        // 2. Não achou no Sheets, tenta no MOCK
        const mock = buscarPorProtocolo(protocolo.trim())
        if (mock) {
            onEncontrado(mock)
            return
        }

        // 3. Não encontrou em nenhum lugar
        setNaoAchado(true)

    } catch {
        // 4. Se Sheets falhar, tenta no MOCK
        const mock = buscarPorProtocolo(protocolo.trim())
        if (mock) {
            onEncontrado(mock)
        } else {
            setNaoAchado(true)
        }
    } finally {
    setBuscando(false)
  }
}

  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm">

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFEDD5] border-2 border-[#E88407] mb-4">
            <Smile size={28} className="text-[#E88407]" strokeWidth={2} />
          </div>
          <h1 className="text-[20px] font-bold text-[#0F172A]">Validar paciente</h1>
          <p className="text-[#475569] text-[12px] mt-1">Digite ou escaneie o protocolo do paciente</p>
        </div>

        <form onSubmit={handleBuscar} className="flex flex-col gap-4">

          <div>
            <label className="block text-[11px] text-[#475569] font-semibold mb-1.5 uppercase tracking-[0.6px]">
              Número do protocolo
            </label>
            <input
              type="text"
              value={protocolo}
              onChange={e => { setProtocolo(e.target.value.toUpperCase()); setNaoAchado(false) }}
              placeholder="TDB-2026-0000"
              className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-lg px-4 py-3 text-[14px] outline-none focus:border-[#E88407] focus:ring-2 focus:ring-[#E88407]/15 transition-all duration-200 font-mono tracking-wider"
            />
          </div>

          {naoAchado && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-[12px] px-4 py-3 rounded-lg">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Protocolo não encontrado</p>
                <p className="text-[11px] mt-0.5 opacity-80">Verifique o número e tente novamente.</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!protocolo.trim() || buscando}
            className="w-full bg-[#E88407] text-white font-bold py-3 rounded-xl hover:bg-[#D97706] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buscando ? 'Buscando...' : 'Buscar paciente'}
          </button>

        </form>

        <div className="mt-5 p-4 bg-[#FFEDD5]/40 border border-orange-200 rounded-xl">
          <div className="flex items-center gap-1.5 mb-2">
            <QrCode size={14} className="text-[#E88407]" strokeWidth={2} />
            <p className="text-[11px] text-[#9A3412] font-bold uppercase tracking-wide">Como usar</p>
          </div>
          <div className="flex flex-col gap-1.5 text-[12px] text-[#9A3412]/80">
            <p>1. Escaneie o QR Code da carteirinha do paciente</p>
            <p>2. O protocolo será preenchido automaticamente</p>
            <p>3. Ou digite manualmente o número do protocolo</p>
          </div>
        </div>

      </div>

      <p className="text-center mt-5 text-[13px]">
        <Link
          to="/login"
          className="text-[#E88407] hover:underline transition-colors inline-flex items-center gap-1.5 font-medium"
        >
          <ArrowLeft size={14} />
          Voltar ao login
        </Link>
      </p>
    </div>
  )
}

// ─── VALIDAR PACIENTE (PRINCIPAL) ─────────────
// LÓGICA 100% PRESERVADA: useSearchParams, useEffect, appendSheet com mesmos campos.
export default function ValidarPaciente() {
  const [searchParams]                  = useSearchParams()
  const [paciente,    setPaciente]      = useState<Paciente | null>(null)
  const [confirmando, setConfirmando]   = useState(false)
  const [confirmado,  setConfirmado]    = useState(false)

  const protocoloUrl = searchParams.get('protocolo') ?? ''

  useEffect(() => {
    if (protocoloUrl) {
      const resultado = buscarPorProtocolo(protocoloUrl)
      if (resultado) setPaciente(resultado)
    }
  }, [protocoloUrl])

  async function handleConfirmar() {
    if (!paciente) return
    setConfirmando(true)

    const agora   = new Date()
    const dataStr = agora.toLocaleDateString('pt-BR')
    const horaStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    try {
      await appendSheet('Atendimentos!A:H', [[
        paciente.protocolo,      // Protocolo
        paciente.nome,           // Paciente
        paciente.procedimento,   // Procedimento
        paciente.dentista,       // Dentista
        paciente.clinica,        // Clinica
        'Realizado',             // Status
        dataStr,                 // Data
        horaStr,                 // Hora
      ]])
      setConfirmado(true)
    } catch (err) {
      console.error('Erro ao confirmar:', err)
      alert('Erro ao registrar. Tente novamente.')
    } finally {
      setConfirmando(false)
    }
  }

  function handleVoltar() {
    setPaciente(null)
    setConfirmado(false)
  }

  return (
    <div className="min-h-screen bg-[#FAFBFD] flex items-center justify-center p-4">
      {paciente ? (
        <FichaPaciente
          paciente={paciente}
          onConfirmar={handleConfirmar}
          onVoltar={handleVoltar}
          confirmando={confirmando}
          confirmado={confirmado}
        />
      ) : (
        <TelaBusca
          onEncontrado={setPaciente}
          protocoloInicial={protocoloUrl}
        />
      )}
    </div>
  )
}