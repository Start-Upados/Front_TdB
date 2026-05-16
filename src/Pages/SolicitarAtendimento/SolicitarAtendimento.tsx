import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { appendSheet } from '../../Services/googleSheets'
import { QRCodeSVG } from 'qrcode.react'


interface FormData {
  // Adolescente
  nomeAdolescente:    string
  dataNascimento:     string
  cidade:             string
  estado:             string
  rendaFamiliar:      string
  necessidade:        string
  // Responsável
  nomeResponsavel:    string
  parentesco:         string
  whatsapp:           string
  telefone:           string
  email:              string
  endereco:           string
  // Atendimento
  comoSoube:          string
  observacoes:        string
  // Termos
  aceitaTermos:       boolean
}


function gerarProtocolo(): string {
  const ano  = new Date().getFullYear()
  const num  = Math.floor(Math.random() * 9000) + 1000
  return `TDB-${ano}-${num}`
}

function formatWhatsApp(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11)
  if (nums.length <= 2)  return `(${nums}`
  if (nums.length <= 7)  return `(${nums.slice(0,2)}) ${nums.slice(2)}`
  if (nums.length <= 11) return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`
  return nums
}

const ESTADOS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA',
  'MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN',
  'RO','RR','RS','SC','SE','SP','TO'
]


function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
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

// CAMPO REUTILIZÁVEL
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
      {error && (
        <p className="text-[11px] text-red-400 mt-1">{error}</p>
      )}
    </div>
  )
}

const inputCls = "w-full bg-[#07111E] border border-[rgba(0,212,170,0.15)] text-[#E8F4FD] placeholder-[#3D6A85] rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#00D4AA] transition-colors duration-200"
const selectCls = "w-full bg-[#07111E] border border-[rgba(0,212,170,0.15)] text-[#E8F4FD] rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#00D4AA] transition-colors duration-200"

// TELA DE SUCESSO
function TelaSucesso({ protocolo, onVoltar }: { protocolo: string; onVoltar: () => void }) {
  return (
    <div className="w-full max-w-md">
      <div className="bg-blue-600 border border-amber-400 rounded-2xl p-8 shadow-2xl text-center">

        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#1a1a2e] border border-green-500/40 flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl text-white">✓</span>
        </div>

        <h2 className="text-[20px] font-bold text-amber-400 mb-2">
          Solicitacao enviada!
        </h2>
        <p className="text-white/70 text-[13px] mb-6">
          Sua solicitacao foi registrada com sucesso. Guarde o numero do protocolo para acompanhar seu atendimento.
        </p>

        <div className="bg-[#07111E]/40 border border-amber-400/30 rounded-xl p-4 mb-6">
          <p className="text-[11px] text-white/50 uppercase tracking-wide mb-1">
            Numero do protocolo
          </p>
          <p className="text-[24px] font-extrabold text-amber-400">
            #{protocolo}
          </p>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="bg-white p-3 rounded-xl">
            <QRCodeSVG
              value={`https://www.startupados.com.br/validar-paciente?protocolo=${protocolo}`}
              size={160}
              bgColor="#ffffff"
              fgColor="#07111E"
              level="H"
            />
          </div>
          <p className="text-white/60 text-[12px] mt-3">Escaneie para acessar seu painel</p>
          <p className="text-white/30 text-[10px] mt-1 font-mono">startupados.com.br/login</p>
        </div>

        <div className="bg-[#07111E]/30 border border-[rgba(0,212,170,0.2)] rounded-xl p-4 mb-6 text-left">
          <p className="text-[11px] text-[#00D4AA] uppercase tracking-wide font-bold mb-3">
            Proximos passos
          </p>
          <div className="flex flex-col gap-2">
            {[
              'A equipe da Turma do Bem analisara sua solicitacao',
              'Voce sera contatado pelo WhatsApp ou email cadastrado',
              'Prazo de resposta: ate 5 dias uteis',
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
            Voltar ao inicio
          </Link>
          <button
            onClick={onVoltar}
            className="w-full bg-[#07111E]/40 text-white/60 font-semibold py-2.5 rounded-lg hover:bg-[#07111E]/60 transition-colors cursor-pointer border-none text-[13px]"
          >
            Nova solicitacao
          </button>
        </div>
      </div>
    </div>
  )
}

