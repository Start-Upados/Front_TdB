import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// ─── TIPOS ────────────────────────────────────
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

// ─── MOCK DATA ────────────────────────────────
// TODO: substituir por fetch(`${import.meta.env.VITE_API_URL}/api/pacientes/cpf/${cpf}`)
const MOCK_PACIENTES: Paciente[] = [
  {
    cpf:          '123.456.789-00',
    nome:         'João Silva',
    idade:        15,
    cidade:       'São Paulo, SP',
    programa:     'Dentista do Bem',
    dentista:     'Dr. Carlos Mendes',
    clinica:      'Clínica Oral Center',
    endereco:     'Rua das Flores, 123 — Vila Mariana, São Paulo, SP',
    status:       'Em andamento',
    sessaoAtual:  2,
    totalSessoes: 4,
    procedimento: 'Tratamento de Canal',
    proximaData:  '18/05/2025',
    proximaHora:  '14:00',
    historico: [
      { data: '10/05/2025', hora: '09:00', procedimento: 'Avaliação inicial',    status: 'concluido' },
      { data: '15/05/2025', hora: '10:30', procedimento: 'Extração preparatória', status: 'concluido' },
      { data: '18/05/2025', hora: '14:00', procedimento: 'Canal — sessão 1',     status: 'proximo'   },
      { data: '25/05/2025', hora: '14:00', procedimento: 'Restauração final',    status: 'agendado'  },
    ],
  },
  {
    cpf:          '987.654.321-00',
    nome:         'Maria Santos',
    idade:        13,
    cidade:       'Rio de Janeiro, RJ',
    programa:     'Apolônias do Bem',
    dentista:     'Dra. Ana Paula Santos',
    clinica:      'Clínica Sorria Bem',
    endereco:     'Av. Atlântica, 500 — Copacabana, Rio de Janeiro, RJ',
    status:       'Ativo',
    sessaoAtual:  1,
    totalSessoes: 3,
    procedimento: 'Ortodontia',
    proximaData:  '20/05/2025',
    proximaHora:  '09:00',
    historico: [
      { data: '12/05/2025', hora: '09:00', procedimento: 'Avaliação e moldagem',  status: 'concluido' },
      { data: '20/05/2025', hora: '09:00', procedimento: 'Colocação do aparelho', status: 'proximo'   },
      { data: '20/06/2025', hora: '09:00', procedimento: 'Ajuste mensal',         status: 'agendado'  },
    ],
  },
]

// ─── UTILITÁRIOS ──────────────────────────────

function buscarPaciente(cpf: string): Paciente | null {
  // TODO: substituir por API Java quando backend estiver pronto
  return MOCK_PACIENTES.find(p => p.cpf === cpf) ?? null
}

// ─── TIMELINE ITEM ────────────────────────────
function TimelineItem({ consulta, isLast }: { consulta: Consulta; isLast: boolean }) {
  const config = {
    concluido: { icon: '✓', bg: 'bg-green-500',   text: 'text-green-600',  label: 'Concluído',  border: 'border-green-200',  cardBg: 'bg-green-50'   },
    proximo:   { icon: '→', bg: 'bg-blue-600',    text: 'text-blue-600',   label: 'Próximo',    border: 'border-blue-200',   cardBg: 'bg-blue-50'    },
    agendado:  { icon: '○', bg: 'bg-gray-300',    text: 'text-gray-500',   label: 'Agendado',   border: 'border-gray-200',   cardBg: 'bg-gray-50'    },
  }

  const c = config[consulta.status]

  return (
    <div className="flex gap-4">
      {/* Linha vertical + ícone */}
      <div className="flex flex-col items-center">
        <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
          {c.icon}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
      </div>

      {/* Conteúdo */}
      <div className={`flex-1 mb-5 p-4 rounded-xl border ${c.border} ${c.cardBg}`}>
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold text-gray-800 text-[14px]">{consulta.procedimento}</p>
          <span className={`text-[11px] font-semibold ${c.text}`}>{c.label}</span>
        </div>
        <p className="text-gray-500 text-[12px]">
          {consulta.data} às {consulta.hora}
        </p>
      </div>
    </div>
  )
}

