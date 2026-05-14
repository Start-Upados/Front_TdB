import { useState } from 'react'
import { useForm, type SubmitHandler } from "react-hook-form"
import { appendSheet } from '../../Services/googleSheets'

type FormValues = {
  nome:     string
  email:    string
  telefone: string
  mensagem: string
  assunto:  string
  tipo:     string
}

const TIPO_MAP: Record<string, string> = {
  duvida:    'Beneficiário',
  sugestao:  'Geral',
  parceria:  'Parceiro',
  trabalho:  'Voluntário',
  orcamento: 'Cliente',
  outro:     'Geral',
}

const FaleConosco = () => {
  const [enviado,  setEnviado]  = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [protocolo, setProtocolo] = useState('')

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>()

  const inputClass =
    'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 ' +
    'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all duration-200'

  const Enviar: SubmitHandler<FormValues> = async (data) => {
    setSalvando(true)
    const agora = new Date()
    const data_ = agora.toLocaleDateString('pt-BR')
    const hora  = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const id    = `MSG-${Date.now()}`
    setProtocolo(id)
    const tipo  = TIPO_MAP[data.assunto] ?? 'Geral'

    try {
      await appendSheet('Mensagens!A:K', [[
        id, data.nome, data.email, data.telefone || '—',
        data.assunto, data.mensagem, 'Site', tipo, 'Nova', data_, hora,
      ]])
    } catch (err) {
      console.warn('Falha ao salvar no Sheets:', err)
    } finally {
      setSalvando(false)
      setEnviado(true)
      reset()
    }
  }

  return (
    <>
      <header className="page-header">
        <h2 className="text-4xl md:text-5xl font-semibold mb-4 pt-32 pl-20 text-center">
          Fale Conosco
        </h2>
        <p className="text-black text-lg max-w-xl mx-auto text-center">
          Tem alguma dúvida, sugestão ou deseja o desenvolvimento de sua idéia? Entre em contato!
        </p>
      </header>

      <section className="py-16 px-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-8 md:p-12">

          {enviado ? (
            <div className="text-center py-8">
              <p className="text-5xl mb-4">✅</p>
              <h3 className="text-primary font-bold text-2xl mb-3">
                Mensagem enviada com sucesso!
              </h3>
              <p className="text-gray-500 mb-4">
                Entraremos em contato em breve. Obrigado!
              </p>

              {/* Protocolo */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-4 text-left">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                  Numero do protocolo
                </p>
                <p className="text-[18px] font-extrabold text-blue-600">
                  #{protocolo}
                </p>
              </div>

              {/* Informacoes */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-6 py-4 mb-6 text-left">
                <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wide mb-2">
                  Informacoes do atendimento
                </p>
                <div className="flex flex-col gap-1.5 text-[13px] text-gray-600">
                  <p>Prazo de resposta: <span className="font-semibold text-gray-800">ate 2 dias uteis</span></p>
                  <p>Canal: <span className="font-semibold text-gray-800">Site StartUpados()</span></p>
                  <p>Status: <span className="font-semibold text-green-600">Recebido</span></p>
                </div>
              </div>

              <p className="text-gray-400 text-[12px] mb-6">
                Guarde o numero do protocolo para acompanhar seu atendimento.
              </p>

              <button
                onClick={() => setEnviado(false)}
                className="bg-blue-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer border-none"
              >
                Enviar nova mensagem
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-primary font-bold text-xl mb-6">Envie sua mensagem 👇</h3>
              <form onSubmit={handleSubmit(Enviar)} noValidate className="flex flex-col gap-4">

                <div>
                  <input {...register("nome", { required: "Nome é obrigatório" })}
                    placeholder="Nome completo" className={inputClass} />
                  {errors.nome && <span className="text-red-500 text-xs mt-1">{errors.nome.message}</span>}
                </div>

                <div>
                  <input {...register("email", {
                    required: "E-mail é obrigatório",
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Digite um e-mail válido" }
                  })} placeholder="Seu e-mail" className={inputClass} />
                  {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email.message}</span>}
                </div>

                <div>
                  <input {...register("telefone", {
                    pattern: {
                      value: /^\(?\d{2}\)?[\s-]?[\s9]?\d{4}-?\d{4}$/,
                      message: "Digite um telefone válido — (XX) XXXXX-XXXX"
                    }
                  })} placeholder="Seu telefone (opcional)" className={inputClass} />
                  {errors.telefone && <span className="text-red-500 text-xs mt-1">{errors.telefone.message}</span>}
                </div>

                <div>
                  <select {...register("assunto", { required: "Selecione um assunto" })} className={inputClass}>
                    <option value="">Selecione o assunto</option>
                    <option value="duvida">Dúvida sobre o programa</option>
                    <option value="sugestao">Sugestão</option>
                    <option value="parceria">Proposta de Parceria</option>
                    <option value="trabalho">Quero ser voluntário(a)</option>
                    <option value="orcamento">Orçamento de projeto</option>
                    <option value="outro">Outro</option>
                  </select>
                  {errors.assunto && <span className="text-red-500 text-xs mt-1">{errors.assunto.message}</span>}
                </div>

                <div>
                  <textarea {...register("mensagem", {
                    required: "A mensagem é obrigatória",
                    validate: v => v.length >= 30 || "A mensagem deve ter pelo menos 30 caracteres"
                  })} placeholder="Escreva sua mensagem..." className={`${inputClass} resize-y min-h-32`} />
                  {errors.mensagem && <span className="text-red-500 text-xs mt-1">{errors.mensagem.message}</span>}
                </div>

                <button type="submit" disabled={salvando}
                  className="bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 hover:-translate-y-0.5 transition-all duration-200 mt-2 cursor-pointer border-none text-base disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {salvando ? 'Enviando...' : 'Enviar Mensagem'}
                </button>

              </form>
            </>
          )}

        </div>
      </section>
    </>
  )
}

export default FaleConosco;