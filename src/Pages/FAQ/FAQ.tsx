import { useState } from 'react'

interface FAQItem { id: number; pergunta: string; resposta: string }

const faqs: FAQItem[] = [
  { id: 1, pergunta: 'O que é a StartUpados?', resposta: 'A StartUpados é um grupo de inovação e tecnologia que busca desenvolver soluções digitais criativas e acessíveis, conectando pessoas, empresas e oportunidades.' },
  { id: 2, pergunta: 'Como posso participar?', resposta: 'Você pode se envolver como colaborador em projetos, parceiro estratégico ou apoiador. Entre em contato conosco para mais informações.' },
  { id: 3, pergunta: 'Quais são os requisitos para integrar a equipe?', resposta: 'Procuramos pessoas com espírito inovador, interesse em tecnologia e disposição para trabalhar em equipe. Conhecimentos em programação, design ou gestão de projetos são bem-vindos.' },
  { id: 4, pergunta: 'Onde posso encontrar mais informações?', resposta: 'Mais informações podem ser encontradas em nosso site oficial ou entrando em contato através do nosso e-mail de suporte. Também estamos ativos nas redes sociais.' },
  { id: 5, pergunta: 'Quais tipos de projetos vocês desenvolvem?', resposta: 'Desenvolvemos aplicativos, plataformas web, sistemas de gestão e protótipos de startups. Focamos em soluções que resolvem problemas reais do mercado.' },
  { id: 6, pergunta: 'Vocês trabalham com quais tecnologias?', resposta: 'Trabalhamos com HTML, CSS, JavaScript, React, Node.js, Python e diversas outras tecnologias modernas para desenvolvimento web e mobile.' },
]

export default function FAQ() {
  const [openId, setOpenId] = useState<number | null>(null)
  const toggle = (id: number) => setOpenId(p => p === id ? null : id)
// não estava indo
  return (
    <>
    
      <header className="page-header">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 pt-21 ml-10">Perguntas Frequentes:</h2>
        <p className="text-black text-lg text-center">Encontre respostas para as dúvidas mais comuns sobre nosso trabalho.</p>
      </header>

      <section className="py-16 px-6 max-w-3xl mx-auto">
        <div className="flex flex-col gap-4">
          {faqs.map(faq => (
            <div key={faq.id} className="bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden">
              <button
                onClick={() => toggle(faq.id)}
                aria-expanded={openId === faq.id}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors duration-200 cursor-pointer bg-transparent border-none"
              >
                <h3 className="text-primary font-semibold text-base">{faq.pergunta}</h3>
                <span className={`text-accent text-2xl font-light ml-4 shrink-0 transition-transform duration-300 ${openId === faq.id ? 'rotate-45' : ''}`}>
                  +
                </span>
              </button>
              <div className={`overflow-hidden transition-all duration-350 ease-in-out ${openId === faq.id ? 'max-h-48' : 'max-h-0'}`}>
                <p className="px-6 pb-5 text-gray-700 text-sm leading-relaxed">{faq.resposta}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}