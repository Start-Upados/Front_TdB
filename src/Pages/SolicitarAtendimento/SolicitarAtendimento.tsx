import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Smile, HeartHandshake, ArrowRight, ArrowLeft, Check, CheckCircle2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { appendSheet } from '../../Services/googleSheets'
import { solicitacaoService, beneficiarioService } from '../../Services/api'


type TipoAtendimento = 'selecao' | 'jovem' | 'mulher'

interface FormJovem {
  nomeAdolescente:  string
  dataNascimento:   string
  cep:              string
  rgCpf:            string
  protocolo:        string
  rendaFamiliar:    string
  necessidade:      string
  nomeResponsavel:  string
  parentesco:       string
  whatsapp:         string
  telefone:         string
  email:            string
  comoSoube:        string
  observacoes:      string
  aceitaTermos:     boolean
}

interface FormMulher {
  nome:             string
  cep:              string
  rgCpf:            string
  protocolo:        string
  dataNascimento:   string
  whatsapp:         string
  telefone:         string
  email:            string
  foiVitima:        string
  comoSoube:        string
  observacoes:      string
  aceitaTermos:     boolean
}


function gerarProtocolo(tipo: 'jovem' | 'mulher'): string {
  const ano = new Date().getFullYear()
  const num = Math.floor(Math.random() * 9000) + 1000
  return tipo === 'jovem' ? `TDB-${ano}-${num}` : `APO-${ano}-${num}`
}

function gerarSenha(nome: string): string {
  const base = nome.toLowerCase().replace(/\s+/g, '').slice(0, 4)
  const num  = Math.floor(Math.random() * 900) + 100
  return `${base}${num}`
}

