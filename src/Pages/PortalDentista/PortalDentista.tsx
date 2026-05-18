import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

//  TIPOS //
interface Atendimento {
  data:         string
  hora:         string
  paciente:     string
  idade:        number
  procedimento: string
  status:       'agendado' | 'proximo' | 'concluido'
}

interface Dentista {
  nome:              string
  //cidade:            string
  rg_cpg:            string
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
  //cidade:            string
  //clinica:           string
  //endereco:          string  
  //totalPacientes:    number
  //programa:          string
  proximosAtend:     Atendimento[]
  //historicoRecente:  Atendimento[]
}


// TODO: substituir por fetch(`${import.meta.env.VITE_API_URL}/api/dentistas/${cro}`) -> Back Java + Oracle
//  MOCK DATA //

const MOCK_DENTISTAS: Dentista[] = [
  {
    cro:                'CRO-SP-12345',
    nome:               'Dr. Carlos Mendes',
    //cidade:             'Sao Paulo, SP',
    rg_cpg:             '12.345.678-9',
    telefone:           '(11) 99999-1111',
    especializacao:     'Ortodontia e Clinico Geral',
    email:              'carlos.mendes@email.com',
    senha:              'carlos123',
    cep:                '04178000',
    numero_consultorio: '123',
    n_atendimentos:     234,
    avaliacao:          4.8,
    status:             'Ativo',
    proximosAtend: [
      { data: '17/05/2025', hora: '09:00', paciente: 'Joao Silva',           idade: 15, procedimento: 'Canal sessao 2',           status: 'proximo'  },
      { data: '17/05/2025', hora: '10:30', paciente: 'Pedro Souza',          idade: 16, procedimento: 'Ortodontia sessao 1',      status: 'agendado' },
      { data: '18/05/2025', hora: '14:00', paciente: 'Gabriel Alves',        idade: 15, procedimento: 'Extracao cirurgica',       status: 'agendado' },
      { data: '20/05/2025', hora: '09:00', paciente: 'Lucas Henrique',       idade: 17, procedimento: 'Restauracao dente 46',     status: 'agendado' },
      { data: '22/05/2025', hora: '11:00', paciente: 'Julia Caroline',       idade: 16, procedimento: 'Clareamento sessao final', status: 'agendado' },
    ],
  },
  {
    cro:                'CRO-RJ-67890',
    nome:               'Dra. Ana Paula Santos',
    //cidade:             'Rio de Janeiro, RJ',
    rg_cpg:             '98.765.432-1',
    telefone:           '(21) 99999-2222',
    especializacao:     'Pediatria e Ortodontia',
    email:              'ana.paula@email.com',
    senha:              'ana123',
    cep:                '22010000',
    numero_consultorio: '500',
    n_atendimentos:     247,
    avaliacao:          4.9,
    status:             'Ativo',
    proximosAtend: [
      { data: '20/05/2025', hora: '09:00', paciente: 'Maria Santos',         idade: 13, procedimento: 'Colocacao do aparelho',    status: 'proximo'  },
      { data: '21/05/2025', hora: '10:00', paciente: 'Sofia Lima',           idade: 14, procedimento: 'Avaliacao inicial',        status: 'agendado' },
      { data: '23/05/2025', hora: '14:00', paciente: 'Rafael Costa',         idade: 15, procedimento: 'Restauracao dente 16',    status: 'agendado' },
    ],
  },
  {
    cro:                'CRO-MG-11111',
    nome:               'Dr. Rafael Oliveira',
    //cidade:             'Belo Horizonte, MG',
    rg_cpg:             '11.111.111-1',
    telefone:           '(31) 99999-3333',
    especializacao:     'Periodontia e Clinico Geral',
    email:              'rafael.oliveira@email.com',
    senha:              'rafael123',
    cep:                '30130010',
    numero_consultorio: '2000',
    n_atendimentos:     198,
    avaliacao:          4.7,
    status:             'Ativo',
    proximosAtend: [
      { data: '19/05/2025', hora: '08:00', paciente: 'Isabela Martins',      idade: 12, procedimento: 'Primeiro ajuste ortodontico', status: 'proximo'  },
      { data: '21/05/2025', hora: '10:00', paciente: 'Thiago Rocha',         idade: 15, procedimento: 'Avaliacao inicial',           status: 'agendado' },
      { data: '23/05/2025', hora: '14:00', paciente: 'Leticia Alves',        idade: 13, procedimento: 'Restauracao dente 26',        status: 'agendado' },
      { data: '26/05/2025', hora: '09:00', paciente: 'Vitor Hugo Lima',      idade: 16, procedimento: 'Extracao de siso',            status: 'agendado' },
    ],
  },
  {
    cro:                'CRO-RS-22222',
    nome:               'Dra. Juliana Costa',
    //cidade:             'Porto Alegre, RS',
    rg_cpg:             '22.222.222-2',
    telefone:           '(51) 99999-4444',
    especializacao:     'Endodontia e Pediatria',
    email:              'juliana.costa@email.com',
    senha:              'juliana123',
    cep:                '90160093',
    numero_consultorio: '1500',
    n_atendimentos:     187,
    avaliacao:          4.8,
    status:             'Ativo',
    proximosAtend: [
      { data: '20/05/2025', hora: '08:00', paciente: 'Mateus Oliveira',      idade: 11, procedimento: 'Aplicacao de selante',       status: 'proximo'  },
      { data: '22/05/2025', hora: '09:00', paciente: 'Bianca Ferreira',      idade: 14, procedimento: 'Canal sessao 1',             status: 'agendado' },
      { data: '27/05/2025', hora: '10:00', paciente: 'Diego Monteiro',       idade: 13, procedimento: 'Avaliacao inicial',          status: 'agendado' },
    ],
  },
  {
    cro:                'CRO-BA-33333',
    nome:               'Dr. Marcelo Pereira',
    //cidade:             'Salvador, BA',
    rg_cpg:             '33.333.333-3',
    telefone:           '(71) 99999-5555',
    especializacao:     'Cirurgia Buco-Maxilo-Facial',
    email:              'marcelo.pereira@email.com',
    senha:              'marcelo123',
    cep:                '41820021',
    numero_consultorio: '1000',
    n_atendimentos:     176,
    avaliacao:          4.6,
    status:             'Ativo',
    proximosAtend: [
      { data: '21/05/2025', hora: '07:00', paciente: 'Ana Beatriz',          idade: 14, procedimento: 'Alta periodontal',           status: 'proximo'  },
      { data: '23/05/2025', hora: '08:00', paciente: 'Rodrigo Santos',       idade: 16, procedimento: 'Extracao de siso superior',  status: 'agendado' },
      { data: '28/05/2025', hora: '07:00', paciente: 'Patricia Lima',        idade: 15, procedimento: 'Cirurgia de frenulo',        status: 'agendado' },
    ],
  },
  {
    cro:                'CRO-CE-44444',
    nome:               'Dra. Camila Souza',
    //cidade:             'Fortaleza, CE',
    rg_cpg:             '44.444.444-4',
    telefone:           '(85) 99999-6666',
    especializacao:     'Dentistica e Estetica',
    email:              'camila.souza@email.com',
    senha:              'camila123',
    cep:                '60160110',
    numero_consultorio: '300',
    n_atendimentos:     165,
    avaliacao:          4.7,
    status:             'Ativo',
    proximosAtend: [
      { data: '21/05/2025', hora: '15:00', paciente: 'Julia Caroline',       idade: 16, procedimento: 'Clareamento sessao final',   status: 'proximo'  },
      { data: '24/05/2025', hora: '14:00', paciente: 'Aline Barbosa',        idade: 14, procedimento: 'Restauracao estetica',       status: 'agendado' },
      { data: '28/05/2025', hora: '15:00', paciente: 'Gustavo Campos',       idade: 15, procedimento: 'Avaliacao estetica',         status: 'agendado' },
    ],
  },
  {
    cro:                'CRO-PR-55555',
    nome:               'Dr. Fernando Gomes',
    //cidade:             'Curitiba, PR',
    rg_cpg:             '55.555.555-5',
    telefone:           '(41) 99999-7777',
    especializacao:     'Ortodontia e Implantodontia',
    email:              'fernando.gomes@email.com',
    senha:              'fernando123',
    cep:                '80020080',
    numero_consultorio: '800',
    n_atendimentos:     143,
    avaliacao:          4.9,
    status:             'Ativo',
    proximosAtend: [
      { data: '22/05/2025', hora: '09:00', paciente: 'Pedro Souza',          idade: 16, procedimento: 'Ortodontia sessao 1',        status: 'proximo'  },
      { data: '25/05/2025', hora: '10:00', paciente: 'Beatriz Cunha',        idade: 14, procedimento: 'Moldagem ortodontica',       status: 'agendado' },
      { data: '29/05/2025', hora: '09:00', paciente: 'Samuel Rocha',         idade: 13, procedimento: 'Avaliacao para aparelho',    status: 'agendado' },
    ],
  },
  {
    cro:                'CRO-PE-66666',
    nome:               'Dra. Patricia Nunes',
    //cidade:             'Recife, PE',
    rg_cpg:             '66.666.666-6',
    telefone:           '(81) 99999-8888',
    especializacao:     'Cirurgia e Traumatologia',
    email:              'patricia.nunes@email.com',
    senha:              'patricia123',
    cep:                '50050540',
    numero_consultorio: '700',
    n_atendimentos:     134,
    avaliacao:          4.7,
    status:             'Ativo',
    proximosAtend: [
      { data: '20/05/2025', hora: '11:00', paciente: 'Gabriel Alves',        idade: 15, procedimento: 'Extracao cirurgica',         status: 'proximo'  },
      { data: '24/05/2025', hora: '10:00', paciente: 'Vanessa Lima',         idade: 14, procedimento: 'Avaliacao cirurgica',        status: 'agendado' },
      { data: '27/05/2025', hora: '11:00', paciente: 'Davi Santos',          idade: 16, procedimento: 'Extracao de siso',           status: 'agendado' },
    ],
  },
  {
    cro:                'CRO-AM-77777',
    nome:               'Dr. Eduardo Castro',
    //cidade:             'Manaus, AM',
    rg_cpg:             '77.777.777-7',
    telefone:           '(92) 99999-9999',
    especializacao:     'Endodontia Avancada',
    email:              'eduardo.castro@email.com',
    senha:              'eduardo123',
    cep:                '69010060',
    numero_consultorio: '520',
    n_atendimentos:     112,
    avaliacao:          4.6,
    status:             'Ativo',
    proximosAtend: [
      { data: '23/05/2025', hora: '09:30', paciente: 'Sophia Rodrigues',     idade: 13, procedimento: 'Canal sessao 2',             status: 'proximo'  },
      { data: '26/05/2025', hora: '10:00', paciente: 'Emilly Fonseca',       idade: 14, procedimento: 'Avaliacao endodontica',      status: 'agendado' },
      { data: '30/05/2025', hora: '09:30', paciente: 'Sophia Rodrigues',     idade: 13, procedimento: 'Restauracao final',          status: 'agendado' },
    ],
  },
  {
    cro:                'CRO-GO-88888',
    nome:               'Dr. Bruno Carvalho',
    //cidade:             'Goiania, GO',
    rg_cpg:             '88.888.888-8',
    telefone:           '(62) 99999-0000',
    especializacao:     'Dentistica e Clinico Geral',
    email:              'bruno.carvalho@email.com',
    senha:              'bruno123',
    cep:                '74015010',
    numero_consultorio: '900',
    n_atendimentos:     98,
    avaliacao:          4.8,
    status:             'Ativo',
    proximosAtend: [
      { data: '21/05/2025', hora: '15:00', paciente: 'Julia Caroline',       idade: 16, procedimento: 'Clareamento sessao final',   status: 'proximo'  },
      { data: '25/05/2025', hora: '14:00', paciente: 'Nicolas Alves',        idade: 15, procedimento: 'Restauracao multipla',      status: 'agendado' },
      { data: '28/05/2025', hora: '15:00', paciente: 'Heloisa Barros',       idade: 11, procedimento: 'Avaliacao inicial',         status: 'agendado' },
    ],
  },
]

