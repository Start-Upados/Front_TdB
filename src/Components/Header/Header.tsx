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
    "text-blue-500 no-underline text-base px-4 py-2 font-medium rounded transition-all duration-300 ease-in-out hover:text-gray-800 hover:bg-gray-100";

  return (
    <header className="fixed top-0 left-0 w-full h-20 bg-white border-b border-gray-200 shadow-md z-[1000] transition-all duration-300 ease-in-out">
      <nav className="flex items-center justify-between h-full px-[5%]">
        {/* Logo */}
        <Link to="/">
          <img src="/logo-250x80.png" className="h-20" alt="Logo" />
        </Link>

        {/* Botão mobile */}
        <button
          onClick={() => setAberto(true)}
          className="flex flex-col gap-1 md:hidden"
        >
          <span className="w-6 h-0.5 bg-black"></span>
          <span className="w-6 h-0.5 bg-black"></span>
          <span className="w-6 h-0.5 bg-black"></span>
        </button>

        {/* Menu desktop */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={linkClasses}>
              {link.label}
            </Link>
          ))}
          <Link
            to="/FaleConosco"
            className="text-white bg-blue-600 no-underline text-base px-4 py-2 font-medium rounded transition-all duration-300 ease-in-out hover:bg-amber-400 hover:-translate-y-0.5"
          >
            Fale Conosco
          </Link>
        </div>
      </nav>

      {/* Overlay mobile */}
      {aberto && (
        <div
          onClick={() => setAberto(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* Menu mobile */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 md:hidden ${
          aberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <span className="font-bold">Menu</span>
          <button onClick={() => setAberto(false)} className="text-xl">✕</button>
        </div>

        <nav className="flex flex-col items-center gap-4 mt-4">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={linkClasses}>
              {link.label}
            </Link>
          ))}
          <Link
            to="/FaleConosco"
            className="text-white bg-blue-600 no-underline text-base px-4 py-2 font-medium rounded transition-all duration-300 ease-in-out hover:bg-amber-400 hover:-translate-y-0.5"
          >
            Fale Conosco
          </Link>
        </nav>
      </div>
    </header>
  );
}