function formatTelefone(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11)
  if (nums.length <= 2)  return `(${nums}`
  if (nums.length <= 7)  return `(${nums.slice(0, 2)}) ${nums.slice(2)}`
  if (nums.length <= 11) return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`
  return nums
}

function calcularIdade(dataNasc: string): number {
  if (!dataNasc) return 0;
  const nasc = new Date(dataNasc);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

interface EnderecoViaCEP {
  cidade: string;
  endereco: string;
  uf: string;
}

async function buscarEnderecoCEP(cep: string): Promise<EnderecoViaCEP> {
  try {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return { cidade: '', endereco: '', uf: '' };
    const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    if (!res.ok) return { cidade: '', endereco: '', uf: '' };
    const data = await res.json();
    if (data.erro) return { cidade: '', endereco: '', uf: '' };
    const endereco = [data.logradouro, data.bairro].filter(Boolean).join(', ');
    return {
      cidade: data.localidade ?? '',
      endereco: endereco || '',
      uf: data.uf ?? '',
    };
  } catch {
    return { cidade: '', endereco: '', uf: '' };
  }
}


// === ESTILOS COMPARTILHADOS ===
const inputCls  = "w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#E88407] focus:ring-2 focus:ring-[#E88407]/15 transition-all duration-200"
const selectCls = "w-full bg-white border border-[#E2E8F0] text-[#0F172A] rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#E88407] focus:ring-2 focus:ring-[#E88407]/15 transition-all duration-200 cursor-pointer"


// === STEP INDICATOR ===
function StepIndicator({ step, total, programa }: { step: number; total: number; programa: 'jovem' | 'mulher' }) {
  const activeBg   = programa === 'jovem' ? '#E88407' : '#CED600'
  const activeText = programa === 'jovem' ? '#FFFFFF' : '#1A2E05'

  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      {Array.from({ length: total }).map((_, i) => {
        const isComplete = i + 1 < step
        const isActive   = i + 1 === step
        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold transition-all duration-300"
              style={{
                backgroundColor: isComplete ? '#10B981' : isActive ? activeBg : '#F1F5F9',
                color:           isComplete ? '#FFFFFF' : isActive ? activeText : '#94A3B8'
              }}
            >
              {isComplete ? <Check size={16} strokeWidth={3} /> : i + 1}
            </div>
            {i < total - 1 && (
              <div
                className="w-10 h-0.5 transition-all duration-300"
                style={{ backgroundColor: isComplete ? '#10B981' : '#E2E8F0' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}


// === CAMPO REUTILIZÁVEL ===
function Campo({ label, error, required = true, children }: {
  label: string; error?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[11px] text-[#475569] font-semibold mb-1.5 uppercase tracking-[0.6px]">
        {label} {required && <span className="text-[#E88407]">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
    </div>
  )
}


// === TELA DE SUCESSO ===
function TelaSucesso({ protocolo, tipo, onVoltar, senha }: {
  protocolo: string; tipo: 'jovem' | 'mulher'; senha: string; onVoltar: () => void
}) {
  const isApolonas = tipo === 'mulher'
  const programaColor     = isApolonas ? '#CED600' : '#E88407'
  const programaColorSoft = isApolonas ? '#ECFCCB' : '#FFEDD5'
  const programaColorDark = isApolonas ? '#3F6212' : '#9A3412'

  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm text-center">

        <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-green-600" strokeWidth={2.5} />
        </div>

        <h2 className="text-[20px] font-bold text-[#0F172A] mb-2">Solicitação enviada!</h2>
        <p className="text-[#475569] text-[13px] mb-2">
          {isApolonas
            ? 'Sua solicitação para o programa Apolônias do Bem foi registrada.'
            : 'Sua solicitação foi registrada com sucesso.'}
        </p>
        <p className="text-[#94A3B8] text-[12px] mb-6">Guarde o protocolo para acompanhar seu atendimento.</p>

        <div
          style={{ backgroundColor: programaColorSoft, borderColor: programaColor }}
          className="border-2 rounded-xl p-4 mb-5"
        >
          <p className="text-[11px] text-[#475569] uppercase tracking-wide mb-1">Número do protocolo</p>
          <p style={{ color: programaColorDark }} className="text-[22px] font-bold mb-3">#{protocolo}</p>
          <p className="text-[11px] text-[#475569] uppercase tracking-wide mb-1">Senha</p>
          <p style={{ color: programaColorDark }} className="text-[22px] font-bold">{senha}</p>

          {isApolonas && (
            <p style={{ color: programaColorDark }} className="text-[11px] mt-2 font-medium">Programa Apolônias do Bem</p>
          )}
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center mb-5">
          <div className="bg-white p-3 rounded-xl border border-[#E2E8F0]">
            <QRCodeSVG
              value={`https://www.startupados.com.br/validar-paciente?protocolo=${protocolo}`}
              size={150}
              bgColor="#ffffff"
              fgColor="#0F172A"
              level="H"
            />
          </div>
          <p className="text-[#475569] text-[12px] mt-3">Escaneie para validar seu atendimento</p>
          <p className="text-[#94A3B8] text-[10px] mt-1 font-mono">startupados.com.br/validar-paciente</p>
        </div>

        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 mb-6 text-left">
          <p className="text-[11px] text-[#475569] uppercase tracking-wide font-bold mb-3">Próximos passos</p>
          <div className="flex flex-col gap-2">
            {(isApolonas ? [
              'A equipe da Turma do Bem analisará sua solicitação',
              'Você será contatada para uma triagem oral gratuita',
              'Prazo de resposta: até 5 dias úteis',
              'Guarde o protocolo para consultas futuras',
            ] : [
              'A equipe da Turma do Bem analisará sua solicitação',
              'Você será contatado pelo WhatsApp ou email cadastrado',
              'Prazo de resposta: até 5 dias úteis',
              'Guarde o protocolo para consultas futuras',
            ]).map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span style={{ color: programaColor }} className="text-[12px] font-bold mt-0.5 shrink-0">{i + 1}.</span>
                <p className="text-[#475569] text-[12px]">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="w-full bg-[#0F172A] text-white font-semibold py-3 rounded-xl hover:bg-[#1E293B] transition-colors duration-200 text-center text-[14px] no-underline block"
          >
            Voltar ao início
          </Link>
          <button
            onClick={onVoltar}
            className="w-full bg-white border border-[#E2E8F0] text-[#475569] font-semibold py-3 rounded-xl hover:bg-[#F8FAFC] transition-colors cursor-pointer text-[13px]"
          >
            Nova solicitação
          </button>
        </div>
      </div>
    </div>
  )
}


