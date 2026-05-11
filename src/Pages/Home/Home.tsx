import { Link } from 'react-router-dom'

const cards = [
  {
    alt: '/projeto.png',
    title: 'Projetos Inovadores',
    desc: 'Desenvolvemos soluções criativas em tecnologia e negócios, sempre com foco em impacto real.',
    hoverTitle: 'Exemplos',
    hoverDesc: 'Aplicativos, plataformas digitais e protótipos de startups.',
  },
  {
    alt: '/colab.png',
    title: 'Colaboração',
    desc: 'Trabalhamos em equipe para transformar boas ideias em projetos viáveis.',
    hoverTitle: 'Nosso diferencial',
    hoverDesc: 'Integração de diferentes áreas: design, tecnologia e negócios.',
  },
  {
    alt: '/conexao.png',
    title: 'Conexões',
    desc: 'Conectamos pessoas, empresas e oportunidades para gerar valor.',
    hoverTitle: 'Impacto',
    hoverDesc: 'Ampliamos redes de contato e criamos parcerias estratégicas.',
  },
]

const Home = () =>{

  return (
    <>
      <div >
        <header className={`px-6 py-20 md:py-28 min-h-[80vh] flex items-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]`}>
          <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 text-white">
              <h2 className="text-accent uppercase tracking-[10px] text-sm font-semibold mb-3">
                Inovação & Tecnologia
              </h2>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
                Transformando Idéias
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed max-w-xl mb-8">
                A StartUpados() é um grupo voltado para inovação, tecnologia e empreendedorismo.
                Nosso objetivo é desenvolver soluções criativas e acessíveis que impactem positivamente
                a sociedade e o mercado.
              </p>
              <Link
                to="/SobreNos"
                className="inline-block bg-accent text-white font-bold px-8 py-3 rounded-lg hover:bg-accent-dark hover:-translate-y-0.5 transition-all duration-200"
              >
                Saiba mais
              </Link>
            </div>
            <div className="flex-1 hidden md:flex justify-center">
              <img src="/banner-lateral-index.png" alt="Banner" className="max-h-96 object-contain" />
            </div>
          </div>
        </header>
        
        <section className="py-16 px-6 max-w-6xl mx-auto">
          <h2 className={`text-3xl font-bold text-center mb-10`}>
            O que fazemos:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {cards.map((c) => (
              <div key={c.title} className="relative group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden cursor-pointer">
                <img src={c.alt} alt={c.alt} className="w-14 h-14 mb-4 transition-opacity duration-300 group-hover:opacity-0"/>
                <h3 className="text-primary font-bold text-lg mb-2 group-hover:opacity-0">{c.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed group-hover:opacity-0">{c.desc}</p>
                <div className="absolute inset-0 bg-accent text-white flex flex-col justify-center items-center p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:text-white hover:bg-blue-600">
                  <h3 className="font-bold text-lg mb-2">{c.hoverTitle}</h3>
                  <p className="text-sm leading-relaxed">{c.hoverDesc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div> 
    </>
  )
}
export default Home;