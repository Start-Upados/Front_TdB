import { Link } from 'react-router-dom'
import { ProcessSection } from '../../Components/HomeSections/HomeSections'

const servicos = [
  { icon: '/web.png', alt: 'Web', title: 'Desenvolvimento Web', desc: 'Sites rápidos, modernos, responsivos e com SEO otimizado para impulsionar seu negócio.' },
  { icon: '/e-commerce.jpg', alt: 'E-commerce', title: 'E-commerce', desc: 'Lojas virtuais completas, integradas com pagamento, automação e painel de controle.' },
  { icon: '/apps.jpg', alt: 'Apps', title: 'Aplicativos', desc: 'Aplicativos otimizados ideais para qualquer tipo de negócio e lançamento de produtos.' },
  { icon: '/chatbot.jpg', alt: 'Chatbot', title: 'Chatbots & IA', desc: 'Implementação de chatbots inteligentes integrados ao WhatsApp, Telegram e sites.' },
  { icon: '/automacao.jpg', alt: 'Automação', title: 'Automação de Processos', desc: 'Automatizamos tarefas e fluxos digitais para economia de tempo e produtividade.' },
  { icon: '/consultoria.jpg', alt: 'Consultoria', title: 'Consultoria em Tecnologia', desc: 'Auxiliamos sua empresa a digitalizar, modernizar e estruturar projetos tecnológicos.' },
]

export default function NossosServicos() {
  return (
    <>
      <header className="page-header">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 pt-32 text-center">Nossos Serviços</h1>
        <p className="text-black font-semibold text-lg text-center">Transformamos ideias em soluções digitais eficientes e modernas</p>
      </header>

      <section className="py-16 px-6 max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {servicos.map(s => (
          <div key={s.title}
            className="bg-white rounded-2xl p-8 text-center shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <img src={s.icon} alt={s.alt} className="w-14 h-14 mx-auto mb-4 rounded-full" />
            <h3 className="text-primary font-extrabold text-lg mb-2">{s.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </section>

      <ProcessSection />

      <section className="bg-accent py-16 px-6 text-center ">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-black">Pronto para transformar seu projeto?</h2>
        <Link to="/faleConosco" className="inline-block bg-blue-600 text-accent font-bold px-8 py-3 rounded-lg hover:bg-amber-400 hover:-translate-y-0.5 transition-all duration-200 text-white">
          Fale com a gente 🚀
        </Link>
      </section>
    </>
  )
}