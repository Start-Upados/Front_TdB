import { Link } from "react-router-dom"

const integrantes = [
  {
    nome: 'Pedro Henrique Falchi', rm: '566967', turma: '1TDSPS',
    foto: '/public/pedro.jpeg',
    github: 'https://github.com/PedroFalchi',
    linkedin: 'https://www.linkedin.com/in/pedro-falchi-4ab4b937b/',
  },
  {
    nome: 'Matheus Guimarães Rosa', rm: '567912', turma: '1TDSPS',
    foto: '/public/matheus.jpeg',
    github: 'https://github.com/mathuesguimaraesrosa',
    linkedin: 'https://www.linkedin.com/in/matheus-rosa-04522435b',
  },
]

export default function Integrantes() {
  return (
    <>
      <header className="page-header">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 mt-20 pt-12 text-center">Nossa Equipe:</h2>
        <p className="text-black text-lg text-center">Conheça os talentosos desenvolvedores por trás da StartUpados()!</p>
      </header>

      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 mx-auto pl-60">
          {integrantes.map(i => (
            <div key={i.rm}
              className="bg-white rounded-2xl p-8 text-center shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-200">
              <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4 border-4 border-accent">
                <img src={i.foto} alt={`Foto de ${i.nome}`} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-primary font-bold text-base mb-1">{i.nome}</h3>
              <p className="text-gray-500 text-sm">RM: {i.rm}</p>
              <p className="text-gray-500 text-sm mb-4">Turma: {i.turma}</p>
              <div className="flex justify-center gap-3">
                <Link to={i.github} target="_blank" rel="noopener noreferrer"
                  className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-80 hover:-translate-y-0.5 transition-all duration-200">
                  GitHub
                </Link>
                <Link to={i.linkedin} target="_blank" rel="noopener noreferrer"
                  className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-80 hover:-translate-y-0.5 transition-all duration-200">
                  LinkedIn
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-100 rounded-2xl p-10 text-center">
          <h3 className="text-primary font-bold text-xl mb-2">Repositório do Grupo:</h3>
          <p className="text-gray-500 mb-6">Confira todos os nossos projetos no GitHub 👇</p>
          <Link to="https://github.com/Start-Upados/Front_TdB" target="_blank" rel="noopener noreferrer"
            className="inline-block bg-accent text-white bg-blue-600 hover:bg-amber-400 font-bold px-8 py-3 rounded-lg hover:bg-accent-dark hover:-translate-y-0.5 transition-all duration-200">
            Acesse o GitHub Geral
          </Link>
        </div>
      </section>
    </>
  )
}