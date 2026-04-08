import { useState, FormEvent, ChangeEvent } from 'react'

interface FormData {
  nome: string; email: string; telefone: string; assunto: string; mensagem: string
}
const initial: FormData = { nome: '', email: '', telefone: '', assunto: '', mensagem: '' }

export default function FaleConosco() {
  const [form, setForm] = useState<FormData>(initial)
  const [enviado, setEnviado] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setEnviado(true)
    setForm(initial)
  }

  const inputClass =
    'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 ' +
    'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all duration-200'

  return (
    <>
      <header className="page-header">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Fale Conosco:</h2>
        <p className="text-gray-300 text-lg max-w-xl mx-auto">
          Tem alguma dúvida, sugestão ou deseja o desenvolvimento de sua idéia? Entre em contato!
        </p>
      </header>

      <section className="py-16 px-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-8 md:p-12">
          {enviado ? (
            <div className="text-center py-8">
              <p className="text-5xl mb-4">✅</p>
              <h3 className="text-primary font-bold text-2xl mb-3">Mensagem enviada com sucesso!</h3>
              <p className="text-gray-500 mb-8">Entraremos em contato em breve. Obrigado!</p>
              <button
                onClick={() => setEnviado(false)}
                className="bg-primary text-white font-bold px-8 py-3 rounded-lg hover:bg-accent transition-colors duration-200 cursor-pointer border-none"
              >
                Enviar nova mensagem
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-primary font-bold text-xl mb-6">Envie sua mensagem 👇</h3>
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <input type="text" name="nome" placeholder="Seu nome completo"
                  value={form.nome} onChange={handleChange} required className={inputClass} />

                <input type="email" name="email" placeholder="Seu e-mail"
                  value={form.email} onChange={handleChange} required className={inputClass} />

                <input type="tel" name="telefone" placeholder="Seu telefone (opcional)"
                  value={form.telefone} onChange={handleChange} className={inputClass} />

                <select name="assunto" value={form.assunto} onChange={handleChange}
                  required className={inputClass}>
                  <option value="">Selecione o assunto</option>
                  <option value="duvida">Dúvida</option>
                  <option value="sugestao">Sugestão</option>
                  <option value="parceria">Proposta de Parceria</option>
                  <option value="trabalho">Oportunidade de Trabalho</option>
                  <option value="orcamento">Orçamento de projeto</option>
                  <option value="outro">Outro</option>
                </select>

                <textarea name="mensagem" rows={6} placeholder="Escreva sua mensagem..."
                  value={form.mensagem} onChange={handleChange} required
                  className={`${inputClass} resize-y min-h-[130px]`} />

                <button type="submit"
                  className="bg-accent text-white font-bold py-3 rounded-lg hover:bg-accent-dark hover:-translate-y-0.5 transition-all duration-200 mt-2 cursor-pointer border-none text-base">
                  Enviar Mensagem
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </>
  )
}