import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSessionTimeout } from '../../Hooks/useSessionTimeout'
import SessionWarning from '../../Components/SessionWarning/SessionWarning'
import { solicitacaoService } from '../../Services/api'

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

// ─── MOCK DATA (fallback) ─────────────────────
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

// ─── BUSCA NO MOCK ────────────────────────────
function buscarNaMock(cpf: string): Paciente | null {
  return MOCK_PACIENTES.find(p => p.cpf === cpf) ?? null
}

// ─── MAPEAR BACKEND → PACIENTE ────────────────
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

// ─── TIMELINE ITEM ────────────────────────────
function TimelineItem({ consulta, isLast }: { consulta: Consulta; isLast: boolean }) {
  const config = {
    concluido: { icon: '✓', bg: 'bg-green-500', text: 'text-green-600', label: 'Concluído',  border: 'border-green-200', cardBg: 'bg-green-50' },
    proximo:   { icon: '→', bg: 'bg-blue-600',  text: 'text-blue-600',  label: 'Próximo',    border: 'border-blue-200',  cardBg: 'bg-blue-50'  },
    agendado:  { icon: '○', bg: 'bg-gray-300',  text: 'text-gray-500',  label: 'Agendado',   border: 'border-gray-200',  cardBg: 'bg-gray-50'  },
  }
  const c = config[consulta.status]
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
          {c.icon}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
      </div>
      <div className={`flex-1 mb-5 p-4 rounded-xl border ${c.border} ${c.cardBg}`}>
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold text-gray-800 text-[14px]">{consulta.procedimento}</p>
          <span className={`text-[11px] font-semibold ${c.text}`}>{c.label}</span>
        </div>
        <p className="text-gray-500 text-[12px]">{consulta.data} às {consulta.hora}</p>
      </div>
    </div>
  )
}

// ─── PAINEL DO PACIENTE ───────────────────────
function PainelPaciente({ paciente, onVoltar }: { paciente: Paciente; onVoltar: () => void }) {
  const progresso = paciente.totalSessoes > 0
    ? Math.round((paciente.sessaoAtual / paciente.totalSessoes) * 100)
    : 0

  return (
    <div>
      <header className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            {paciente.nome.charAt(0)}
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1">
            Olá, {paciente.nome.split(' ')[0]}! 👋
          </h1>
          <p className="text-blue-300 text-[15px]">
            {paciente.programa} · {paciente.cidade || 'Turma do Bem'}
          </p>
        </div>
      </header>

      <section className="py-10 px-6 max-w-2xl mx-auto">

        <div className="bg-white rounded-2xl shadow-md p-6 mb-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 text-[16px]">📊 Seu tratamento</h2>
            <span className="text-[12px] font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {paciente.status}
            </span>
          </div>
          <p className="text-gray-500 text-[13px] mb-3">
            {paciente.procedimento}
            {paciente.totalSessoes > 0 && ` — Sessão ${paciente.sessaoAtual} de ${paciente.totalSessoes}`}
          </p>
          {paciente.totalSessoes > 0 && (
            <>
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
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-md p-6 mb-5 text-white">
          <h2 className="font-bold text-[16px] mb-4">📅 Próximo atendimento</h2>
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
          {paciente.endereco && (
            <div className="mt-4 pt-4 border-t border-blue-500">
              <p className="text-blue-200 text-[11px] uppercase tracking-wide mb-1">📍 Endereço</p>
              <p className="text-[13px]">{paciente.endereco}</p>
            </div>
          )}
        </div>

        {paciente.historico.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-5 border border-gray-100">
            <h2 className="font-bold text-gray-800 text-[16px] mb-5">📋 Histórico de consultas</h2>
            {paciente.historico.map((c, i) => (
              <TimelineItem key={i} consulta={c} isLast={i === paciente.historico.length - 1} />
            ))}
          </div>
        )}

        <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
          <h2 className="font-bold text-gray-800 text-[14px] mb-3">ℹ️ Informações do programa</h2>
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div>
              <p className="text-gray-400 text-[11px] uppercase tracking-wide">Programa</p>
              <p className="font-semibold text-gray-700">{paciente.programa}</p>
            </div>
            {paciente.idade > 0 && (
              <div>
                <p className="text-gray-400 text-[11px] uppercase tracking-wide">Idade</p>
                <p className="font-semibold text-gray-700">{paciente.idade} anos</p>
              </div>
            )}
            {paciente.cidade && (
              <div>
                <p className="text-gray-400 text-[11px] uppercase tracking-wide">Cidade</p>
                <p className="font-semibold text-gray-700">{paciente.cidade}</p>
              </div>
            )}
            <div>
              <p className="text-gray-400 text-[11px] uppercase tracking-wide">Dentista</p>
              <p className="font-semibold text-gray-700">{paciente.dentista}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onVoltar}
            className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 cursor-pointer border-none text-[14px]"
          >
            Sair
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
  const { showWarning, minutesLeft, resetTimer } = useSessionTimeout({
    timeoutMinutes: 30,
    warningMinutes: 1,
    storageKey: 'tdb_cpf',
  })
  const [paciente,   setPaciente]   = useState<Paciente | null>(null)
  const [carregando, setCarregando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const cpfSalvo = sessionStorage.getItem('tdb_cpf')

    if (!cpfSalvo) {
      navigate('/login')
      return
    }

    async function carregarDados() {
      try {
        // 1. Tenta buscar no backend Java pelo rgCpf
        const dados = await solicitacaoService.buscar(cpfSalvo!)
        if (dados) {
          setPaciente(mapearBackend(dados as unknown as Record<string, string>))
          return
        }
      } catch {
        // Backend falhou — usa fallback
      }

      // 2. Fallback: busca no mock
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
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <p className="text-white text-[15px]">Carregando seus dados...</p>
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