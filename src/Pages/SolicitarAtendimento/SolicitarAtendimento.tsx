import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { appendSheet } from '../../Services/googleSheets'
import { QRCodeSVG } from 'qrcode.react'
import { solicitacaoService } from '../../Services/api'

// ─── TIPOS ────────────────────────────────────
type TipoAtendimento = 'selecao' | 'jovem' | 'mulher'

interface FormJovem {
  nomeAdolescente:  string
  dataNascimento:   string
  cidade:           string
  estado:           string
  rendaFamiliar:    string
  necessidade:      string
  nomeResponsavel:  string
  parentesco:       string
  whatsapp:         string
  telefone:         string
  email:            string
  endereco:         string
  comoSoube:        string
  observacoes:      string
  aceitaTermos:     boolean
}

interface FormMulher {
  nome:             string
  dataNascimento:   string
  cidade:           string
  estado:           string
  endereco:         string
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

{/*
function formatCPF(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11)
  if (nums.length <= 3) return nums
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`
  if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`
} */}

function formatTelefone(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11)
  if (nums.length <= 2)  return `(${nums}`
  if (nums.length <= 7)  return `(${nums.slice(0, 2)}) ${nums.slice(2)}`
  if (nums.length <= 11) return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`
  return nums
}

// ─── ESTADOS DO BRASIL ────────────────────────
const ESTADOS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA',
  'MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN',
  'RO','RR','RS','SC','SE','SP','TO'
]

// ─── STEP INDICATOR ───────────────────────────
function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all duration-300 ${
            i + 1 < step  ? 'bg-green-500 text-white' :
            i + 1 === step ? 'bg-amber-400 text-[#07111E]' :
            'bg-white/10 text-white/40'
          }`}>
            {i + 1 < step ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`w-8 h-0.5 transition-all duration-300 ${i + 1 < step ? 'bg-green-500' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── CAMPO REUTILIZÁVEL ───────────────────────
function Campo({ label, error, required = true, children }: {
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

const inputCls  = "w-full bg-[#07111E] border border-[rgba(0,212,170,0.15)] text-[#E8F4FD] placeholder-[#3D6A85] rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#00D4AA] transition-colors duration-200"
const selectCls = "w-full bg-[#07111E] border border-[rgba(0,212,170,0.15)] text-[#E8F4FD] rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#00D4AA] transition-colors duration-200"

// ─── TELA DE SUCESSO ──────────────────────────
function TelaSucesso({ protocolo, tipo, onVoltar }: {
  protocolo: string; tipo: 'jovem' | 'mulher'; onVoltar: () => void
}) {
  const isApolonas = tipo === 'mulher'

  return (
    <div className="w-full max-w-md">
      <div className="bg-blue-600 border border-amber-400 rounded-2xl p-8 shadow-2xl text-center">

        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">✓</span>
        </div>

        <h2 className="text-[20px] font-bold text-amber-400 mb-2">Solicitacao enviada!</h2>
        <p className="text-white/70 text-[13px] mb-2">
          {isApolonas
            ? 'Sua solicitacao para o programa Apolônias do Bem foi registrada.'
            : 'Sua solicitacao foi registrada com sucesso.'}
        </p>
        <p className="text-white/50 text-[12px] mb-6">Guarde o protocolo para acompanhar seu atendimento.</p>

        <div className="bg-[#07111E]/40 border border-amber-400/30 rounded-xl p-4 mb-5">
          <p className="text-[11px] text-white/50 uppercase tracking-wide mb-1">Numero do protocolo</p>
          <p className="text-[24px] font-extrabold text-amber-400">#{protocolo}</p>
          {isApolonas && (
            <p className="text-[11px] text-[#00D4AA] mt-1">Programa Apolônias do Bem</p>
          )}
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center mb-5">
          <div className="bg-white p-3 rounded-xl">
            <QRCodeSVG
              value={`https://www.startupados.com.br/validar-paciente?protocolo=${protocolo}`}
              size={150}
              bgColor="#ffffff"
              fgColor="#07111E"
              level="H"
            />
          </div>
          <p className="text-white/60 text-[12px] mt-3">Escaneie para acessar seu painel</p>
          <p className="text-white/30 text-[10px] mt-1 font-mono">startupados.com.br/validar-paciente</p>
        </div>

        <div className="bg-[#07111E]/30 border border-[rgba(0,212,170,0.2)] rounded-xl p-4 mb-6 text-left">
          <p className="text-[11px] text-[#00D4AA] uppercase tracking-wide font-bold mb-3">Proximos passos</p>
          <div className="flex flex-col gap-2">
            {(isApolonas ? [
              'A equipe da Turma do Bem analisara sua solicitação',
              'Voce sera contatada para uma triagem oral gratuita',
              'Prazo de resposta: ate 5 dias uteis',
              'Guarde o protocolo para consultas futuras',
            ] : [
              'A equipe da Turma do Bem analisara sua solicitação',
              'Voce sera contatado pelo WhatsApp ou email cadastrado',
              'Prazo de resposta: ate 5 dias uteis',
              'Guarde o protocolo para consultas futuras',
            ]).map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#00D4AA] text-[11px] mt-0.5 shrink-0">{i + 1}.</span>
                <p className="text-white/60 text-[12px]">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/login" className="w-full bg-amber-400 text-[#07111E] font-bold py-3 rounded-lg hover:bg-amber-500 transition-colors duration-200 text-center text-[14px] no-underline">
            Voltar ao inicio
          </Link>
          <button onClick={onVoltar} className="w-full bg-[#07111E]/40 text-white/60 font-semibold py-2.5 rounded-lg hover:bg-[#07111E]/60 transition-colors cursor-pointer border-none text-[13px]">
            Nova solicitacao
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── TELA DE SELEÇÃO ──────────────────────────
function TelaSelecao({ onSelect }: { onSelect: (tipo: 'jovem' | 'mulher') => void }) {
  return (
    <div className="w-full max-w-md">
      <div className="bg-blue-600 border border-amber-400 rounded-2xl p-8 shadow-2xl">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-amber-400 mb-4 bg-[#07111E]/40">
            <span className="text-2xl">🦷</span>
          </div>
          <h1 className="text-[20px] font-bold text-amber-400">Solicitar Atendimento</h1>
          <p className="text-white/60 text-[13px] mt-1">Qual tipo de atendimento voce precisa?</p>
        </div>

        <div className="flex flex-col gap-4 mb-6">

          {/* Jovem */}
          <button
            onClick={() => onSelect('jovem')}
            className="flex items-center gap-4 w-full p-5 rounded-xl border-2 border-amber-400/30 hover:border-amber-400 hover:bg-[#07111E]/30 transition-all duration-200 cursor-pointer text-left"
          >
            <div className="w-14 h-14 rounded-full bg-[#07111E]/40 flex items-center justify-center text-2xl shrink-0">
              👦
            </div>
            <div>
              <p className="font-bold text-amber-400 text-[15px]">Dentista do Bem</p>
              <p className="text-white/70 text-[12px] mt-0.5">Para jovens de 11 a 17 anos</p>
              <p className="text-white/40 text-[11px] mt-0.5">Tratamento odontologico gratuito</p>
            </div>
            <span className="text-amber-400 ml-auto text-[18px]">→</span>
          </button>

          {/* Mulher */}
          <button
            onClick={() => onSelect('mulher')}
            className="flex items-center gap-4 w-full p-5 rounded-xl border-2 border-[rgba(219,39,119,0.4)] hover:border-pink-400 hover:bg-[#07111E]/30 transition-all duration-200 cursor-pointer text-left"
          >
            <div className="w-14 h-14 rounded-full bg-[#07111E]/40 flex items-center justify-center text-2xl shrink-0">
              👩
            </div>
            <div>
              <p className="font-bold text-pink-400 text-[15px]">Apolônias do Bem</p>
              <p className="text-white/70 text-[12px] mt-0.5">Para mulheres vítimas de violência</p>
              <p className="text-white/40 text-[11px] mt-0.5">Tratamento odontológico gratuito via triagem</p>
            </div>
            <span className="text-pink-400 ml-auto text-[18px]">→</span>
          </button>

        </div>

        <div className="text-center pt-4 border-t border-amber-400/20">
          <p className="text-[11px] text-white/40">
            Sistema desenvolvido por{' '}
            <Link to="/" className="text-amber-400 font-semibold hover:underline">StartUpados()</Link>
          </p>
        </div>
      </div>

      <p className="text-center mt-5 text-[13px]">
        <Link to="/login" className="text-[#7EB3CE] hover:text-amber-400 transition-colors">← Voltar ao login</Link>
      </p>
    </div>
  )
}

// ─── FORMULÁRIO DO JOVEM ──────────────────────
function FormularioJovem({ onSucesso }: { onSucesso: (prot: string) => void }) {
  const [step,     setStep]     = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [whatsapp, setWhatsapp] = useState('')
  const [telefone, setTelefone] = useState('')

  const { register, trigger, formState: { errors }, getValues } = useForm<FormJovem>()

  const TOTAL_STEPS = 3
  const stepLabels  = ['Adolescente', 'Responsavel', 'Atendimento']

  async function nextStep() {
    const fieldsPerStep: (keyof FormJovem)[][] = [
      ['nomeAdolescente', 'dataNascimento', 'cidade', 'estado', 'rendaFamiliar', 'necessidade'],
      ['nomeResponsavel', 'parentesco', 'email', 'endereco'],
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
  const agora   = new Date()
  const dataStr = agora.toLocaleDateString('pt-BR')
  const horaStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  try {
    // 1. Backend Java
    console.log('Tentando backend Java...')
    await solicitacaoService.cadastrar({
      nome:        data.nomeResponsavel,
      rgCpf:       prot,                  // protocolo como ID único
      email:       data.email,
      senha:       '123456',
      telefone:    whatsapp || telefone,
      cep:         '00000000',
      necessidade: data.necessidade,
      sexo:        'masculino',
      descricao:   data.observacoes ?? '',
      dataNasc:    data.dataNascimento,
      renda:       data.rendaFamiliar,
      responsavel: data.nomeResponsavel,
      comoSoube:   data.comoSoube,
      parentesco:  data.parentesco,
    })
    console.log('Backend Java: sucesso!')
  } catch (err) {
    console.warn('Backend indisponivel, salvando no Sheets:', err)
  }

  try {
    // 2. Google Sheets (sempre salva como backup)
    await appendSheet('Mensagens!A:N', [[
      prot, data.nomeResponsavel, data.email, whatsapp, telefone,
      'Solicitacao de Atendimento — Dentista do Bem',
      `Adolescente: ${data.nomeAdolescente} | Nascimento: ${data.dataNascimento} | Cidade: ${data.cidade}/${data.estado} | Renda: ${data.rendaFamiliar} | Necessidade: ${data.necessidade} | Responsavel: ${data.nomeResponsavel} (${data.parentesco}) | Endereco: ${data.endereco} | Como soube: ${data.comoSoube} | Obs: ${data.observacoes || 'Nenhuma'}`,
      'Site', 'Solicitacao', 'Aguardando', dataStr, horaStr, data.cidade, data.estado,
    ]])
    await appendSheet('Pacientes!A:Q', [[
      data.nomeAdolescente, '', data.cidade, 'Dentista do Bem', 'Aguardando',
      dataStr, '', '', '', '', '', data.endereco, '0', '0', data.necessidade,
      data.observacoes ?? '', prot,
    ]])
  } catch (err) {
    console.error('Erro ao salvar no Sheets:', err)
    alert('Erro ao enviar. Tente novamente.')
    setEnviando(false)
    return
  }

  onSucesso(prot)
  setEnviando(false)
}

  return (
    <div className="w-full max-w-lg">
      <div className="bg-blue-600 border border-amber-400 rounded-2xl p-8 shadow-2xl">

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-amber-400 mb-3 bg-[#07111E]/40">
            <span className="text-xl">👦</span>
          </div>
          <h1 className="text-[20px] font-bold text-amber-400">Dentista do Bem</h1>
          <p className="text-white/60 text-[12px] mt-1">Cadastro gratuito para jovens</p>
        </div>

        <StepIndicator step={step} total={TOTAL_STEPS} />
        <div className="flex justify-between mb-5">
          {stepLabels.map((label, i) => (
            <p key={i} className={`text-[11px] font-semibold ${i + 1 === step ? 'text-amber-400' : 'text-white/30'}`}>{label}</p>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {step === 1 && (
            <>
              <Campo label="Nome completo do adolescente" error={errors.nomeAdolescente?.message}>
                <input {...register('nomeAdolescente', { required: 'Campo obrigatorio' })} placeholder="Nome completo" className={inputCls} />
              </Campo>
              <Campo label="Data de nascimento" error={errors.dataNascimento?.message}>
                <input type="date" {...register('dataNascimento', { required: 'Campo obrigatorio' })} className={inputCls} />
              </Campo>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Cidade" error={errors.cidade?.message}>
                  <input {...register('cidade', { required: 'Obrigatorio' })} placeholder="Sua cidade" className={inputCls} />
                </Campo>
                <Campo label="Estado" error={errors.estado?.message}>
                  <select {...register('estado', { required: 'Obrigatorio' })} className={selectCls}>
                    <option value="">UF</option>
                    {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
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
            </>
          )}

          {step === 2 && (
            <>
              <Campo label="Nome do responsavel" error={errors.nomeResponsavel?.message}>
                <input {...register('nomeResponsavel', { required: 'Campo obrigatorio' })} placeholder="Nome completo do responsavel" className={inputCls} />
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
                  <input type="tel" value={whatsapp} onChange={e => setWhatsapp(formatTelefone(e.target.value))} placeholder="(11) 99999-9999" maxLength={15} className={inputCls} />
                </Campo>
                <Campo label="Telefone" required={false}>
                  <input type="tel" value={telefone} onChange={e => setTelefone(formatTelefone(e.target.value))} placeholder="(11) 99999-9999" maxLength={15} className={inputCls} />
                </Campo>
              </div>
              <Campo label="Email" error={errors.email?.message}>
                <input type="email" {...register('email', { required: 'Campo obrigatorio', pattern: { value: /^\S+@\S+$/i, message: 'Email invalido' } })} placeholder="seu@email.com" className={inputCls} />
              </Campo>
              <Campo label="Endereco completo" error={errors.endereco?.message}>
                <input {...register('endereco', { required: 'Campo obrigatorio' })} placeholder="Rua, numero, bairro, cidade" className={inputCls} />
              </Campo>
            </>
          )}

          {step === 3 && (
            <>
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
                <textarea {...register('observacoes')} placeholder="Detalhes adicionais..." rows={3} className={`${inputCls} resize-none`} />
              </Campo>
              <div className="bg-[#07111E]/40 border border-[rgba(0,212,170,0.2)] rounded-xl p-4">
                <p className="text-[11px] text-[#00D4AA] uppercase tracking-wide font-bold mb-2">Resumo</p>
                <div className="flex flex-col gap-1 text-[12px]">
                  <p className="text-white/60">Adolescente: <span className="text-white font-semibold">{getValues('nomeAdolescente')}</span></p>
                  <p className="text-white/60">Cidade: <span className="text-white font-semibold">{getValues('cidade')}/{getValues('estado')}</span></p>
                  <p className="text-white/60">Necessidade: <span className="text-white font-semibold">{getValues('necessidade')}</span></p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <input type="checkbox" id="termosJ" {...register('aceitaTermos', { required: 'Voce precisa aceitar os termos' })} className="mt-1 cursor-pointer" />
                <label htmlFor="termosJ" className="text-[12px] text-white/60 cursor-pointer leading-relaxed">
                  Concordo que os dados sejam utilizados pela Turma do Bem para fins de agendamento e contato para atendimento odontologico gratuito.
                </label>
              </div>
              {errors.aceitaTermos && <p className="text-[11px] text-red-400">{errors.aceitaTermos.message}</p>}
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button type="button" onClick={() => setStep(s => s - 1)} className="flex-1 bg-[#07111E]/40 text-white/70 font-semibold py-3 rounded-lg hover:bg-[#07111E]/60 transition-colors cursor-pointer border-none text-[14px]">
              Voltar
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button type="button" onClick={nextStep} className="flex-1 bg-amber-400 text-[#07111E] font-bold py-3 rounded-lg hover:bg-amber-500 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none text-[14px]">
              Continuar
            </button>
          ) : (
            <button type="button" onClick={enviar} disabled={enviando} className="flex-1 bg-amber-400 text-[#07111E] font-bold py-3 rounded-lg hover:bg-green-500 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none text-[14px] disabled:opacity-60 disabled:cursor-not-allowed">
              {enviando ? 'Enviando...' : 'Enviar solicitacao'}
            </button>
          )}
        </div>
      </div>
      <p className="text-center mt-5 text-[13px]">
        <Link to="/login" className="text-[#7EB3CE] hover:text-amber-400 transition-colors">← Voltar ao login</Link>
      </p>
    </div>
  )
}

// ─── FORMULÁRIO DA MULHER ─────────────────────
function FormularioMulher({ onSucesso }: { onSucesso: (prot: string) => void }) {
  const [step,     setStep]     = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [whatsapp, setWhatsapp] = useState('')
  const [telefone, setTelefone] = useState('')

  const { register, trigger, formState: { errors }, getValues } = useForm<FormMulher>()

  const TOTAL_STEPS = 2
  const stepLabels  = ['Dados Pessoais', 'Atendimento']

  async function nextStep() {
    const fieldsPerStep: (keyof FormMulher)[][] = [
      ['nome', 'dataNascimento', 'cidade', 'estado', 'endereco', 'email'],
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
  const agora   = new Date()
  const dataStr = agora.toLocaleDateString('pt-BR')
  const horaStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  try {
    // 1. Backend Java
    await solicitacaoService.cadastrar({
      nome:        data.nome,
      rgCpf:       prot,
      email:       data.email,
      senha:       '123456',
      telefone:    whatsapp || telefone,
      cep:         '00000000',
      necessidade: data.foiVitima === 'Sim'
        ? 'Vitima de violencia com denticao afetada'
        : 'Triagem odontologica',
      sexo:        'feminino',
      descricao:   data.observacoes ?? '',
      dataNasc:    data.dataNascimento,
      renda:       '',
      responsavel: data.nome,
      comoSoube:   data.comoSoube,
      parentesco:  '',
    })
  } catch (err) {
    console.warn('Backend indisponivel, salvando no Sheets:', err)
  }

  try {
    // 2. Google Sheets (sempre salva como backup)
    await appendSheet('Mensagens!A:N', [[
      prot, data.nome, data.email, whatsapp, telefone,
      'Solicitacao de Atendimento — Apolonas do Bem',
      `Beneficiaria: ${data.nome} | Nascimento: ${data.dataNascimento} | Cidade: ${data.cidade}/${data.estado} | Endereco: ${data.endereco} | Foi vitima: ${data.foiVitima} | Como soube: ${data.comoSoube} | Obs: ${data.observacoes || 'Nenhuma'}`,
      'Site', 'Solicitacao', 'Aguardando', dataStr, horaStr, data.cidade, data.estado,
    ]])
  } catch (err) {
    console.error('Erro ao salvar no Sheets:', err)
    alert('Erro ao enviar. Tente novamente.')
    setEnviando(false)
    return
  }

  onSucesso(prot)
  setEnviando(false)
}

  return (
    <div className="w-full max-w-lg">
      <div className="bg-blue-600 border border-pink-400 rounded-2xl p-8 shadow-2xl">

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-pink-400 mb-3 bg-[#07111E]/40">
            <span className="text-xl">👩</span>
          </div>
          <h1 className="text-[20px] font-bold text-pink-400">Apolônias do Bem</h1>
          <p className="text-white/60 text-[12px] mt-1">Atendimento gratuito para mulheres</p>
        </div>

        {/* Info sobre triagem */}
        <div className="bg-[#07111E]/30 border border-pink-400/20 rounded-xl p-3 mb-5">
          <p className="text-[12px] text-white/70 leading-relaxed">
            O programa oferece tratamento odontologico gratuito para mulheres cis e trans que vivenciaram situacoes de violencia. A selecao e feita por triagem oral nao invasiva.
          </p>
        </div>

        <StepIndicator step={step} total={TOTAL_STEPS} />
        <div className="flex justify-between mb-5">
          {stepLabels.map((label, i) => (
            <p key={i} className={`text-[11px] font-semibold ${i + 1 === step ? 'text-pink-400' : 'text-white/30'}`}>{label}</p>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {step === 1 && (
            <>
              <Campo label="Nome completo" error={errors.nome?.message}>
                <input {...register('nome', { required: 'Campo obrigatorio' })} placeholder="Seu nome completo" className={inputCls} />
              </Campo>
              <Campo label="Data de nascimento" error={errors.dataNascimento?.message}>
                <input type="date" {...register('dataNascimento', { required: 'Campo obrigatorio' })} className={inputCls} />
              </Campo>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Cidade" error={errors.cidade?.message}>
                  <input {...register('cidade', { required: 'Obrigatorio' })} placeholder="Sua cidade" className={inputCls} />
                </Campo>
                <Campo label="Estado" error={errors.estado?.message}>
                  <select {...register('estado', { required: 'Obrigatorio' })} className={selectCls}>
                    <option value="">UF</option>
                    {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </Campo>
              </div>
              <Campo label="Endereco completo" error={errors.endereco?.message}>
                <input {...register('endereco', { required: 'Campo obrigatorio' })} placeholder="Rua, numero, bairro, cidade" className={inputCls} />
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
                <input type="email" {...register('email', { required: 'Campo obrigatorio', pattern: { value: /^\S+@\S+$/i, message: 'Email invalido' } })} placeholder="seu@email.com" className={inputCls} />
              </Campo>
            </>
          )}

          {step === 2 && (
            <>
              {/* Botão de vitima de violencia */}
              <div className="bg-[#07111E]/40 border border-pink-400/30 rounded-xl p-4">
                <p className="text-[13px] text-white font-semibold mb-3">
                  Voce foi vitima de violencia e teve a denticao afetada?
                </p>
                <div className="flex gap-3">
                  {['Sim', 'Nao'].map(opcao => (
                    <label key={opcao} className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        value={opcao}
                        {...register('foiVitima', { required: 'Selecione uma opcao' })}
                        className="sr-only"
                      />
                      <div className={`w-full py-3 rounded-xl border-2 text-center font-bold text-[14px] transition-all duration-200 ${
                        getValues('foiVitima') === opcao
                          ? opcao === 'Sim'
                            ? 'border-pink-400 bg-pink-400/20 text-pink-400'
                            : 'border-amber-400 bg-amber-400/20 text-amber-400'
                          : 'border-white/20 text-white/60 hover:border-white/40'
                      }`}>
                        {opcao}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.foiVitima && <p className="text-[11px] text-red-400 mt-2">{errors.foiVitima.message}</p>}
              </div>

              <Campo label="Como soube do programa?" error={errors.comoSoube?.message}>
                <select {...register('comoSoube', { required: 'Campo obrigatorio' })} className={selectCls}>
                  <option value="">Selecione</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Indicacao de amigo/familiar">Indicacao de amigo/familiar</option>
                  <option value="Posto de saude">Posto de saude</option>
                  <option value="Delegacia/CREAS">Delegacia/CREAS</option>
                  <option value="Site da Turma do Bem">Site da Turma do Bem</option>
                  <option value="Outro">Outro</option>
                </select>
              </Campo>

              <Campo label="Observacoes" required={false}>
                <textarea {...register('observacoes')} placeholder="Detalhes adicionais sobre sua situacao..." rows={3} className={`${inputCls} resize-none`} />
              </Campo>

              <div className="bg-[#07111E]/40 border border-[rgba(0,212,170,0.2)] rounded-xl p-4">
                <p className="text-[11px] text-[#00D4AA] uppercase tracking-wide font-bold mb-2">Resumo</p>
                <div className="flex flex-col gap-1 text-[12px]">
                  <p className="text-white/60">Nome: <span className="text-white font-semibold">{getValues('nome')}</span></p>
                  <p className="text-white/60">Cidade: <span className="text-white font-semibold">{getValues('cidade')}/{getValues('estado')}</span></p>
                  <p className="text-white/60">Programa: <span className="text-pink-400 font-semibold">Apolônias do Bem</span></p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input type="checkbox" id="termosM" {...register('aceitaTermos', { required: 'Voce precisa aceitar os termos' })} className="mt-1 cursor-pointer" />
                <label htmlFor="termosM" className="text-[12px] text-white/60 cursor-pointer leading-relaxed">
                  Concordo que os dados sejam utilizados pela Turma do Bem para fins de triagem e contato para atendimento odontologico gratuito pelo programa Apolônias do Bem.
                </label>
              </div>
              {errors.aceitaTermos && <p className="text-[11px] text-red-400">{errors.aceitaTermos.message}</p>}
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button type="button" onClick={() => setStep(s => s - 1)} className="flex-1 bg-[#07111E]/40 text-white/70 font-semibold py-3 rounded-lg hover:bg-[#07111E]/60 transition-colors cursor-pointer border-none text-[14px]">
              Voltar
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button type="button" onClick={nextStep} className="flex-1 bg-pink-500 text-white font-bold py-3 rounded-lg hover:bg-pink-600 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none text-[14px]">
              Continuar
            </button>
          ) : (
            <button type="button" onClick={enviar} disabled={enviando} className="flex-1 bg-pink-500 text-white font-bold py-3 rounded-lg hover:bg-green-500 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none text-[14px] disabled:opacity-60 disabled:cursor-not-allowed">
              {enviando ? 'Enviando...' : 'Enviar solicitacao'}
            </button>
          )}
        </div>
      </div>
      <p className="text-center mt-5 text-[13px]">
        <Link to="/login" className="text-[#7EB3CE] hover:text-amber-400 transition-colors">← Voltar ao login</Link>
      </p>
    </div>
  )
}

// ─── SOLICITAR ATENDIMENTO (PRINCIPAL) ────────
export default function SolicitarAtendimento() {
  const [tipo,      setTipo]      = useState<TipoAtendimento>('selecao')
  const [enviado,   setEnviado]   = useState(false)
  const [protocolo, setProtocolo] = useState('')
  const [tipoFinal, setTipoFinal] = useState<'jovem' | 'mulher'>('jovem')

  function handleSucesso(prot: string, t: 'jovem' | 'mulher') {
    setProtocolo(prot)
    setTipoFinal(t)
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-[#07111E] flex items-center justify-center p-4">
        <TelaSucesso
          protocolo={protocolo}
          tipo={tipoFinal}
          onVoltar={() => { setEnviado(false); setTipo('selecao') }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#07111E] flex items-center justify-center p-4">
      {tipo === 'selecao' && <TelaSelecao onSelect={setTipo} />}
      {tipo === 'jovem'   && <FormularioJovem  onSucesso={prot => handleSucesso(prot, 'jovem')} />}
      {tipo === 'mulher'  && <FormularioMulher onSucesso={prot => handleSucesso(prot, 'mulher')} />}
    </div>
  )
}