// SOLICITAR ATENDIMENTO (PRINCIPAL)
export default function SolicitarAtendimento() {
  const [step,      setStep]      = useState(1)
  const [enviando,  setEnviando]  = useState(false)
  const [enviado,   setEnviado]   = useState(false)
  const [protocolo, setProtocolo] = useState('')
  const [whatsapp,  setWhatsapp]  = useState('')
  const [telefone,  setTelefone]  = useState('')

  const { register, trigger, formState: { errors }, getValues } = useForm<FormData>()

  const TOTAL_STEPS = 3

  const stepLabels = ['Adolescente', 'Responsavel', 'Atendimento']

  async function nextStep() {
    const fieldsPerStep: (keyof FormData)[][] = [
      ['nomeAdolescente', 'dataNascimento', 'cidade', 'estado', 'rendaFamiliar', 'necessidade'],
      ['nomeResponsavel', 'parentesco', 'email', 'endereco'],
      ['comoSoube', 'aceitaTermos'],
    ]
    const valid = await trigger(fieldsPerStep[step - 1])
    if (valid) setStep(s => s + 1)
  }

  async function enviarFormulario() {
  const valid = await trigger(['comoSoube', 'aceitaTermos'])
  if (!valid) return

  const data = getValues()
  setEnviando(true)

  const prot = gerarProtocolo()
  const agora = new Date()
  const dataStr = agora.toLocaleDateString('pt-BR')
  const horaStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  try {
    await appendSheet('Mensagens!A:N', [[
      prot,
      data.nomeResponsavel,
      data.email,
      whatsapp,
      telefone,
      'Solicitacao de Atendimento',
      `Adolescente: ${data.nomeAdolescente} | Nascimento: ${data.dataNascimento} | Cidade: ${data.cidade}/${data.estado} | Renda: ${data.rendaFamiliar} | Necessidade: ${data.necessidade} | Responsavel: ${data.nomeResponsavel} (${data.parentesco}) | Endereco: ${data.endereco} | Como soube: ${data.comoSoube} | Obs: ${data.observacoes || 'Nenhuma'}`,
      'Site',
      'Solicitacao',
      'Aguardando',
      dataStr,
      horaStr,
      data.cidade,
      data.estado,
    ]])

    await appendSheet('Pacientes!A:Q', [[
      data.nomeAdolescente,
      '',
      data.cidade,
      'Dentista do Bem',
      'Aguardando',
      dataStr,
      '',
      '',
      '',
      '',
      '',
      data.endereco,
      '0',
      '0',
      data.necessidade,
      data.observacoes ?? '',
      prot,
    ]])

    setProtocolo(prot)
    setEnviado(true)

  } catch (err) {
    console.error('Erro ao enviar:', err)
    alert('Erro ao enviar. Tente novamente.')
  } finally {
    setEnviando(false)
  }
}

if (enviado) {
  return (
    <div className="min-h-screen bg-[#07111E] flex items-center justify-center p-4">
      <TelaSucesso
        protocolo={protocolo}
        onVoltar={() => { setEnviado(false); setStep(1) }}
      />
    </div>
  )
}

  return (
    <div className="min-h-screen bg-[#07111E] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-blue-600 border border-amber-400 rounded-2xl p-8 shadow-2xl">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-amber-400 mb-3 bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#1a1a2e]">
              <span className="text-xl">🦷</span>
            </div>
            <h1 className="text-[20px] font-bold text-amber-400">Solicitar Atendimento</h1>
            <p className="text-white/60 text-[12px] mt-1">Turma do Bem — Cadastro gratuito</p>
          </div>

          {/* Step indicator */}
          <StepIndicator step={step} total={TOTAL_STEPS} />

          {/* Step label */}
          <div className="flex justify-between mb-6">
            {stepLabels.map((label, i) => (
              <p key={i} className={`text-[11px] font-semibold transition-colors ${
                i + 1 === step ? 'text-amber-400' : 'text-white/30'
              }`}>
                {label}
              </p>
            ))}
          </div>

          <form>

            {/* STEP 1 — Adolescente */}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <Campo label="Nome completo do adolescente" error={errors.nomeAdolescente?.message}>
                  <input
                    {...register('nomeAdolescente', { required: 'Campo obrigatorio' })}
                    placeholder="Nome completo"
                    className={inputCls}
                  />
                </Campo>

                <Campo label="Data de nascimento" error={errors.dataNascimento?.message}>
                  <input
                    type="date"
                    {...register('dataNascimento', { required: 'Campo obrigatorio' })}
                    className={inputCls}
                  />
                </Campo>

                <div className="grid grid-cols-2 gap-3">
                  <Campo label="Cidade" error={errors.cidade?.message}>
                    <input
                      {...register('cidade', { required: 'Obrigatorio' })}
                      placeholder="Sua cidade"
                      className={inputCls}
                    />
                  </Campo>
                  <Campo label="Estado" error={errors.estado?.message}>
                    <select {...register('estado', { required: 'Obrigatorio' })} className={selectCls}>
                      <option value="">UF</option>
                      {ESTADOS.map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </Campo>
                </div>

                <Campo label="Renda familiar" error={errors.rendaFamiliar?.message}>
                  <select {...register('rendaFamiliar', { required: 'Campo obrigatorio' })} className={selectCls}>
                    <option value="">Selecione</option>
                    <option value="Ate 1 salario minimo">Ate 1 salario minimo</option>
                    <option value="1 a 2 salarios minimos">1 a 2 salarios minimos</option>
                    <option value="2 a 3 salarios minimos">2 a 3 salarios minimos</option>
                    <option value="Acima de 3 salarios minimos">Acima de 3 salarios minimos</option>
                  </select>
                </Campo>

                <Campo label="Necessidade odontologica" error={errors.necessidade?.message}>
                  <select {...register('necessidade', { required: 'Campo obrigatorio' })} className={selectCls}>
                    <option value="">Selecione</option>
                    <option value="Tratamento de canal">Tratamento de canal</option>
                    <option value="Extracao">Extracao</option>
                    <option value="Restauracao">Restauracao</option>
                    <option value="Ortodontia (aparelho)">Ortodontia (aparelho)</option>
                    <option value="Limpeza e prevencao">Limpeza e prevencao</option>
                    <option value="Outro">Outro</option>
                  </select>
                </Campo>
              </div>
            )}

            {/* STEP 2 — Responsável */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <Campo label="Nome do responsavel" error={errors.nomeResponsavel?.message}>
                  <input
                    {...register('nomeResponsavel', { required: 'Campo obrigatorio' })}
                    placeholder="Nome completo do responsavel"
                    className={inputCls}
                  />
                </Campo>

                <Campo label="Parentesco" error={errors.parentesco?.message}>
                  <select {...register('parentesco', { required: 'Campo obrigatorio' })} className={selectCls}>
                    <option value="">Selecione</option>
                    <option value="Pai">Pai</option>
                    <option value="Mae">Mae</option>
                    <option value="Avo/Ava">Avo/Ava</option>
                    <option value="Tutor legal">Tutor legal</option>
                    <option value="Outro responsavel">Outro responsavel</option>
                  </select>
                </Campo>

                <div className="grid grid-cols-2 gap-3">
                  <Campo label="WhatsApp" required={false}>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={e => setWhatsapp(formatWhatsApp(e.target.value))}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      className={inputCls}
                    />
                  </Campo>
                  <Campo label="Telefone" required={false}>
                    <input
                      type="tel"
                      value={telefone}
                      onChange={e => setTelefone(formatWhatsApp(e.target.value))}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      className={inputCls}
                    />
                  </Campo>
                </div>

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

                <Campo label="Endereco completo" error={errors.endereco?.message}>
                  <input
                    {...register('endereco', { required: 'Campo obrigatorio' })}
                    placeholder="Rua, numero, bairro, cidade"
                    className={inputCls}
                  />
                </Campo>
              </div>
            )}

            {/* STEP 3 — Atendimento */}
            {step === 3 && (
              <div className="flex flex-col gap-4">
                <Campo label="Como soube da Turma do Bem?" error={errors.comoSoube?.message}>
                  <select {...register('comoSoube', { required: 'Campo obrigatorio' })} className={selectCls}>
                    <option value="">Selecione</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Indicacao de amigo/familiar">Indicacao de amigo/familiar</option>
                    <option value="Escola">Escola</option>
                    <option value="Posto de saude">Posto de saude</option>
                    <option value="Site da Turma do Bem">Site da Turma do Bem</option>
                    <option value="Outro">Outro</option>
                  </select>
                </Campo>

                <Campo label="Observacoes" required={false}>
                  <textarea
                    {...register('observacoes')}
                    placeholder="Descreva mais detalhes sobre a necessidade do adolescente..."
                    rows={4}
                    className={`${inputCls} resize-none`}
                  />
                </Campo>

                {/* Resumo */}
                <div className="bg-[#07111E]/40 border border-[rgba(0,212,170,0.2)] rounded-xl p-4">
                  <p className="text-[11px] text-[#00D4AA] uppercase tracking-wide font-bold mb-2">
                    Resumo da solicitacao
                  </p>
                  <div className="flex flex-col gap-1 text-[12px]">
                    <p className="text-white/60">
                      Adolescente: <span className="text-white font-semibold">{getValues('nomeAdolescente')}</span>
                    </p>
                    <p className="text-white/60">
                      Cidade: <span className="text-white font-semibold">{getValues('cidade')}/{getValues('estado')}</span>
                    </p>
                    <p className="text-white/60">
                      Necessidade: <span className="text-white font-semibold">{getValues('necessidade')}</span>
                    </p>
                    <p className="text-white/60">
                      Responsavel: <span className="text-white font-semibold">{getValues('nomeResponsavel')}</span>
                    </p>
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
                    Concordo que os dados fornecidos sejam utilizados pela Turma do Bem para fins de agendamento e contato para atendimento odontologico gratuito.
                  </label>
                </div>
                {errors.aceitaTermos && (
                  <p className="text-[11px] text-red-400">{errors.aceitaTermos.message}</p>
                )}
              </div>
            )}

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
                    className="flex-1 bg-amber-400 text-[#07111E] font-bold py-3 rounded-lg hover:bg-green-500 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none text-[14px] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                    {enviando ? 'Enviando...' : 'Enviar solicitacao'}
                </button>
              )}
            </div>

          </form>
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