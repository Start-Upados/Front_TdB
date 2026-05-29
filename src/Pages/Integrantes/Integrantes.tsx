import { Link } from "react-router-dom"

const integrantes = [
  {
    nome: 'Pedro Henrique Falchi', rm: '566967', turma: '1TDSPS',
    foto: '/pedro.jpeg',
    github: 'https://github.com/PedroFalchi',
    linkedin: 'https://www.linkedin.com/in/pedro-falchi-4ab4b937b',
  },
  {
    nome: 'Matheus Guimarães Rosa', rm: '567912', turma: '1TDSPS',
    foto: '/fotoMatheus.jpg',
    github: 'https://github.com/mathuesguimaraesrosa',
    linkedin: 'https://www.linkedin.com/in/matheus-rosa-04522435b',
  },
]

export default function Integrantes() {
  return (
    <>
      <header className="page-header pt-24 md:pt-32 pb-8 px-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-center">
          Nossa Equipe
        </h2>
        <p className="text-black font-semibold text-base sm:text-lg text-center max-w-2xl mx-auto">
          Conheça os talentosos desenvolvedores por trás da StartUpados
        </p>
      </header>

      <section className="py-12 md:py-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 mb-12">
          {integrantes.map(i => (
            <div 
              key={i.rm}
              className="bg-white rounded-2xl p-6 sm:p-8 text-center shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
            >
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden mx-auto mb-4 border-4 border-blue-500">
                <img 
                  src={i.foto} 
                  alt={`Foto de ${i.nome}`} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <h3 className="text-primary font-bold text-lg mb-1">{i.nome}</h3>
              <p className="text-gray-500 text-sm">RM: {i.rm}</p>
              <p className="text-gray-500 text-sm mb-4">Turma: {i.turma}</p>
              <div className="flex justify-center gap-3">
                <Link 
                  to={i.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-80 hover:-translate-y-0.5 transition-all duration-200"
                >
                  GitHub
                </Link>
                <Link 
                  to={i.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-80 hover:-translate-y-0.5 transition-all duration-200"
                >
                  LinkedIn
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-100 rounded-2xl p-6 sm:p-10 text-center">
          <h3 className="text-primary font-bold text-xl mb-2">Repositório do Grupo:</h3>
          <p className="text-gray-500 mb-6">Confira todos os nossos projetos no GitHub 👇</p>
          <Link 
            to="https://github.com/Start-Upados" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 hover:bg-amber-400 text-white font-bold px-6 sm:px-8 py-3 rounded-lg hover:-translate-y-0.5 transition-all duration-200 text-sm sm:text-base"
          >
            Acesse nosso GitHub e veja alguns de nossos projetos!
          </Link>
        </div>
      </section>
    </>
  )
}