// ─── PAINEL DO PACIENTE ───────────────────────
function PainelPaciente({ paciente, onVoltar }: { paciente: Paciente; onVoltar: () => void }) {
  const progresso = Math.round((paciente.sessaoAtual / paciente.totalSessoes) * 100)

  return (
    <div>
      {/* Header */}
      <header className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            {paciente.nome.charAt(0)}
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1">
            Olá, {paciente.nome.split(' ')[0]}! 👋
          </h1>
          <p className="text-blue-300 text-[15px]">
            {paciente.programa} · {paciente.cidade}
          </p>
        </div>
      </header>

      <section className="py-10 px-6 max-w-2xl mx-auto">

        {/* Progresso do tratamento */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 text-[16px]">📊 Seu tratamento</h2>
            <span className="text-[12px] font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {paciente.status}
            </span>
          </div>
          <p className="text-gray-500 text-[13px] mb-3">
            {paciente.procedimento} — Sessão {paciente.sessaoAtual} de {paciente.totalSessoes}
          </p>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-gray-400">
            <span>Início</span>
            <span className="font-semibold text-blue-600">{progresso}% concluído</span>
            <span>Conclusão</span>
          </div>
        </div>

        {/* Próximo atendimento */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-md p-6 mb-5 text-white">
          <h2 className="font-bold text-[16px] mb-4 flex items-center gap-2">
            📅 Próximo atendimento
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-blue-200 text-[11px] uppercase tracking-wide mb-1">Data e hora</p>
              <p className="font-bold text-[18px]">{paciente.proximaData}</p>
              <p className="text-blue-200 text-[14px]">às {paciente.proximaHora}</p>
            </div>
            <div>
              <p className="text-blue-200 text-[11px] uppercase tracking-wide mb-1">Dentista</p>
              <p className="font-semibold text-[14px]">{paciente.dentista}</p>
            </div>
            <div>
              <p className="text-blue-200 text-[11px] uppercase tracking-wide mb-1">Clínica</p>
              <p className="font-semibold text-[14px]">{paciente.clinica}</p>
            </div>
            <div>
              <p className="text-blue-200 text-[11px] uppercase tracking-wide mb-1">Procedimento</p>
              <p className="font-semibold text-[14px]">{paciente.procedimento}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-500">
            <p className="text-blue-200 text-[11px] uppercase tracking-wide mb-1">📍 Endereço</p>
            <p className="text-[13px]">{paciente.endereco}</p>
          </div>
        </div>

        {/* Histórico de consultas */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-5 border border-gray-100">
          <h2 className="font-bold text-gray-800 text-[16px] mb-5">📋 Histórico de consultas</h2>
          {paciente.historico.map((c, i) => (
            <TimelineItem key={i} consulta={c} isLast={i === paciente.historico.length - 1} />
          ))}
        </div>

        {/* Informações do programa */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
          <h2 className="font-bold text-gray-800 text-[14px] mb-3">ℹ️ Informações do programa</h2>
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div>
              <p className="text-gray-400 text-[11px] uppercase tracking-wide">Programa</p>
              <p className="font-semibold text-gray-700">{paciente.programa}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[11px] uppercase tracking-wide">Idade</p>
              <p className="font-semibold text-gray-700">{paciente.idade} anos</p>
            </div>
            <div>
              <p className="text-gray-400 text-[11px] uppercase tracking-wide">Cidade</p>
              <p className="font-semibold text-gray-700">{paciente.cidade}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[11px] uppercase tracking-wide">Dentista</p>
              <p className="font-semibold text-gray-700">{paciente.dentista}</p>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onVoltar}
            className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 cursor-pointer border-none text-[14px]"
          >
            ← Buscar outro paciente
          </button>
          <Link
            to="/FaleConosco"
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 hover:-translate-y-0.5 transition-all duration-200 text-center text-[14px] no-underline"
          >
            Falar com a Turma do Bem
          </Link>
        </div>

      </section>
    </div>
  )
}

// ─── PORTAL DO BENEFICIÁRIO (PRINCIPAL) ───────
const PortalBeneficiario = () => {
  const [paciente,  setPaciente]  = useState<Paciente | null>(null)
  const [carregando, setCarregando] = useState(true)
  const navigate = useNavigate()  // ← adicione esse import no topo

  useEffect(() => {  // ← adicione useEffect no import do topo
    const cpfSalvo = sessionStorage.getItem('tdb_cpf')

    if (!cpfSalvo) {
      // Se não tem CPF salvo, volta para o login
      navigate('/login')
      return
    }

    const resultado = buscarPaciente(cpfSalvo)

    if (resultado) {
      setPaciente(resultado)
    } else {
      navigate('/login')
    }

    setCarregando(false)
  }, [navigate])

  function handleVoltar() {
    sessionStorage.removeItem('tdb_cpf')
    navigate('/login')
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <p className="text-white text-[15px]">Carregando seus dados...</p>
      </div>
    )
  }

  if (!paciente) return null

  return <PainelPaciente paciente={paciente} onVoltar={handleVoltar} />
}


export default PortalBeneficiario;