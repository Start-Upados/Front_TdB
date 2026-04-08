import { Link } from 'react-router-dom'

const servicos = [
  { icon: '', alt: 'Web', title: 'Desenvolvimento Web', desc: 'Sites rápidos, modernos, responsivos e com SEO otimizado para impulsionar seu negócio.' },
  { icon: '', alt: 'E-commerce', title: 'E-commerce', desc: 'Lojas virtuais completas, integradas com pagamento, automação e painel de controle.' },
  { icon: '', alt: 'Apps', title: 'Aplicativos', desc: 'Aplicativos otimizados ideais para qualquer tipo de negócio e lançamento de produtos.' },
  { icon: '', alt: 'Chatbot', title: 'Chatbots & IA', desc: 'Implementação de chatbots inteligentes integrados ao WhatsApp, Telegram e sites.' },
  { icon: '', alt: 'Automação', title: 'Automação de Processos', desc: 'Automatizamos tarefas e fluxos digitais para economia de tempo e produtividade.' },
  { icon: '', alt: 'Consultoria', title: 'Consultoria em Tecnologia', desc: 'Auxiliamos sua empresa a digitalizar, modernizar e estruturar projetos tecnológicos.' },
]

export default function NossosServicos() {
  return (
    <>
      <header className="page-header">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Nossos Serviços</h1>
        <p className="text-gray-300 text-lg">Transformamos ideias em soluções digitais eficientes e modernas.</p>
      </header>

      <section className="py-16 px-6 max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {servicos.map(s => (
          <div key={s.title}
            className="bg-white rounded-2xl p-8 text-center shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <img src={s.icon} alt={s.alt} className="w-14 h-14 mx-auto mb-4" />
            <h3 className="text-primary font-bold text-lg mb-2">{s.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </section>

      <section className="bg-accent py-16 px-6 text-center text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">Pronto para transformar seu projeto?</h2>
        <Link
          to="/fale-conosco"
          className="inline-block bg-white text-accent font-bold px-8 py-3 rounded-lg hover:bg-gray-100 hover:-translate-y-0.5 transition-all duration-200"
        >
          Fale com a gente 🚀
        </Link>
      </section>
    </>
  )
}