import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { campanhaService } from '../../../Services/api';
import { appendSheet } from '../../../Services/googleSheets';

 
// ─── TIPOS ────────────────────────────────────
interface MutiraoForm {
  nome:             string
  descricao:        string
  metaAtendidos:    number
  nAtendimentos:    number
  nDentistas:       number
  rua:              string
  bairro:           string
  cidade:           string
  estado:           string
  numeroRua:        number
}
 
// ─── CAMPO REUTILIZÁVEL ───────────────────────
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
 
const inputCls  = "w-full bg-[#07111E] border border-[rgba(0,212,170,0.15)] text-[#E8F4FD] placeholder-[#3D6A85] rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#00D4AA] transition-colors duration-200"
/*
const selectCls = "w-full bg-[#07111E] border border-[rgba(0,212,170,0.15)] text-[#E8F4FD] rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#00D4AA] transition-colors duration-200"
 
 
// ─── UFs DO BRASIL ────────────────────────────
const UFS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA',
  'MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN',
  'RO','RR','RS','SC','SE','SP','TO'
]
*/
// ─── GERENCIAR MUTIRÕES ───────────────────────
export default function GerenciarMutiroes() {
  const [salvando, setSalvando] = useState(false)
  const [sucesso,  setSucesso]  = useState(false)
 
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MutiraoForm>()
 
  async function onSubmit(data: MutiraoForm) {
    setSalvando(true)
    setSucesso(false)
 
    const agora   = new Date()
    const dataStr = agora.toLocaleDateString('pt-BR')
 
    try {
        // 1. Backend Java
        await campanhaService.cadastrar({
          nome:             data.nome,
          descricao:        data.descricao,
          metaAtendidos:    data.metaAtendidos,
          nAtendidos:       data.nAtendimentos,
          nDentistas:       data.nDentistas,
          logradouro:       data.rua,
          cidade:           data.cidade,
          bairro:           data.bairro,
          estado:           data.estado,
          numeroLogradouro: data.numeroRua  
          })
      } catch (err) {
        console.warn('Backend indisponivel, salvando no Sheets:', err)
      }
 
    try {
      await appendSheet('Mutiroes!A:K', [[
        data.nome,                        // Nome
        data.descricao,                   // Descricao
        String(data.metaAtendidos),       // Meta Atendidos
        String(data.nAtendimentos),     // Num Atendimentos
        String(data.nDentistas),        // Num Dentistas
        data.rua,                         // Rua
        data.bairro,                      // Bairro
        data.cidade,                      // Cidade
        data.estado,                      // Estado
        dataStr,                          // Data Cadastro
      ]]);
 
      setSucesso(true)
      reset()
      setTimeout(() => setSucesso(false), 4000)
 
    } catch (err) {
      console.error('Erro ao cadastrar mutirao:', err)
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
          Gerenciar Mutirões
        </h1>
        <p className="text-[#7EB3CE] text-[13px]">
          Cadastre os mutirões de atendimento da Turma do Bem
        </p>
      </div>
 
      {/* Alerta de sucesso */}
      {sucesso && (
        <div className="flex items-center gap-3 bg-[rgba(0,230,118,0.08)] border border-[rgba(0,230,118,0.25)] text-[#00E676] px-4 py-3 rounded-xl mb-6 text-[13px]">
          <span className="text-[18px]">✓</span>
          <div>
            <p className="font-bold">Mutirão cadastrado com sucesso!</p>
            <p className="text-[11px] opacity-80 mt-0.5">Os dados foram salvos na planilha Mutiroes.</p>
          </div>
        </div>
      )}
 
      <form onSubmit={handleSubmit(onSubmit)}>
 
        {/* Dados gerais */}
        <div className="bg-[#0F2035] border border-[rgba(0,212,170,0.1)] rounded-2xl p-6 mb-5">
          <h2 className="text-[14px] font-bold text-[#00D4AA] uppercase tracking-wide mb-5">
            Dados do Mutirão
          </h2>
 
          <div className="flex flex-col gap-4">
 
            <Campo label="Nome do mutirão" error={errors.nome?.message}>
              <input
                {...register('nome', { required: 'Campo obrigatorio' })}
                placeholder="Ex: Mutirao Zona Sul — Junho 2026"
                className={inputCls}
              />
            </Campo>
 
            <Campo label="Descricao" error={errors.descricao?.message}>
              <textarea
                {...register('descricao', { required: 'Campo obrigatorio' })}
                placeholder="Descreva o mutirao, programas envolvidos, publico alvo..."
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </Campo>
 
            <div className="grid grid-cols-3 gap-3">
              <Campo label="Meta de atendidos" error={errors.metaAtendidos?.message}>
                <input
                  type="number"
                  min={1}
                  {...register('metaAtendidos', { required: 'Obrigatorio', min: { value: 1, message: 'Minimo 1' } })}
                  placeholder="100"
                  className={inputCls}
                />
              </Campo>
              <Campo label="Num. atendimentos" error={errors.nAtendimentos?.message}>
                <input
                  type="number"
                  min={0}
                  {...register('nAtendimentos', { required: 'Obrigatorio' })}
                  placeholder="0"
                  className={inputCls}
                />
              </Campo>
              <Campo label="Num. dentistas" error={errors.nDentistas?.message}>
                <input
                  type="number"
                  min={1}
                  {...register('nDentistas', { required: 'Obrigatorio', min: { value: 1, message: 'Minimo 1' } })}
                  placeholder="10"
                  className={inputCls}
                />
              </Campo>
 
 
            </div>
 
          </div>
        </div>
 
        {/* Localização */}
        <div className="bg-[#0F2035] border border-[rgba(0,212,170,0.1)] rounded-2xl p-6 mb-5">
          <h2 className="text-[14px] font-bold text-[#00D4AA] uppercase tracking-wide mb-5">
            Localização
          </h2>
 
          <div className="flex flex-col gap-4">
 
            <Campo label="Rua / Logradouro" error={errors.rua?.message}>
              <input
                {...register('rua', { required: 'Campo obrigatorio' })}
                placeholder="Ex: Av. Paulista, 1000"
                className={inputCls}
              />
            </Campo>
 
            <Campo label="Bairro" error={errors.bairro?.message}>
              <input
                {...register('bairro', { required: 'Campo obrigatorio' })}
                placeholder="Ex: Bela Vista"
                className={inputCls}
              />
            </Campo>
 
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Cidade" error={errors.cidade?.message}>
                <input
                  {...register('cidade', { required: 'Campo obrigatorio' })}
                  placeholder="Ex: Sao Paulo"
                  className={inputCls}
                />
              </Campo>
              <Campo label="Estado" error={errors.estado?.message}>
                <input
                  {...register('estado', { required: 'Campo obrigatorio' })}
                  placeholder="Ex: Sao Paulo"
                  className={inputCls}
                />
              </Campo>
            </div>
            <Campo label="Num. da Propriedade" error={errors.numeroRua?.message}>
                <input
                  type="number"
                  {...register('numeroRua', { required: 'Campo obrigatorio' })}
                  placeholder="Ex: 165"
                  maxLength={4}
                  className={inputCls}
                />
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
            {salvando ? 'Salvando...' : 'Cadastrar Mutirão'}
          </button>
          <button
            type="button"
            onClick={() => reset()}
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
          Os dados serao salvos na aba <span className="text-[#00D4AA] font-semibold">Mutiroes</span> da planilha Turma_Do_Bem no Google Sheets.
        </p>
      </div>
 
    </div>
  )
}