// === TELA DE SELEÇÃO ===
function TelaSelecao({ onSelect }: { onSelect: (tipo: 'jovem' | 'mulher') => void }) {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm">

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFEDD5] border-2 border-[#E88407] mb-4">
            <span className="text-3xl">🦷</span>
          </div>
          <h1 className="text-[22px] font-bold text-[#0F172A] leading-tight">Solicitar atendimento</h1>
          <p className="text-[13px] text-[#475569] mt-1.5">Qual tipo de atendimento você precisa?</p>
        </div>

        <div className="flex flex-col gap-3 mb-5">

          {/* Dentista do Bem — Jovens (laranja TdB) */}
          <button
            onClick={() => onSelect('jovem')}
            className="flex items-start gap-3 w-full p-4 rounded-xl bg-[#FFEDD5] border-2 border-[#E88407] hover:bg-[#FED7AA] transition-all duration-200 cursor-pointer text-left"
          >
            <div className="w-12 h-12 rounded-full bg-[#E88407] flex items-center justify-center shrink-0">
              <Smile size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#9A3412] text-[15px]">Dentista do Bem</p>
              <p className="text-[#9A3412]/85 text-[12px] mt-0.5">Para jovens de 11 a 17 anos</p>
              <p className="text-[#475569] text-[11px] mt-0.5">Tratamento odontológico gratuito</p>
            </div>
            <ArrowRight size={18} className="text-[#E88407] shrink-0 mt-1" />
          </button>

          {/* Apolônias do Bem — Mulheres (lime TdB) */}
          <button
            onClick={() => onSelect('mulher')}
            className="flex items-start gap-3 w-full p-4 rounded-xl bg-[#ECFCCB] border-2 border-[#CED600] hover:bg-[#D9F99D] transition-all duration-200 cursor-pointer text-left"
          >
            <div className="w-12 h-12 rounded-full bg-[#CED600] flex items-center justify-center shrink-0">
              <HeartHandshake size={22} className="text-[#1A2E05]" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#3F6212] text-[15px]">Apolônias do Bem</p>
              <p className="text-[#3F6212]/85 text-[12px] mt-0.5">Para mulheres vítimas de violência</p>
              <p className="text-[#475569] text-[11px] mt-0.5">Tratamento odontológico gratuito via triagem</p>
            </div>
            <ArrowRight size={18} className="text-[#65A30D] shrink-0 mt-1" />
          </button>

        </div>

        <div className="text-center pt-4 border-t border-[#E2E8F0]">
          <p className="text-[12px] text-[#94A3B8]">
            Sistema desenvolvido por{' '}
            <Link to="/" className="text-[#E88407] font-semibold hover:underline">StartUpados</Link>
          </p>
        </div>
      </div>

      <p className="text-center mt-5 text-[13px]">
        <Link to="/login" className="text-[#E88407] hover:underline transition-colors inline-flex items-center gap-1.5 font-medium">
          <ArrowLeft size={14} />
          Voltar ao login
        </Link>
      </p>
    </div>
  )
}


