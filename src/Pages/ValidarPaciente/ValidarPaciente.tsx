import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { readSheet, appendSheet } from '../../Services/googleSheets'

// ─── TIPOS ────────────────────────────────────
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

// ─── MOCK DATA ────────────────────────────────
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

// ─── TIMELINE ITEM ────────────────────────────
function TimelineItem({ consulta, isLast }: { consulta: Consulta; isLast: boolean }) {
  const config = {
    concluido: { icon: 'OK', bg: 'bg-green-500', text: 'text-green-700', label: 'Concluido',  border: 'border-green-200', cardBg: 'bg-green-50'  },
    proximo:   { icon: '->',  bg: 'bg-blue-600',  text: 'text-blue-700',  label: 'Proximo',    border: 'border-blue-200',  cardBg: 'bg-blue-50'   },
    agendado:  { icon: 'o',  bg: 'bg-gray-300',  text: 'text-gray-500',  label: 'Agendado',   border: 'border-gray-200',  cardBg: 'bg-gray-50'   },
  }
  const c = config[consulta.status]

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center text-white font-bold text-[10px] shrink-0`}>
          {c.icon}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
      </div>
      <div className={`flex-1 mb-4 p-3 rounded-xl border ${c.border} ${c.cardBg}`}>
        <div className="flex items-center justify-between mb-0.5">
          <p className="font-semibold text-gray-800 text-[13px]">{consulta.procedimento}</p>
          <span className={`text-[10px] font-semibold ${c.text}`}>{c.label}</span>
        </div>
        <p className="text-gray-500 text-[11px]">{consulta.data} as {consulta.hora}</p>
      </div>
    </div>
  )
}

// ─── FICHA DO PACIENTE ────────────────────────
function FichaPaciente({
  paciente,
  onConfirmar,
  onVoltar,
  confirmando,
  confirmado,
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
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] px-6 py-8 text-center">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
            {paciente.nome.charAt(0)}
          </div>
          <h2 className="text-[20px] font-extrabold text-white mb-1">{paciente.nome}</h2>
          <p className="text-blue-300 text-[13px]">{paciente.idade} anos · {paciente.cidade}</p>
          <p className="text-blue-400 text-[12px] mt-1">{paciente.programa}</p>

          {/* Badge validado */}
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/40 rounded-full px-4 py-1.5 mt-3">
            <span className="text-green-400 text-[12px] font-bold">Paciente validado</span>
          </div>
        </div>

        <div className="p-6">

          {/* Protocolo */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
            <p className="text-[10px] text-amber-600 uppercase tracking-wide font-bold mb-0.5">Protocolo</p>
            <p className="text-[16px] font-extrabold text-amber-700">#{paciente.protocolo}</p>
          </div>

          {/* Progresso */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-gray-800 text-[14px]">Tratamento atual</p>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {paciente.status}
              </span>
            </div>
            <p className="text-gray-500 text-[12px] mb-3">
              {paciente.procedimento} — Sessao {paciente.sessaoAtual} de {paciente.totalSessoes}
            </p>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Inicio</span>
              <span className="font-semibold text-blue-600">{progresso}% concluido</span>
              <span>Conclusao</span>
            </div>
          </div>

          {/* Dentista responsavel */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-2">Dentista responsável</p>
            <p className="font-semibold text-gray-800 text-[14px]">{paciente.dentista}</p>
            <p className="text-gray-500 text-[12px]">{paciente.clinica}</p>
          </div>

          {/* Historico */}
          <div className="mb-5">
            <p className="font-bold text-gray-800 text-[14px] mb-3">Histórico de consultas</p>
            {paciente.historico.map((c, i) => (
              <TimelineItem key={i} consulta={c} isLast={i === paciente.historico.length - 1} />
            ))}
          </div>

          {/* Confirmacao */}
          {confirmado ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mb-4">
              <p className="text-green-600 font-bold text-[15px] mb-1">Atendimento confirmado!</p>
              <p className="text-green-500 text-[12px]">Registrado com sucesso no histórico da ONG.</p>
            </div>
          ) : (
            <button
              onClick={onConfirmar}
              disabled={confirmando}
              className="w-full bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none text-[14px] mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {confirmando ? 'Registrando...' : 'Confirmar Atendimento'}
            </button>
          )}

          <button
            onClick={onVoltar}
            className="w-full bg-gray-100 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer border-none text-[14px]"
          >
            Escanear outro paciente
          </button>

        </div>
      </div>
    </div>
  )
}

// ─── TELA DE BUSCA ────────────────────────────
function TelaBusca({
  onEncontrado,
  protocoloInicial,
}: {
  onEncontrado:     (p: Paciente) => void
  protocoloInicial: string
}) {
  const [protocolo,  setProtocolo]  = useState(protocoloInicial)
  const [buscando,   setBuscando]   = useState(false)
  const [naoAchado,  setNaoAchado]  = useState(false)

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
      <div className="bg-blue-600 border border-amber-400 rounded-2xl p-8 shadow-2xl">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-amber-400 mb-4 bg-[#07111E]/40">
            <span className="text-2xl">🦷</span>
          </div>
          <h1 className="text-[20px] font-bold text-amber-400">Validar Paciente</h1>
          <p className="text-white/60 text-[12px] mt-1">Digite ou escaneie o protocolo do paciente</p>
        </div>

        <form onSubmit={handleBuscar} className="flex flex-col gap-4">

          {/* Campo protocolo */}
          <div>
            <label className="block text-[11px] text-white font-semibold mb-1.5 uppercase tracking-[0.6px]">
              Numero do protocolo
            </label>
            <input
              type="text"
              value={protocolo}
              onChange={e => { setProtocolo(e.target.value.toUpperCase()); setNaoAchado(false) }}
              placeholder="TDB-2026-0000"
              className="w-full bg-[#07111E] border border-[rgba(0,212,170,0.15)] text-[#E8F4FD] placeholder-[#3D6A85] rounded-lg px-4 py-3 text-[14px] outline-none focus:border-[#00D4AA] transition-colors duration-200 font-mono tracking-wider"
            />
          </div>

          {/* Erro */}
          {naoAchado && (
            <div className="flex items-start gap-2 bg-[rgba(255,71,87,0.08)] border border-[rgba(255,71,87,0.25)] text-[#FF4757] text-[12px] px-4 py-3 rounded-lg">
              <span className="shrink-0">!</span>
              <div>
                <p className="font-semibold">Protocolo não encontrado</p>
                <p className="text-[11px] mt-0.5 opacity-80">Verifique o número e tente novamente.</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!protocolo.trim() || buscando}
            className="w-full bg-amber-400 text-[#07111E] font-bold py-3 rounded-lg hover:bg-amber-500 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buscando ? 'Buscando...' : 'Buscar paciente'}
          </button>

        </form>

        {/* Info */}
        <div className="mt-5 p-4 bg-[#07111E]/30 border border-[rgba(0,212,170,0.2)] rounded-xl">
          <p className="text-[11px] text-[#00D4AA] font-bold uppercase tracking-wide mb-2">Como usar</p>
          <div className="flex flex-col gap-1.5 text-[12px] text-white/60">
            <p>1. Escaneie o QR Code da carteirinha do paciente</p>
            <p>2. O protocolo será preenchido automaticamente</p>
            <p>3. Ou digite manualmente o número do protocolo</p>
          </div>
        </div>

      </div>

      <p className="text-center mt-5 text-[13px]">
        <Link to="/login" className="text-[#7EB3CE] hover:text-amber-400 transition-colors">
          Voltar ao login
        </Link>
      </p>
    </div>
  )
}

// ─── VALIDAR PACIENTE (PRINCIPAL) ─────────────
export default function ValidarPaciente() {
  const [searchParams]                  = useSearchParams()
  const [paciente,    setPaciente]      = useState<Paciente | null>(null)
  const [confirmando, setConfirmando]   = useState(false)
  const [confirmado,  setConfirmado]    = useState(false)

  // Lê protocolo da URL se vier do QR Code
  const protocoloUrl = searchParams.get('protocolo') ?? ''

  // Se veio protocolo pela URL, busca automaticamente
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
    <div className="min-h-screen bg-[#07111E] flex items-center justify-center p-4">
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