//  BUSCA //
function buscarDentista(cro: string): Dentista | null {
  return MOCK_DENTISTAS.find(d => d.cro === cro) ?? null
}

//  ATENDIMENTO ITEM //
function AtendimentoCard({ atend, tipo }: { atend: Atendimento; tipo: 'proximo' | 'historico' }) {
  const isProximo = tipo === 'proximo'

  const statusConfig = {
    proximo:   { cls: 'bg-blue-100 text-blue-700',   label: 'Proximo'   },
    agendado:  { cls: 'bg-gray-100 text-gray-600',   label: 'Agendado'  },
    concluido: { cls: 'bg-green-100 text-green-700', label: 'Concluido' },
  }

  const sc = statusConfig[atend.status]

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl mb-2 border ${
      atend.status === 'proximo'
        ? 'bg-blue-50 border-blue-200'
        : isProximo
        ? 'bg-gray-50 border-gray-200'
        : 'bg-white border-gray-100'
    }`}>
      {/* Data/hora */}
      <div className="text-center min-w-[48px] shrink-0">
        <p className="text-[15px] font-bold text-gray-800 leading-none">
          {atend.data.split('/')[0]}
        </p>
        <p className="text-[9px] text-gray-400 uppercase">
          {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][parseInt(atend.data.split('/')[1]) - 1]}
        </p>
        <p className="text-[10px] text-gray-500 mt-0.5">{atend.hora}</p>
      </div>

      {/* Divisor */}
      <div className="w-px h-10 bg-gray-200 shrink-0" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-800 truncate">
          {atend.paciente}
          <span className="text-gray-400 font-normal"> · {atend.idade} anos</span>
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5 truncate">{atend.procedimento}</p>
      </div>

      {/* Status */}
      <span className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full ${sc.cls}`}>
        {sc.label}
      </span>
    </div>
  )
}