// === FORMULÁRIO JOVEM (Dentista do Bem) ===
function FormularioJovem({ onSucesso }: { onSucesso: (prot: string, senha: string) => void }) {
  const [step,     setStep]     = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [whatsapp, setWhatsapp] = useState('')
  const [telefone, setTelefone] = useState('')
  

  const { register, trigger, formState: { errors }, getValues } = useForm<FormJovem>()

  const TOTAL_STEPS = 3
  const stepLabels  = ['Adolescente', 'Responsável', 'Atendimento']

  async function nextStep() {
    const fieldsPerStep: (keyof FormJovem)[][] = [
      ['nomeAdolescente', 'dataNascimento', 'rgCpf', 'rendaFamiliar', 'necessidade'],
      ['nomeResponsavel', 'parentesco', 'email', 'cep'],
      ['comoSoube', 'aceitaTermos'],
    ]
    const valid = await trigger(fieldsPerStep[step - 1])
    if (valid) setStep(s => s + 1)
  }

  async function enviar() {
    const valid = await trigger(['comoSoube', 'aceitaTermos'])
    if (!valid) return
    const data = getValues()
    setEnviando(true)
    const prot    = gerarProtocolo('jovem')
    const senha   = gerarSenha(data.nomeAdolescente)
    const agora   = new Date()
    const dataStr = agora.toLocaleDateString('pt-BR')
    const horaStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    // Calcula idade e busca cidade/endereço via ViaCEP
    const idade = calcularIdade(data.dataNascimento);
    const { cidade, endereco, uf } = await buscarEnderecoCEP(data.cep);

    try {
      await solicitacaoService.cadastrar({
        nome:        data.nomeAdolescente,
        rgCpf:       data.rgCpf,
        email:       data.email,
        protocolo:   prot,
        senha:       senha,
        telefone:    whatsapp || telefone,
        cep:         data.cep,
        necessidade: data.necessidade,
        sexo:        'masculino',
        descricao:   data.observacoes ?? '',
        dataNasc:    data.dataNascimento,
        renda:       data.rendaFamiliar,
        responsavel: data.nomeResponsavel,
        comoSoube:   data.comoSoube,
        parentesco:  data.parentesco,
      })
    } catch (err) {
      console.warn('Backend indisponivel, salvando no Sheets:', err)
    }

    try {
      await beneficiarioService.cadastrar({
        nome:       data.nomeAdolescente,
        rgCpf:      data.rgCpf,            // formatado (000.000.000-00) — tem que bater com o login
        email:      data.email,
        senha:      senha,                // mesma senha mostrada na tela de sucesso
        telefone:   whatsapp || telefone,
        cep:        data.cep,
        sexo:       'masculino',
        dataNasc:   data.dataNascimento,
        numeroCasa: 0,                    // o form não coleta número da casa
      })
    } catch (err) {
      console.warn('Backend indisponivel ao criar beneficiario (login):', err)
    }

    try {
      await appendSheet('Mensagens!A:N', [[
        prot, data.nomeResponsavel, data.email, whatsapp, telefone,
        'Solicitacao de Atendimento — Dentista do Bem',
        `Adolescente: ${data.nomeAdolescente} | Nascimento: ${data.dataNascimento} | Cep: ${data.cep} | Renda: ${data.rendaFamiliar} | Necessidade: ${data.necessidade} | Responsavel: ${data.nomeResponsavel} (${data.parentesco}) | Como soube: ${data.comoSoube} | Obs: ${data.observacoes || 'Nenhuma'}`,
        'Site', 'Solicitacao', 'Aguardando', dataStr, horaStr,
        cidade,   // M — Cidade
        uf,       // N — UF
      ]])
      await appendSheet('Pacientes!A:Q', [[
        data.nomeAdolescente,           // A — Nome
        idade > 0 ? String(idade) : '', // B — Idade
        cidade,                         // C — Cidade
        'Dentista do Bem',              // D — Programa
        'Aguardando',                   // E — Status
        dataStr,                        // F — Data Cadastro
        '',                             // G — ?
        '',                             // H — ?
        '',                             // I — ?
        '',                             // J — Próx. Hora (vazio)
        '',                             // K — Clínica (vazio)
        endereco,                       // L — Endereço
        '',                             // M — # Sessão Atual
        '',                             // N — Total Sessões
        data.necessidade,               // O — Procedimento Atual
        data.observacoes ?? '',         // P — Observações
        prot,                           // Q — Protocolo
      ]])
    } catch (err) {
      console.error('Erro ao salvar no Sheets:', err)
      alert('Erro ao enviar. Tente novamente.')
      setEnviando(false)
      return
    }

    onSucesso(prot, senha)
    setEnviando(false)
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm">

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#FFEDD5] border-2 border-[#E88407] mb-3">
            <Smile size={26} className="text-[#E88407]" strokeWidth={2.5} />
          </div>
          <h1 className="text-[20px] font-bold text-[#9A3412]">Dentista do Bem</h1>
          <p className="text-[#475569] text-[12px] mt-1">Cadastro gratuito para jovens</p>
        </div>

        <StepIndicator step={step} total={TOTAL_STEPS} programa="jovem" />
        <div className="flex justify-between mb-5 px-1">
          {stepLabels.map((label, i) => (
            <p key={i} className={`text-[11px] font-semibold ${i + 1 === step ? 'text-[#E88407]' : 'text-[#94A3B8]'}`}>
              {label}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {step === 1 && (
            <>
              <Campo label="Nome completo do adolescente" error={errors.nomeAdolescente?.message}>
                <input {...register('nomeAdolescente', { required: 'Campo obrigatório' })} placeholder="Nome completo" className={inputCls} />
              </Campo>
              <Campo label="Data de nascimento" error={errors.dataNascimento?.message}>
                <input type="date" {...register('dataNascimento', { 
                  required: 'Campo obrigatório', 
                  validate: v => {
                    const idade = calcularIdade(v)
                    if (idade < 11 || idade > 17) return 'O jovem precisa ter entre 11 e 17 anos'
                    return true
                  },
                 })} className={inputCls}
                />
              </Campo>
              <Campo label="Renda familiar" error={errors.rendaFamiliar?.message}>
                <select {...register('rendaFamiliar', { required: 'Campo obrigatório' })} className={selectCls}>
                  <option value="">Selecione</option>
                  <option value="Ate 1 salario minimo">Até 1 salário mínimo</option>
                  <option value="1 a 2 salarios minimos">1 a 2 salários mínimos</option>
                  <option value="2 a 3 salarios minimos">2 a 3 salários mínimos</option>
                  <option value="Acima de 3 salarios minimos">Acima de 3 salários mínimos</option>
                </select>
              </Campo>
              <Campo label="Necessidade odontológica" error={errors.necessidade?.message}>
                <select {...register('necessidade', { required: 'Campo obrigatório' })} className={selectCls}>
                  <option value="">Selecione</option>
                  <option value="Tratamento de canal">Tratamento de canal</option>
                  <option value="Extracao">Extração</option>
                  <option value="Restauracao">Restauração</option>
                  <option value="Ortodontia (aparelho)">Ortodontia (aparelho)</option>
                  <option value="Limpeza e prevencao">Limpeza e prevenção</option>
                  <option value="Outro">Outro</option>
                </select>
              </Campo>
              <Campo label="CPF" error={errors.rgCpf?.message}>
                <input {...register('rgCpf', { required: 'Campo obrigatório', pattern: { value: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/, message: 'Formato inválido. Ex.: 000.000.000-00' } })} placeholder="000.000.000-00" className={inputCls} />
              </Campo>
            </>
          )}

          {step === 2 && (
            <>
              <Campo label="Nome do responsável" error={errors.nomeResponsavel?.message}>
                <input {...register('nomeResponsavel', { required: 'Campo obrigatório' })} placeholder="Nome completo do responsável" className={inputCls} />
              </Campo>
              <Campo label="Parentesco" error={errors.parentesco?.message}>
                <select {...register('parentesco', { required: 'Campo obrigatório' })} className={selectCls}>
                  <option value="">Selecione</option>
                  <option value="Pai">Pai</option>
                  <option value="Mae">Mãe</option>
                  <option value="Avo/Ava">Avô/Avó</option>
                  <option value="Tutor legal">Tutor legal</option>
                  <option value="Outro responsavel">Outro responsável</option>
                </select>
              </Campo>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="WhatsApp" required={false}>
                  <input type="tel" value={whatsapp} onChange={e => setWhatsapp(formatTelefone(e.target.value))} placeholder="(11) 99999-9999" maxLength={15} className={inputCls} />
                </Campo>
                <Campo label="Telefone" required={false}>
                  <input type="tel" value={telefone} onChange={e => setTelefone(formatTelefone(e.target.value))} placeholder="(11) 99999-9999" maxLength={15} className={inputCls} />
                </Campo>
              </div>
              <Campo label="Email" error={errors.email?.message}>
                <input type="email" {...register('email', { required: 'Campo obrigatório', pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' } })} placeholder="seu@email.com" className={inputCls} />
              </Campo>
              <Campo label="CEP" error={errors.cep?.message}>
                <input 
                {...register('cep', {
                      required: 'Obrigatório',
                      pattern: {
                        value: /^\d{5}-\d{3}$/,
                        message: 'Formato inválido. Ex.: 12345-000',
                      },
                    })}
                    placeholder="Digite seu CEP"
                    maxLength={9}
                    className={inputCls}
                />
              </Campo>
            </>
          )}

          {step === 3 && (
            <>
              <Campo label="Como soube da Turma do Bem?" error={errors.comoSoube?.message}>
                <select {...register('comoSoube', { required: 'Campo obrigatório' })} className={selectCls}>
                  <option value="">Selecione</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Indicacao de amigo/familiar">Indicação de amigo/familiar</option>
                  <option value="Escola">Escola</option>
                  <option value="Posto de saude">Posto de saúde</option>
                  <option value="Site da Turma do Bem">Site da Turma do Bem</option>
                  <option value="Outro">Outro</option>
                </select>
              </Campo>
              <Campo label="Observações" required={false}>
                <textarea {...register('observacoes')} placeholder="Detalhes adicionais..." rows={3} className={`${inputCls} resize-none`} />
              </Campo>
              <div className="bg-[#FFEDD5] border border-[#E88407]/30 rounded-xl p-4">
                <p className="text-[11px] text-[#9A3412] uppercase tracking-wide font-bold mb-2">Resumo</p>
                <div className="flex flex-col gap-1 text-[12px]">
                  <p className="text-[#475569]">Adolescente: <span className="text-[#0F172A] font-semibold">{getValues('nomeAdolescente')}</span></p>
                  <p className="text-[#475569]">CEP: <span className="text-[#0F172A] font-semibold">{getValues('cep')}</span></p>
                  <p className="text-[#475569]">Necessidade: <span className="text-[#0F172A] font-semibold">{getValues('necessidade')}</span></p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <input type="checkbox" id="termosJ" {...register('aceitaTermos', { required: 'Você precisa aceitar os termos' })} className="mt-1 cursor-pointer accent-[#E88407]" />
                <label htmlFor="termosJ" className="text-[12px] text-[#475569] cursor-pointer leading-relaxed">
                  Concordo que os dados sejam utilizados pela Turma do Bem para fins de agendamento e contato para atendimento odontológico gratuito.
                </label>
              </div>
              {errors.aceitaTermos && <p className="text-[11px] text-red-600">{errors.aceitaTermos.message}</p>}
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button type="button" onClick={() => setStep(s => s - 1)}
              className="flex-1 bg-[#F1F5F9] text-[#475569] font-semibold py-3 rounded-xl hover:bg-[#E2E8F0] transition-colors cursor-pointer border-none text-[14px]">
              Voltar
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button type="button" onClick={nextStep}
              className="flex-1 bg-[#E88407] text-white font-semibold py-3 rounded-xl hover:bg-[#D67606] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none text-[14px]">
              Continuar
            </button>
          ) : (
            <button type="button" onClick={enviar} disabled={enviando}
              className="flex-1 bg-[#E88407] text-white font-semibold py-3 rounded-xl hover:bg-[#D67606] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none text-[14px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              {enviando ? 'Enviando...' : 'Enviar solicitação'}
            </button>
          )}
        </div>
      </div>
      <p className="text-center mt-5 text-[13px]">
        <Link to="/login" className="text-[#E88407] hover:underline transition-colors inline-flex items-center gap-1.5 font-medium">
          <ArrowLeft size={14} />
          Voltar ao login
        </Link>
      </p>
    </div>
  )
}


// === FORMULÁRIO MULHER (Apolônias do Bem) ===
function FormularioMulher({ onSucesso }: { onSucesso: (prot: string, senha: string) => void }) {
  const [step,     setStep]     = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [whatsapp, setWhatsapp] = useState('')
  const [telefone, setTelefone] = useState('')

  const { register, trigger, formState: { errors }, getValues } = useForm<FormMulher>()

  const TOTAL_STEPS = 2
  const stepLabels  = ['Dados pessoais', 'Atendimento']

  async function nextStep() {
    const fieldsPerStep: (keyof FormMulher)[][] = [
      ['nome', 'dataNascimento', 'rgCpf', 'email', 'cep'],
      ['foiVitima', 'comoSoube', 'aceitaTermos'],
    ]
    const valid = await trigger(fieldsPerStep[step - 1])
    if (valid) setStep(s => s + 1)
  }

  async function enviar() {
  const valid = await trigger(['foiVitima', 'comoSoube', 'aceitaTermos'])
  if (!valid) return
  const data = getValues()
  setEnviando(true)
  const prot    = gerarProtocolo('mulher')
  const senha   = gerarSenha(data.nome)
  const agora   = new Date()
  const dataStr = agora.toLocaleDateString('pt-BR')
  const horaStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  try {
  await solicitacaoService.cadastrar({
    nome:        data.nome,
    rgCpf:       data.rgCpf.replace(/\D/g, ''),
    protocolo:   prot,
    email:       data.email,
    senha:       senha,
    telefone:    (whatsapp || telefone).replace(/\D/g, ''),
    cep:         data.cep.replace(/\D/g, ''),
    necessidade: data.foiVitima === 'Sim'
      ? 'Vitima de violencia com denticao afetada'
      : 'Triagem odontologica',
    sexo:        'feminino',
    descricao:   data.observacoes ?? '',
    dataNasc:    data.dataNascimento,
    renda:       'Nao se aplica',
    responsavel: data.nome,
    comoSoube:   data.comoSoube,
    parentesco:  'Nao se aplica',
  })
} catch (err) {
  console.warn('Backend indisponivel, salvando no Sheets:', err)
}

  try {
    await beneficiarioService.cadastrar({
      nome:       data.nome,
      rgCpf:      data.rgCpf,            // formatado — NÃO use o .replace(/\D/g,'') aqui; precisa bater com o login
      email:      data.email,
      senha:      senha,
      telefone:   whatsapp || telefone,
      cep:        data.cep,
      sexo:       'feminino',
      dataNasc:   data.dataNascimento,
      numeroCasa: 0,
    })
  } catch (err) {
    console.warn('Backend indisponivel ao criar beneficiario (login):', err)
  }

  const idade = calcularIdade(data.dataNascimento)
  const { cidade, endereco, uf } = await buscarEnderecoCEP(data.cep)
  const procedimentoAtual = data.foiVitima === 'Sim'
    ? 'Vitima de violencia com denticao afetada'
    : 'Triagem odontologica'

  try {
    
    await appendSheet('Pacientes!A:Q', [[
      data.nome, String(idade ?? ''), cidade,
      'Apolônias do Bem', 'Pendente Triagem', dataStr,
      '', '', '', '', '', endereco,
      '', '', procedimentoAtual, data.observacoes ?? '', prot,
    ]])

  
    await appendSheet('Mensagens!A:N', [[
      prot, data.nome, data.email, whatsapp, telefone,
      'Solicitacao de Atendimento — Apolonas do Bem',
      `Beneficiaria: ${data.nome} | Nascimento: ${data.dataNascimento} | Cep: ${data.cep} | Foi vitima: ${data.foiVitima} | Como soube: ${data.comoSoube} | Obs: ${data.observacoes || 'Nenhuma'}`,
      'Site', 'Solicitacao', 'Aguardando', dataStr, horaStr,
      cidade,   // M — Cidade
      uf,       // N — UF
    ]])
  } catch (err) {
    console.error('Erro ao salvar no Sheets:', err)
    alert('Erro ao enviar. Tente novamente.')
    setEnviando(false)
    return
  }

  onSucesso(prot, senha)
  setEnviando(false)
}

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm">

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#ECFCCB] border-2 border-[#CED600] mb-3">
            <HeartHandshake size={26} className="text-[#3F6212]" strokeWidth={2.5} />
          </div>
          <h1 className="text-[20px] font-bold text-[#3F6212]">Apolônias do Bem</h1>
          <p className="text-[#475569] text-[12px] mt-1">Atendimento gratuito para mulheres</p>
        </div>

        {/* Info sobre triagem */}
        <div className="bg-[#ECFCCB] border border-[#CED600]/40 rounded-xl p-3 mb-5">
          <p className="text-[12px] text-[#3F6212] leading-relaxed">
            O programa oferece tratamento odontológico gratuito para mulheres cis e trans que vivenciaram situações de violência. A seleção é feita por triagem oral não invasiva.
          </p>
        </div>

        <StepIndicator step={step} total={TOTAL_STEPS} programa="mulher" />
        <div className="flex justify-between mb-5 px-1">
          {stepLabels.map((label, i) => (
            <p key={i} className={`text-[11px] font-semibold ${i + 1 === step ? 'text-[#3F6212]' : 'text-[#94A3B8]'}`}>
              {label}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {step === 1 && (
            <>
              <Campo label="Nome completo" error={errors.nome?.message}>
                <input {...register('nome', { required: 'Campo obrigatório' })} placeholder="Seu nome completo" className={inputCls} />
              </Campo>
              <Campo label="Data de nascimento" error={errors.dataNascimento?.message}>
                <input type="date" {...register('dataNascimento', { 
                  required: 'Campo obrigatório',
                  validate: v => {
                    const idade = calcularIdade(v)
                    if (idade < 15 || idade > 100) return 'A idade deve estar entre 18 e 100 anos'
                    return true
                  },
                 })} className={inputCls}
                />
              </Campo>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="WhatsApp" required={false}>
                  <input type="tel" value={whatsapp} onChange={e => setWhatsapp(formatTelefone(e.target.value))} placeholder="(11) 99999-9999" maxLength={15} className={inputCls} />
                </Campo>
                <Campo label="Telefone" required={false}>
                  <input type="tel" value={telefone} onChange={e => setTelefone(formatTelefone(e.target.value))} placeholder="(11) 99999-9999" maxLength={15} className={inputCls} />
                </Campo>
              </div>
              <Campo label="CPF" error={errors.rgCpf?.message}>
                <input {...register('rgCpf', { required: 'Campo obrigatório', pattern: { value: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/, message: 'Formato inválido. Ex.: 000.000.000-00' } })} placeholder="000.000.000-00" className={inputCls} />
              </Campo>
              <Campo label="Email" error={errors.email?.message}>
                <input type="email" {...register('email', { required: 'Campo obrigatório', pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' } })} placeholder="seu@email.com" className={inputCls} />
              </Campo>
              <Campo label="CEP" error={errors.cep?.message}>
                <input {...register('cep', { required: 'Campo obrigatório', pattern: {
                        value: /^\d{5}-\d{3}$/,
                        message: 'Formato inválido. Ex.: 12345-000',
                      },
                      })} 
                      placeholder="12345-000"
                      maxLength={9}
                      className={inputCls}
                    />
              </Campo>
            </>
          )}

          {step === 2 && (
            <>
              <div className="bg-[#ECFCCB] border border-[#CED600]/40 rounded-xl p-4">
                <p className="text-[13px] text-[#3F6212] font-semibold mb-3">
                  Você foi vítima de violência e teve a dentição afetada?
                </p>
                <div className="flex gap-3">
                  {['Sim', 'Nao'].map(opcao => (
                    <label key={opcao} className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        value={opcao}
                        {...register('foiVitima', { required: 'Selecione uma opção' })}
                        className="sr-only"
                      />
                      <div className={`w-full py-3 rounded-xl border-2 text-center font-semibold text-[14px] transition-all duration-200 ${
                        getValues('foiVitima') === opcao
                          ? opcao === 'Sim'
                            ? 'border-[#CED600] bg-[#CED600] text-[#1A2E05]'
                            : 'border-[#94A3B8] bg-[#F1F5F9] text-[#475569]'
                          : 'bg-white border-[#E2E8F0] text-[#94A3B8] hover:border-[#CBD5E1]'
                      }`}>
                        {opcao === 'Nao' ? 'Não' : opcao}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.foiVitima && <p className="text-[11px] text-red-600 mt-2">{errors.foiVitima.message}</p>}
              </div>

              <Campo label="Como soube do programa?" error={errors.comoSoube?.message}>
                <select {...register('comoSoube', { required: 'Campo obrigatório' })} className={selectCls}>
                  <option value="">Selecione</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Indicacao de amigo/familiar">Indicação de amigo/familiar</option>
                  <option value="Posto de saude">Posto de saúde</option>
                  <option value="Delegacia/CREAS">Delegacia/CREAS</option>
                  <option value="Site da Turma do Bem">Site da Turma do Bem</option>
                  <option value="Outro">Outro</option>
                </select>
              </Campo>

              <Campo label="Observações" required={false}>
                <textarea {...register('observacoes')} placeholder="Detalhes adicionais sobre sua situação..." rows={3} className={`${inputCls} resize-none`} />
              </Campo>

              <div className="bg-[#ECFCCB] border border-[#CED600]/30 rounded-xl p-4">
                <p className="text-[11px] text-[#3F6212] uppercase tracking-wide font-bold mb-2">Resumo</p>
                <div className="flex flex-col gap-1 text-[12px]">
                  <p className="text-[#475569]">Nome: <span className="text-[#0F172A] font-semibold">{getValues('nome')}</span></p>
                  <p className="text-[#475569]">CEP: <span className="text-[#0F172A] font-semibold">{getValues('cep')}</span></p>
                  <p className="text-[#475569]">Programa: <span className="text-[#3F6212] font-semibold">Apolônias do Bem</span></p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input type="checkbox" id="termosM" {...register('aceitaTermos', { required: 'Você precisa aceitar os termos' })} className="mt-1 cursor-pointer accent-[#CED600]" />
                <label htmlFor="termosM" className="text-[12px] text-[#475569] cursor-pointer leading-relaxed">
                  Concordo que os dados sejam utilizados pela Turma do Bem para fins de triagem e contato para atendimento odontológico gratuito pelo programa Apolônias do Bem.
                </label>
              </div>
              {errors.aceitaTermos && <p className="text-[11px] text-red-600">{errors.aceitaTermos.message}</p>}
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button type="button" onClick={() => setStep(s => s - 1)}
              className="flex-1 bg-[#F1F5F9] text-[#475569] font-semibold py-3 rounded-xl hover:bg-[#E2E8F0] transition-colors cursor-pointer border-none text-[14px]">
              Voltar
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button type="button" onClick={nextStep}
              className="flex-1 bg-[#CED600] text-[#1A2E05] font-semibold py-3 rounded-xl hover:bg-[#B5BC00] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none text-[14px]">
              Continuar
            </button>
          ) : (
            <button type="button" onClick={enviar} disabled={enviando}
              className="flex-1 bg-[#CED600] text-[#1A2E05] font-semibold py-3 rounded-xl hover:bg-[#B5BC00] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none text-[14px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              {enviando ? 'Enviando...' : 'Enviar solicitação'}
            </button>
          )}
        </div>
      </div>
      <p className="text-center mt-5 text-[13px]">
        <Link to="/login" className="text-[#E88407] hover:underline transition-colors inline-flex items-center gap-1.5 font-medium">
          <ArrowLeft size={14} />
          Voltar ao login
        </Link>
      </p>
    </div>
  )
}


// === SOLICITAR ATENDIMENTO (PRINCIPAL) ===
export default function SolicitarAtendimento() {
  const [tipo,      setTipo]      = useState<TipoAtendimento>('selecao')
  const [enviado,   setEnviado]   = useState(false)
  const [protocolo, setProtocolo] = useState('')
  const [tipoFinal, setTipoFinal] = useState<'jovem' | 'mulher'>('jovem')
  const [senha,     setSenha]     = useState('')

  function handleSucesso(prot: string, t: 'jovem' | 'mulher', s: string) {
    setSenha(s)
    setProtocolo(prot)
    setTipoFinal(t)
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-[#FAFBFD] flex items-center justify-center p-4">
        <TelaSucesso
          senha={senha}
          protocolo={protocolo}
          tipo={tipoFinal}
          onVoltar={() => { setEnviado(false); setTipo('selecao') }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFBFD] flex items-center justify-center p-4">
      {tipo === 'selecao' && <TelaSelecao onSelect={setTipo} />}
      {tipo === 'jovem'   && <FormularioJovem  onSucesso={(prot, senha) => handleSucesso(prot, 'jovem', senha)} />}
      {tipo === 'mulher'  && <FormularioMulher onSucesso={(prot, senha) => handleSucesso(prot, 'mulher', senha)} />}
    </div>
  )
}