import { Link, useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center px-6">
      <div className="text-center max-w-lg">

        {/* Numero 404 */}
        <div className="relative mb-6">
          <p className="text-[130px] md:text-[160px] font-extrabold text-white/5 leading-none select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[80px] md:text-[100px] font-extrabold text-white leading-none">
              404
            </p>
          </div>
        </div>

        {/* Icone */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/20 border border-blue-400/30 mb-6">
          <span className="text-3xl">🔍</span>
        </div>

        {/* Texto */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
          Pagina nao encontrada
        </h1>
        <p className="text-blue-300/70 text-[15px] leading-relaxed mb-8">
          A pagina que voce esta procurando nao existe ou foi movida.
          Verifique o endereco digitado ou volte ao inicio.
        </p>

        {/* Botoes */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-amber-400 hover:text-[#1a1a2e] hover:-translate-y-0.5 transition-all duration-200 no-underline text-[14px]"
          >
            Voltar ao inicio
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-bold px-8 py-3 rounded-lg hover:bg-white/20 hover:-translate-y-0.5 transition-all duration-200 border border-white/20 cursor-pointer text-[14px]"
          >
            Pagina anterior
          </button>
        </div>

        {/* Links uteis */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <p className="text-[12px] text-blue-300/50 mb-3">Links uteis</p>
          <div className="flex flex-wrap justify-center gap-4 text-[13px]">
            {[
              { to: '/NossosServicos', label: 'Nossos Servicos' },
              { to: '/SobreNos',       label: 'Sobre nos'       },
              { to: '/FaleConosco',    label: 'Fale Conosco'    },
              { to: '/login',          label: 'Entrar'          },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-blue-300/70 hover:text-amber-400 transition-colors no-underline"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}