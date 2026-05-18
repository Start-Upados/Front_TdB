import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { dentistaService } from '../../Services/api'
import { appendSheet } from '../../Services/googleSheets'

// ─── TIPOS ────────────────────────────────────
interface FormData {
  // Pessoais
  nome:             string
  rgCpf:            string
  email:            string
  telefone:         string
  cro:              string
  especializacao:    string
  cep:              string
  nConsultorio:     number
  // Atuação
  //cidade:           string
  //estado:           string
  //clinica:          string
  disponibilidade:  string
  participouAntes:  string
  aceitaTermos:     boolean
}

// ─── UTILITÁRIOS ──────────────────────────────
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
  // Ex: "joao123" — primeiros 4 chars do nome + 3 números aleatórios
  const base = nome.toLowerCase().replace(/\s+/g, '').slice(0, 4)
  const num  = Math.floor(Math.random() * 900) + 100
  return `${base}${num}`
}

/*
// ─── ESTADOS DO BRASIL ────────────────────────
const ESTADOS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA',
  'MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN',
  'RO','RR','RS','SC','SE','SP','TO'
] */

// ─── STEP INDICATOR ───────────────────────────
function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all duration-300 ${
            i + 1 < step
              ? 'bg-green-500 text-white'
              : i + 1 === step
              ? 'bg-amber-400 text-[#07111E]'
              : 'bg-white/10 text-white/40'
          }`}>
            {i + 1 < step ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`w-8 h-0.5 transition-all duration-300 ${
              i + 1 < step ? 'bg-green-500' : 'bg-white/10'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── CAMPO REUTILIZÁVEL ───────────────────────
function Campo({
  label, error, required = true, children
}: {
  label: string; error?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[11px] text-white font-semibold mb-1.5 uppercase tracking-[0.6px]">
        {label} {required && <span className="text-amber-400">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}

const inputCls = "w-full bg-[#07111E] border border-[rgba(0,212,170,0.15)] text-[#E8F4FD] placeholder-[#3D6A85] rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#00D4AA] transition-colors duration-200"
const selectCls = "w-full bg-[#07111E] border border-[rgba(0,212,170,0.15)] text-[#E8F4FD] rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#00D4AA] transition-colors duration-200"

// ─── TELA DE SUCESSO ──────────────────────────
function TelaSucesso({ protocolo, onVoltar }: { protocolo: string, senha: string; onVoltar: () => void }) {
  
  return (
    <div className="w-full max-w-md">
      <div className="bg-blue-600 border border-amber-400 rounded-2xl p-8 shadow-2xl text-center">

        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">✓</span>
        </div>

        <h2 className="text-[20px] font-bold text-amber-400 mb-2">
          Cadastro enviado!
        </h2>
        <p className="text-white/70 text-[13px] mb-6">
          Seu cadastro foi registrado com sucesso. Guarde o número do protocolo para acompanhar sua solicitação.
        </p>

        <div className="bg-[#07111E]/40 border border-amber-400/30 rounded-xl p-4 mb-6">
          <p className="text-[11px] text-white/50 uppercase tracking-wide mb-1">
            Número do protocolo
          </p>
          <p className="text-[24px] font-extrabold text-amber-400">
            #{protocolo}
          </p>
        </div>

        <div className="bg-[#07111E]/30 border border-[rgba(0,212,170,0.2)] rounded-xl p-4 mb-6 text-left">
          <p className="text-[11px] text-[#00D4AA] uppercase tracking-wide font-bold mb-3">
            Proximos passos
          </p>
          <div className="flex flex-col gap-2">
            {[
              'A equipe da Turma do Bem analisara seu cadastro',
              'Voce sera contatado pelo email ou WhatsApp cadastrado',
              'Prazo de resposta: ate 7 dias uteis',
              'Guarde o protocolo para consultas futuras',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#00D4AA] text-[11px] mt-0.5 shrink-0">{i + 1}.</span>
                <p className="text-white/60 text-[12px]">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="w-full bg-amber-400 text-[#07111E] font-bold py-3 rounded-lg hover:bg-amber-500 transition-colors duration-200 text-center text-[14px] no-underline"
          >
            Voltar ao login
          </Link>
          <button
            onClick={onVoltar}
            className="w-full bg-[#07111E]/40 text-white/60 font-semibold py-2.5 rounded-lg hover:bg-[#07111E]/60 transition-colors cursor-pointer border-none text-[13px]"
          >
            Novo cadastro
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CADASTRAR VOLUNTÁRIO (PRINCIPAL) ─────────
export default function CadastrarVoluntario() {
  const [step,      setStep]      = useState(1)
  const [enviando,  setEnviando]  = useState(false)
  const [enviado,   setEnviado]   = useState(false)
  const [protocolo, setProtocolo] = useState('')
  const [cpf,       setCpf]       = useState('')
  const [whatsapp,  setWhatsapp]  = useState('')
  const [senha, setSenha] = useState('')

  const { register, trigger, formState: { errors }, getValues, reset } = useForm<FormData>()

  const TOTAL_STEPS = 3
  const stepLabels  = ['Pessoais', 'Profissional', 'Atuacao']

  async function nextStep() {
    const fieldsPerStep: (keyof FormData)[][] = [
      ['nome', 'rgCpf', 'email', 'telefone', ],
      ['cro', 'especializacao', 'cep', 'nConsultorio'],
      ['disponibilidade', 'aceitaTermos'],
    ]
    const valid = await trigger(fieldsPerStep[step - 1])
    if (valid) setStep(s => s + 1)
  }

  async function enviarFormulario() {
  const valid = await trigger(['cep', 'disponibilidade', 'aceitaTermos'])
  if (!valid) return

  const data       = getValues()
  const senhaGerada = gerarSenha(data.nome)
  const prot       = gerarProtocolo()
  const agora      = new Date()
  const dataStr    = agora.toLocaleDateString('pt-BR')

  setEnviando(true)

  try {
    // 1. Backend Java
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
    // 2. Google Sheets (sempre salva como backup)
    await appendSheet('Voluntarios!A:O', [[
      data.nome,
      cpf,
      data.cro,
      data.especializacao,
      data.email,
      whatsapp,
      data.disponibilidade,
      data.participouAntes,
      'Aguardando analise',
      dataStr,
      prot,
      senhaGerada,       // ← coluna O
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
      <div className="min-h-screen bg-[#07111E] flex items-center justify-center p-4">
        <TelaSucesso protocolo={protocolo} senha={senha} onVoltar={() => { setEnviado(false); setStep(1) }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#07111E] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-blue-600 border border-amber-400 rounded-2xl p-8 shadow-2xl">

          {/* Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-amber-400 mb-3 bg-[#07111E]/40">
              <span className="text-xl">🦷</span>
            </div>
            <h1 className="text-[20px] font-bold text-amber-400">Cadastro de Voluntário</h1>
            <p className="text-white/60 text-[12px] mt-1">Turma do Bem — Seja um dentista voluntário</p>
          </div>

          {/* Step indicator */}
          <StepIndicator step={step} total={TOTAL_STEPS} />

          {/* Step labels */}
          <div className="flex justify-between mb-5">
            {stepLabels.map((label, i) => (
              <p key={i} className={`text-[11px] font-semibold transition-colors ${
                i + 1 === step ? 'text-amber-400' : 'text-white/30'
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
                    {...register('nome', { required: 'Campo obrigatorio' })}
                    placeholder="Seu nome completo"
                    className={inputCls}
                  />
                </Campo>

                <Campo label="CPF">
                  <input
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
                      required: 'Campo obrigatorio',
                      pattern: { value: /^\S+@\S+$/i, message: 'Email invalido' }
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
                <Campo label="Numero do CRO" error={errors.cro?.message}>
                  <input
                    {...register('cro', { required: 'Campo obrigatorio' })}
                    placeholder="CRO-SP-12345"
                    className={inputCls}
                  />
                </Campo>

                
                  <Campo label="Cep" error={errors.cep?.message}>
                    <input
                      {...register('cep', { required: 'Obrigatorio' })}
                      placeholder="Digite seu CEP"
                      className={inputCls}
                    />
                  </Campo>      
                

                
                  <Campo label="Número do Consultorio" error={errors.nConsultorio?.message}>
                    <input
                      {...register('nConsultorio', { required: 'Obrigatorio' })}
                      placeholder="Digite o número do seu Consultório"
                      className={inputCls}
                    />
                  </Campo>      
                               

                <Campo label="Especialidade" error={errors.especializacao?.message}>
                  <select {...register('especializacao', { required: 'Campo obrigatorio' })} className={selectCls}>
                    <option value="">Selecione</option>
                    <option value="Clinico Geral">Clinico Geral</option>
                    <option value="Ortodontia">Ortodontia</option>
                    <option value="Endodontia">Endodontia</option>
                    <option value="Periodontia">Periodontia</option>
                    <option value="Cirurgia">Cirurgia Buco-Maxilo-Facial</option>
                    <option value="Pediatria">Odontopediatria</option>
                    <option value="Dentistica">Dentistica e Estética</option>
                    <option value="Implantodontia">Implantodontia</option>
                    <option value="Outra">Outra</option>
                  </select>
                </Campo>
              </>
            )}

            {/* CEP */}
            {step === 3 && (
              <>
                
                <Campo label="Disponibilidade" error={errors.disponibilidade?.message}>
                  <select {...register('disponibilidade', { required: 'Campo obrigatorio' })} className={selectCls}>
                    <option value="">Selecione</option>
                    <option value="Fins de semana">Fins de semana</option>
                    <option value="Dias de semana">Dias de semana</option>
                    <option value="Ambos">Ambos</option>
                    <option value="Apenas mutiroes">Apenas mutirões</option>
                  </select>
                </Campo>

                <Campo label="Ja participou de mutiroes?" error={errors.participouAntes?.message}>
                  <select {...register('participouAntes', { required: 'Campo obrigatorio' })} className={selectCls}>
                    <option value="">Selecione</option>
                    <option value="Sim">Sim, ja participei</option>
                    <option value="Nao">Não, será minha primeira vez</option>
                  </select>
                </Campo>

                {/* Resumo */}
                <div className="bg-[#07111E]/40 border border-[rgba(0,212,170,0.2)] rounded-xl p-4">
                  <p className="text-[11px] text-[#00D4AA] uppercase tracking-wide font-bold mb-2">
                    Resumo do cadastro
                  </p>
                  <div className="flex flex-col gap-1 text-[12px]">
                    <p className="text-white/60">Nome: <span className="text-white font-semibold">{getValues('nome')}</span></p>
                    <p className="text-white/60">CRO: <span className="text-white font-semibold">{getValues('cro')}</span></p>
                    <p className="text-white/60">Especialidade: <span className="text-white font-semibold">{getValues('especializacao')}</span></p>
                    <p className="text-white/60">Email: <span className="text-white font-semibold">{getValues('email')}</span></p>
                  </div>
                </div>

                {/* Termos */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="termos"
                    {...register('aceitaTermos', { required: 'Voce precisa aceitar os termos' })}
                    className="mt-1 cursor-pointer"
                  />
                  <label htmlFor="termos" className="text-[12px] text-white/60 cursor-pointer leading-relaxed">
                    Concordo em participar como dentista voluntário do programa da Turma do Bem, realizando atendimentos odontológicos gratuitos a adolescentes em vulnerabilidade social.
                  </label>
                </div>
                {errors.aceitaTermos && (
                  <p className="text-[11px] text-red-400">{errors.aceitaTermos.message}</p>
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
                className="flex-1 bg-[#07111E]/40 text-white/70 font-semibold py-3 rounded-lg hover:bg-[#07111E]/60 transition-colors cursor-pointer border-none text-[14px]"
              >
                Voltar
              </button>
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 bg-amber-400 text-[#07111E] font-bold py-3 rounded-lg hover:bg-amber-500 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none text-[14px]"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                onClick={enviarFormulario}
                disabled={enviando}
                className="flex-1 bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none text-[14px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {enviando ? 'Enviando...' : 'Enviar cadastro'}
              </button>
            )}
          </div>

        </div>

        <p className="text-center mt-5 text-[13px]">
          <Link to="/login" className="text-[#7EB3CE] hover:text-amber-400 transition-colors">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  )
}