//  PAINEL DO DENTISTA //
function PainelDentista({ dentista, onSair }: { dentista: Dentista; onSair: () => void }) {
  return (
    <div>
      {/* Header */}
      <header className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            {dentista.nome.split(' ').find(p => !['Dr.', 'Dra.'].includes(p))?.charAt(0) ?? 'D'}
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1">{dentista.nome}</h1>
          <p className="text-blue-400 text-[15px]">{dentista.especializacao}</p>
          

          {/* Stats rápidos */}
          <div className="flex items-center justify-center gap-6 mt-5">
            <div className="text-center">
              <p className="text-[22px] font-bold text-white">{dentista.n_atendimentos}</p>
              <p className="text-[11px] text-blue-300">Pacientes</p>
            </div>
            <div className="w-px h-8 bg-blue-700" />
            <div className="text-center">
              <p className="text-[22px] font-bold text-amber-400">{dentista.avaliacao}</p>
              <p className="text-[11px] text-blue-300">Avaliacao</p>
            </div>
            <div className="w-px h-8 bg-blue-700" />
            <div className="text-center">
              <p className="text-[22px] font-bold text-green-400">{dentista.status}</p>
              <p className="text-[11px] text-blue-300">Status</p>
            </div>
          </div>
        </div>
      </header>

      <section className="py-10 px-6 max-w-2xl mx-auto">

        <Link
          to="/validar-paciente"
          className="w-full flex items-center justify-center gap-2 bg-amber-400 text-[#07111E] font-bold py-3 rounded-xl hover:bg-amber-500 transition-colors mb-5 no-underline text-[14px]">
          Validar Paciente por QR Code
        </Link>

        {/* Proximos atendimentos */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 text-[16px]">Proximos atendimentos</h2>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {dentista.proximosAtend.length} agendados
            </span>
          </div>
          {dentista.proximosAtend.map((a, i) => (
            <AtendimentoCard key={i} atend={a} tipo="proximo" />
          ))}
        </div>

        {/* Historico recente 
        <div className="bg-white rounded-2xl shadow-md p-6 mb-5 border border-gray-100">
          <h2 className="font-bold text-gray-800 text-[16px] mb-4">Historico recente</h2>
          {dentista.historicoRecente.map((a, i) => (
            <AtendimentoCard key={i} atend={a} tipo="historico" />
          ))}
        </div> */}

        {/* Minha clinica */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-md p-6 mb-5 text-white">
          <h2 className="font-bold text-[16px] mb-4">Informações Dentista</h2>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <p className="text-blue-200 text-[11px] uppercase tracking-wide mb-1">Nome</p>
              <p className="font-semibold text-[14px]">{dentista.nome}</p>
            </div>
           
            <div>
              <p className="text-blue-200 text-[11px] uppercase tracking-wide mb-1">CRO</p>
              <p className="font-semibold text-[14px]">{dentista.cro}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[11px] uppercase tracking-wide">Status</p>
              <p className="font-semibold text-gray-700">{dentista.status}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[11px] uppercase tracking-wide">Especialidade</p>
              <p className="font-semibold text-gray-700">{dentista.especializacao}</p>
            </div>
          </div>
        </div>

        {/* Informacoes do programa */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
          <h2 className="font-bold text-gray-800 text-[14px] mb-3">Informacoes adicionais</h2>
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div>
              <p className="text-gray-400 text-[11px] uppercase tracking-wide">Total de pacientes atendidos</p>
              <p className="font-semibold text-gray-700">{dentista.n_atendimentos}</p>
            </div>
          </div>
        </div>

        {/* Botoes */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onSair}
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

//  PAINEL DENTISTA (PRINCIPAL) //
const PainelDentistaPage = () => {
  const [dentista,   setDentista]   = useState<Dentista | null>(null)
  const [carregando, setCarregando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const croSalvo = sessionStorage.getItem('tdb_cro')

    if (!croSalvo) {
      navigate('/login')
      return
    }

    const resultado = buscarDentista(croSalvo)

    if (resultado) {
      setDentista(resultado)
    } else {
      navigate('/login')
    }

    setCarregando(false)
  }, [navigate])

  function handleSair() {
    sessionStorage.removeItem('tdb_cro')
    navigate('/login')
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <p className="text-white text-[15px]">Carregando seus dados...</p>
      </div>
    )
  }

  if (!dentista) return null

  return <PainelDentista dentista={dentista} onSair={handleSair} />
}

export default PainelDentistaPage;