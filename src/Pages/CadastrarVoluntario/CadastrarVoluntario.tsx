import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Check, CheckCircle2 } from 'lucide-react'
import { dentistaService } from '../../Services/api'
import { appendSheet } from '../../Services/googleSheets'


interface FormData {
  nome:             string
  rgCpf:            string
  email:            string
  telefone:         string
  cro:              string
  especializacao:   string
  cep:              string
  nConsultorio:     number
  disponibilidade:  string
  participouAntes:  string
  aceitaTermos:     boolean
}

function formatCPF(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11)
  if (nums.length <= 3) return nums
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`
  if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`
}

function formatTelefone(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11)
  if (nums.length <= 2)  return `(${nums}`
  if (nums.length <= 7)  return `(${nums.slice(0, 2)}) ${nums.slice(2)}`
  if (nums.length <= 11) return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`
  return nums
}

function gerarProtocolo(): string {
  const ano = new Date().getFullYear()
  const num = Math.floor(Math.random() * 9000) + 1000
  return `VOL-${ano}-${num}`
}

function gerarSenha(nome: string): string {
  const base = nome.toLowerCase().replace(/\s+/g, '').slice(0, 4)
  const num  = Math.floor(Math.random() * 900) + 100
  return `${base}${num}`
}


// === ESTILOS COMPARTILHADOS ===
const inputCls  = "w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#E88407] focus:ring-2 focus:ring-[#E88407]/15 transition-all duration-200"
const selectCls = "w-full bg-white border border-[#E2E8F0] text-[#0F172A] rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#E88407] focus:ring-2 focus:ring-[#E88407]/15 transition-all duration-200 cursor-pointer"


// === STEP INDICATOR ===
function StepIndicator({ step, total }: { step: number; total: number }) {
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
                backgroundColor: isComplete ? '#10B981' : isActive ? '#E88407' : '#F1F5F9',
                color:           isComplete ? '#FFFFFF' : isActive ? '#FFFFFF' : '#94A3B8'
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
function Campo({
  label, error, required = true, children
}: {
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
function TelaSucesso({ protocolo, onVoltar, senha }: { protocolo: string; senha: string; onVoltar: () => void }) {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm text-center">

        <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-green-600" strokeWidth={2.5} />
        </div>

        <h2 className="text-[20px] font-bold text-[#0F172A] mb-2">
          Cadastro enviado!
        </h2>
        <p className="text-[#475569] text-[13px] mb-6">
          Seu cadastro foi registrado com sucesso. Guarde o protocolo e a senha para acompanhar sua solicitação.
        </p>

        <div className="bg-[#FFEDD5] border-2 border-[#E88407] rounded-xl p-4 mb-6">
          <p className="text-[11px] text-[#475569] uppercase tracking-wide mb-1">
            Número do protocolo
          </p>
          <p className="text-[22px] font-bold text-[#9A3412] mb-3">
            #{protocolo}
          </p>
          <p className="text-[11px] text-[#475569] uppercase tracking-wide mb-1">Senha</p>
          <p className="text-[22px] font-bold text-[#9A3412]">{senha}</p>
        </div>

        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 mb-6 text-left">
          <p className="text-[11px] text-[#475569] uppercase tracking-wide font-bold mb-3">
            Próximos passos
          </p>
          <div className="flex flex-col gap-2">
            {[
              'A equipe da Turma do Bem analisará seu cadastro',
              'Você será contatado pelo email ou WhatsApp cadastrado',
              'Prazo de resposta: até 7 dias úteis',
              'Guarde o protocolo para consultas futuras',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#E88407] text-[12px] font-bold mt-0.5 shrink-0">{i + 1}.</span>
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
            Voltar ao login
          </Link>
          <button
            onClick={onVoltar}
            className="w-full bg-white border border-[#E2E8F0] text-[#475569] font-semibold py-3 rounded-xl hover:bg-[#F8FAFC] transition-colors cursor-pointer text-[13px]"
          >
            Novo cadastro
          </button>
        </div>
      </div>
    </div>
  )
}


// === CADASTRAR VOLUNTÁRIO (PRINCIPAL) ===
export default function CadastrarVoluntario() {
  const [step,      setStep]      = useState(1)
  const [enviando,  setEnviando]  = useState(false)
  const [enviado,   setEnviado]   = useState(false)
  const [protocolo, setProtocolo] = useState('')
  const [cpf,       setCpf]       = useState('')
  const [whatsapp,  setWhatsapp]  = useState('')
  const [senha,     setSenha]     = useState('')

  const { register, trigger, formState: { errors }, getValues, reset } = useForm<FormData>()

  const TOTAL_STEPS = 3
  const stepLabels  = ['Pessoais', 'Profissional', 'Atuação']

  // DEPOIS - retirado 'rgCpf' e 'telefone'
async function nextStep() {
    const fieldsPerStep: (keyof FormData)[][] = [
      ['nome', 'email'],
      ['cro', 'especializacao', 'cep', 'nConsultorio'],
      ['disponibilidade', 'aceitaTermos'],
    ]
    const valid = await trigger(fieldsPerStep[step - 1])
    if (valid) setStep(s => s + 1)
  }

  async function enviarFormulario() {
    const valid = await trigger(['cep', 'disponibilidade', 'aceitaTermos'])
    if (!valid) return

    const data        = getValues()
    const senhaGerada = gerarSenha(data.nome)
    const prot        = gerarProtocolo()
    const agora       = new Date()
    const dataStr     = agora.toLocaleDateString('pt-BR')

    setEnviando(true)

    try {
      await dentistaService.cadastrar({
        nome:           data.nome,
        rgCpf:          cpf,
        email:          data.email,
        senha:          senhaGerada,
        telefone:       whatsapp,
        cep:            data.cep,
        nConsultorio:   data.nConsultorio,
        cro:            data.cro,
        nAtendimentos:  0,
        especializacao: data.especializacao,
        status:         'Aguardando análise',
        avaliacao:      0,
      })
    } catch (err) {
      console.warn('Backend indisponivel, salvando no Sheets:', err)
    }

    try {
      await appendSheet('Voluntarios!A:O', [[
        data.nome,
        cpf,
        data.cro,
        data.especializacao,
        data.email,
        whatsapp,
        '',                   // Cidade  (não há campo no form ainda)
        '',                   // Estado  (idem)
        '',                   // Clinica (idem)
        data.disponibilidade,
        data.participouAntes,
        'Aguardando analise',
        dataStr,
        prot,
        senhaGerada,
      ]])

      setSenha(senhaGerada)
      setProtocolo(prot)
      setEnviado(true)
      reset()
      setCpf('')
      setWhatsapp('')

    } catch (err) {
      console.error('Erro ao salvar no Sheets:', err)
      alert('Erro ao enviar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-[#FAFBFD] flex items-center justify-center p-4">
        <TelaSucesso protocolo={protocolo} senha={senha} onVoltar={() => { setEnviado(false); setStep(1) }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFBFD] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm">

          {/* Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#FFEDD5] border-2 border-[#E88407] mb-3">
              <span className="text-2xl">🦷</span>
            </div>
            <h1 className="text-[20px] font-bold text-[#9A3412]">Cadastro de voluntário</h1>
            <p className="text-[#475569] text-[12px] mt-1">Turma do Bem — Seja um dentista voluntário</p>
          </div>

          {/* Step indicator */}
          <StepIndicator step={step} total={TOTAL_STEPS} />

          {/* Step labels */}
          <div className="flex justify-between mb-5 px-1">
            {stepLabels.map((label, i) => (
              <p key={i} className={`text-[11px] font-semibold transition-colors ${
                i + 1 === step ? 'text-[#E88407]' : 'text-[#94A3B8]'
              }`}>
                {label}
              </p>
            ))}
          </div>

          <div className="flex flex-col gap-4">

            {/* STEP 1 — Dados Pessoais */}
            {step === 1 && (
              <>
                <Campo label="Nome completo" error={errors.nome?.message}>
                  <input
                    {...register('nome', { required: 'Campo obrigatório' })}
                    placeholder="Seu nome completo"
                    className={inputCls}
                  />
                </Campo>

                <Campo label="CPF">
                  <input  //{...register('rgCpf', { required: 'Campo obrigatório', pattern: { value: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/, message: 'Formato inválido. Ex.: 000.000.000-00' } })}
                    type="text"
                    value={cpf}
                    onChange={e => setCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={inputCls}
                  />
                </Campo>

                <Campo label="Email" error={errors.email?.message}>
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Campo obrigatório',
                      pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' }
                    })}
                    placeholder="seu@email.com"
                    className={inputCls}
                  />
                </Campo>

                <Campo label="WhatsApp" required={false}>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={e => setWhatsapp(formatTelefone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    className={inputCls}
                  />
                </Campo>
              </>
            )}

            {/* STEP 2 — Dados Profissionais */}
            {step === 2 && (
              <>
                <Campo label="Número do CRO" error={errors.cro?.message}>
                  <input
                    {...register('cro', {
                      required: 'Campo obrigatório',
                      pattern: {
                        value: /^CRO-[A-Z]{2}-\d{4,6}$/,
                        message: 'Formato inválido. Ex.: CRO-SP-12345',
                      },
                    })}
                    maxLength={12}
                    placeholder="CRO-SP-12345"
                    className={inputCls}
                  />
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

                <Campo label="Número do consultório" error={errors.nConsultorio?.message}>
                  <input
                    {...register('nConsultorio', { required: 'Obrigatório' })}
                    placeholder="Digite o número do seu consultório"
                    maxLength={4}
                    className={inputCls}
                  />
                </Campo>

                <Campo label="Especialidade" error={errors.especializacao?.message}>
                  <select {...register('especializacao', { required: 'Campo obrigatório' })} className={selectCls}>
                    <option value="">Selecione</option>
                    <option value="Clinico Geral">Clínico geral</option>
                    <option value="Ortodontia">Ortodontia</option>
                    <option value="Endodontia">Endodontia</option>
                    <option value="Periodontia">Periodontia</option>
                    <option value="Cirurgia">Cirurgia buco-maxilo-facial</option>
                    <option value="Pediatria">Odontopediatria</option>
                    <option value="Dentistica">Dentística e estética</option>
                    <option value="Implantodontia">Implantodontia</option>
                    <option value="Outra">Outra</option>
                  </select>
                </Campo>
              </>
            )}

            {/* STEP 3 — Atuação */}
            {step === 3 && (
              <>
                <Campo label="Disponibilidade" error={errors.disponibilidade?.message}>
                  <select {...register('disponibilidade', { required: 'Campo obrigatório' })} className={selectCls}>
                    <option value="">Selecione</option>
                    <option value="Fins de semana">Fins de semana</option>
                    <option value="Dias de semana">Dias de semana</option>
                    <option value="Ambos">Ambos</option>
                    <option value="Apenas mutiroes">Apenas mutirões</option>
                  </select>
                </Campo>

                <Campo label="Já participou de mutirões?" error={errors.participouAntes?.message}>
                  <select {...register('participouAntes', { required: 'Campo obrigatório' })} className={selectCls}>
                    <option value="">Selecione</option>
                    <option value="Sim">Sim, já participei</option>
                    <option value="Nao">Não, será minha primeira vez</option>
                  </select>
                </Campo>

                {/* Resumo */}
                <div className="bg-[#FFEDD5] border border-[#E88407]/30 rounded-xl p-4">
                  <p className="text-[11px] text-[#9A3412] uppercase tracking-wide font-bold mb-2">
                    Resumo do cadastro
                  </p>
                  <div className="flex flex-col gap-1 text-[12px]">
                    <p className="text-[#475569]">Nome: <span className="text-[#0F172A] font-semibold">{getValues('nome')}</span></p>
                    <p className="text-[#475569]">CRO: <span className="text-[#0F172A] font-semibold">{getValues('cro')}</span></p>
                    <p className="text-[#475569]">Especialidade: <span className="text-[#0F172A] font-semibold">{getValues('especializacao')}</span></p>
                    <p className="text-[#475569]">Email: <span className="text-[#0F172A] font-semibold">{getValues('email')}</span></p>
                  </div>
                </div>

                {/* Termos */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="termos"
                    {...register('aceitaTermos', { required: 'Você precisa aceitar os termos' })}
                    className="mt-1 cursor-pointer accent-[#E88407]"
                  />
                  <label htmlFor="termos" className="text-[12px] text-[#475569] cursor-pointer leading-relaxed">
                    Concordo em participar como dentista voluntário do programa da Turma do Bem, realizando atendimentos odontológicos gratuitos a adolescentes em vulnerabilidade social.
                  </label>
                </div>
                {errors.aceitaTermos && (
                  <p className="text-[11px] text-red-600">{errors.aceitaTermos.message}</p>
                )}
              </>
            )}

          </div>

          {/* Botões de navegação */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex-1 bg-[#F1F5F9] text-[#475569] font-semibold py-3 rounded-xl hover:bg-[#E2E8F0] transition-colors cursor-pointer border-none text-[14px]"
              >
                Voltar
              </button>
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 bg-[#E88407] text-white font-semibold py-3 rounded-xl hover:bg-[#D67606] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none text-[14px]"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                onClick={enviarFormulario}
                disabled={enviando}
                className="flex-1 bg-[#E88407] text-white font-semibold py-3 rounded-xl hover:bg-[#D67606] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none text-[14px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {enviando ? 'Enviando...' : 'Enviar cadastro'}
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
    </div>
  )
}