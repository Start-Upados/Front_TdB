import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { funcionarioService } from '../../../Services/api';
import { appendSheet } from '../../../Services/googleSheets';


interface FuncionarioForm {
  nome:        string
  rgCpf:       string
  telefone:    string
  email:       string  
  senha:       string
  cargo:       string  
  dataInicio:  string
  status:      string
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

function gerarSenha(nome: string): string {
  const base = nome.toLowerCase().replace(/\s+/g, '').slice(0, 4)
  const num  = Math.floor(Math.random() * 900) + 100
  return `${base}${num}`
}


function Campo({
  label, error, required = true, children
}: {
  label: string; error?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[11px] text-[#7EB3CE] font-semibold mb-1.5 uppercase tracking-[0.6px]">
        {label} {required && <span className="text-[#00D4AA]">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-[#FF4757] mt-1">{error}</p>}
    </div>
  )
}

const inputCls = "w-full bg-[#07111E] border border-[rgba(0,212,170,0.15)] text-[#E8F4FD] placeholder-[#3D6A85] rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#00D4AA] transition-colors duration-200"
const selectCls = "w-full bg-[#07111E] border border-[rgba(0,212,170,0.15)] text-[#E8F4FD] rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#00D4AA] transition-colors duration-200"

// ─── CADASTRAR FUNCIONÁRIO ────────────────────
export default function CadastrarFuncionario() {
  const [salvando,  setSalvando]  = useState(false)
  const [sucesso,   setSucesso]   = useState(false)
  const [cpf,       setCpf]       = useState('')
  const [telefone,  setTelefone]  = useState('')
  const [ senha, setSenha ] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FuncionarioForm>()

  async function onSubmit(data: FuncionarioForm) {
  setSalvando(true)
  setSucesso(false)

  const senhaGerada = gerarSenha(data.nome)
  const agora   = new Date()
  const dataStr = agora.toLocaleDateString('pt-BR')

  try {
    // 1. Backend Java
    await funcionarioService.cadastrar({
      nome:       data.nome,
      rgCpf:      cpf,
      email:      data.email,
      senha:      senhaGerada,
      telefone:   telefone,
      cep:        '00000000',
      cargo:      data.cargo,
      dataInicio: data.dataInicio,
      status:     data.status,
    })
  } catch (err) {
    console.warn('Backend indisponivel, salvando no Sheets:', err)
  }

  try {
    // 2. Google Sheets (sempre salva como backup)
    await appendSheet('Funcionarios!A:H', [[
      data.nome,
      cpf,
      data.cargo,
      data.email,
      telefone,
      data.dataInicio,
      data.status,
      dataStr,
    ]])

    setSenha(senhaGerada)
    setSucesso(true)
    reset()
    setCpf('')
    setTelefone('')
    setTimeout(() => setSucesso(false), 4000)

  } catch (err) {
    console.error('Erro ao cadastrar:', err)
    alert('Erro ao cadastrar. Tente novamente.')
  } finally {
    setSalvando(false)
  }
}

  return (
    <div className="p-6 max-w-2xl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#E8F4FD] mb-1">
          Cadastrar Funcionário
        </h1>
        <p className="text-[#7EB3CE] text-[13px]">
          Registre os funcionários da Turma do Bem no sistema
        </p>
      </div>

      {/* Alerta de sucesso */}
      {sucesso && (
        <div className="flex flex-col gap-1 bg-[rgba(0,230,118,0.08)] border border-[rgba(0,230,118,0.25)] text-[#00E676] px-4 py-3 rounded-xl mb-6 text-[13px]">
          <div className="flex items-center gap-3">
            <span className="text-[18px]">✓</span>
            <p className="font-bold">Funcionário cadastrado com sucesso!</p>
          </div>
          <div className="mt-2 bg-[#07111E]/40 border border-[rgba(0,230,118,0.2)] rounded-lg px-4 py-2">
            <p className="text-[11px] text-white/50 uppercase tracking-wide mb-1">Senha gerada</p>
            <p className="text-[18px] font-extrabold tracking-widest text-[#00D4AA]">{senha}</p>
            <p className="text-[11px] text-white/40 mt-1">Guarde essa senha repasse ao funcionário</p>
          </div>
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-[#0F2035] border border-[rgba(0,212,170,0.1)] rounded-2xl p-6 mb-5">
          <h2 className="text-[14px] font-bold text-[#00D4AA] uppercase tracking-wide mb-5">
            Dados do Funcionário
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Nome */}
            <div className="md:col-span-2">
              <Campo label="Nome completo" error={errors.nome?.message}>
                <input
                  {...register('nome', { required: 'Campo obrigatorio' })}
                  placeholder="Nome completo do funcionario"
                  className={inputCls}
                />
              </Campo>
            </div>

            {/* CPF */}
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

            {/* Cargo */}
            <Campo label="Cargo" error={errors.cargo?.message}>
              <select {...register('cargo', { required: 'Campo obrigatorio' })} className={selectCls}>
                <option value="">Selecione o cargo</option>
                <option value="Coordenador">Coordenador</option>
                <option value="Assistente">Assistente</option>
                <option value="Gestor">Gestor</option>
                <option value="Analista">Analista</option>
                <option value="Comunicacao">Comunicacao</option>
                <option value="Financeiro">Financeiro</option>
                <option value="TI">TI</option>
                <option value="Outro">Outro</option>
              </select>
            </Campo>

            {/* Email */}
            <Campo label="Email institucional" error={errors.email?.message}>
              <input
                type="email"
                {...register('email', {
                  required: 'Campo obrigatorio',
                  pattern: { value: /^\S+@\S+$/i, message: 'Email invalido' }
                })}
                placeholder="funcionario@turmadobem.org.br"
                className={inputCls}
              />
            </Campo>

            {/* Telefone */}
            <Campo label="Telefone" required={false}>
              <input
                type="tel"
                value={telefone}
                onChange={e => setTelefone(formatTelefone(e.target.value))}
                placeholder="(11) 99999-9999"
                maxLength={15}
                className={inputCls}
              />
            </Campo>

            {/* Data de início */}
            <Campo label="Data de inicio" error={errors.dataInicio?.message}>
              <input
                type="date"
                {...register('dataInicio', { required: 'Campo obrigatorio' })}
                className={inputCls}
              />
            </Campo>

            {/* Status */}
            <Campo label="Status" error={errors.status?.message}>
              <select {...register('status', { required: 'Campo obrigatorio' })} className={selectCls}>
                <option value="">Selecione</option>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
                <option value="Ferias">Ferias</option>
                <option value="Afastado">Afastado</option>
              </select>
            </Campo>

          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={salvando}
            className="flex-1 bg-[#00D4AA] text-[#07111E] font-bold py-3 rounded-xl hover:bg-[#00b894] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none text-[14px] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {salvando ? 'Salvando...' : 'Cadastrar Funcionário'}
          </button>
          <button
            type="button"
            onClick={() => { reset(); setCpf(''); setTelefone('') }}
            className="px-6 bg-[#0F2035] text-[#7EB3CE] font-semibold py-3 rounded-xl hover:bg-[#162d4a] transition-colors cursor-pointer border border-[rgba(0,212,170,0.15)] text-[14px]"
          >
            Limpar
          </button>
        </div>

      </form>

      {/* Info */}
      <div className="mt-6 p-4 bg-[#0F2035] border border-[rgba(0,212,170,0.1)] rounded-xl">
        <p className="text-[11px] text-[#00D4AA] font-bold uppercase tracking-wide mb-2">
          Informacao
        </p>
        <p className="text-[12px] text-[#7EB3CE]">
          Os dados serao salvos na aba <span className="text-[#00D4AA] font-semibold">Funcionarios</span> da planilha Turma_Do_Bem no Google Sheets. Certifique-se de que a aba existe antes de cadastrar.
        </p>
      </div>

    </div>
  )
}