import { useState } from 'react'
import { useForm, type SubmitHandler } from "react-hook-form";

type FormValues ={
  nome: string,
  email:string,
  telefone:string,
  mensagem:string,
  assunto: string
}

const FaleConosco = () => {
  const [enviado, setEnviado] = useState(false)
  const{ register, handleSubmit,formState : {errors},reset } = useForm<FormValues>(); 

  const Enviar:  SubmitHandler<FormValues> = () =>{
    setEnviado(true)
    reset();
  }

  const inputClass =
    'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 ' +
    'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all duration-200' 
  return (
    <>
      <header className="page-header">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 pt-21 pl-20">Fale Conosco:</h2>
        <p className="text-black text-lg max-w-xl mx-auto ">
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
                className="bg-blue-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-accent transition-colors duration-200 cursor-pointer border-none"
              >
                Enviar nova mensagem
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-primary font-bold text-xl mb-6">Envie sua mensagem 👇</h3>
              <form onSubmit={ handleSubmit(Enviar)} noValidate className="flex flex-col gap-4">
                <div>
                  <input { ...register("nome", {required: true})} placeholder="Nome" className={inputClass}/> 
                  {errors.nome && <span style={{ color:"#f00" }}>Campo nome é obrigatório! </span>}
                </div>
                
                <div>
                  <input {...register("email", {required: "O email é obrigatorio", pattern:{
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message : "Digite um email valido!"
                  }})}placeholder="Seu e-mail" className={inputClass} />
                  {errors.email && <span style={{ color:"#f00" }}>{errors.email.message} </span>}
                </div>
                
                <div>
                  <input {...register("telefone")}placeholder="Seu telefone (opcional)" className={inputClass} />
                </div>
                <div>
                  <select {...register("assunto", {required: true})} className={inputClass}>
                    <option value="">Selecione o assunto</option>
                    <option value="duvida">Dúvida</option>
                    <option value="sugestao">Sugestão</option>
                    <option value="parceria">Proposta de Parceria</option>
                    <option value="trabalho">Oportunidade de Trabalho</option>
                    <option value="orcamento">Orçamento de projeto</option>
                    <option value="outro">Outro</option>
                  </select>
                  {errors.assunto && <span style={{ color:"#f00" }}>O assunto é obrigatório </span>}
                </div>
                
                <div>
                  <textarea {...register("mensagem",{required: "A menssagem é obrigatória",
                    validate: value =>
                      value.length >= 30 || "A mensagem deve ter pelo menos 30 caracteres"                   
                  })} placeholder="Escreva sua mensagem..."
                  className={`${inputClass} resize-y min-h-32.5`} />
                  {errors.mensagem && <span style={{ color:"#f00" }}>{errors.mensagem.message}</span>}
                </div>

                <button type="submit"
                  className="bg-accent bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-accent-dark hover:-translate-y-0.5 transition-all duration-200 mt-2 cursor-pointer border-none text-base">
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
export default FaleConosco;