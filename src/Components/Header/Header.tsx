import { useState } from "react";
import { Link } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/NossosServicos", label: "Nossos Serviços" },
  { to: "/Integrantes", label: "Integrantes" },
  { to: "/SobreNos", label: "Sobre nós" },
  { to: "/FAQ", label: "FAQ" },
];

export default function Header() {
  const [aberto, setAberto] = useState(false);

  const linkClasses =
    "text-blue-500 no-underline text-base px-4 py-2 font-medium rounded transition-all duration-300 ease-in-out hover:text-gray-800 hover:bg-gray-100 whitespace-nowrap";

  return (
    <header className="fixed top-0 left-0 w-full h-20 bg-white border-b border-gray-200 shadow-md z-[1000] transition-all duration-300 ease-in-out">
      <nav className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-[5%] gap-4">

        {/* Logo — maior e protegido */}
        <Link to="/" className="flex items-center flex-shrink-0">
          <img 
            src="/logo-250x80.png"
            alt="StartUpados" 
            className="h-10 sm:h-12 lg:h-14 w-auto"
          />
        </Link>

        {/* Botão mobile — agora aparece até 1024px */}
        <button
          onClick={() => setAberto(true)}
          className="flex flex-col gap-1 lg:hidden flex-shrink-0"
          aria-label="Abrir menu"
        >
          <span className="w-6 h-0.5 bg-black"></span>
          <span className="w-6 h-0.5 bg-black"></span>
          <span className="w-6 h-0.5 bg-black"></span>
        </button>

        {/* Menu desktop — só a partir de 1024px */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-6">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={linkClasses}>
              {link.label}
            </Link>
          ))}

          <Link
            to="/FaleConosco"
            className="text-white bg-blue-600 no-underline text-base px-4 py-2 font-medium rounded transition-all duration-300 ease-in-out hover:bg-amber-400 hover:-translate-y-0.5 whitespace-nowrap"
          >
            Fale Conosco
          </Link>

          <Link
            to="/login"
            className="text-white bg-blue-600 no-underline text-base px-4 py-2 font-medium rounded transition-all duration-300 ease-in-out hover:bg-amber-400 hover:-translate-y-0.5 whitespace-nowrap"
          >
            Entrar
          </Link>
        </div>
      </nav>

      {/* Overlay mobile */}
      {aberto && (
        <div
          onClick={() => setAberto(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* Menu mobile */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 lg:hidden ${
          aberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <span className="font-bold">Menu</span>
          <button onClick={() => setAberto(false)} className="text-xl" aria-label="Fechar menu">✕</button>
        </div>

        <nav className="flex flex-col items-stretch gap-2 mt-4 px-4">
          {links.map((link) => (
            <Link 
              key={link.to} 
              to={link.to} 
              className={linkClasses} 
              onClick={() => setAberto(false)}
            >
              {link.label}
            </Link>
          ))}

          <Link
            to="/FaleConosco"
            onClick={() => setAberto(false)}
            className="text-white bg-blue-600 no-underline text-base px-4 py-2 font-medium rounded text-center transition-all duration-300 ease-in-out hover:bg-amber-400"
          >
            Fale Conosco
          </Link>

          <Link
            to="/login"
            onClick={() => setAberto(false)}
            className="text-white bg-blue-600 no-underline text-base px-4 py-2 font-medium rounded text-center transition-all duration-300 ease-in-out hover:bg-amber-400"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}