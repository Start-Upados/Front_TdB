import { useState } from "react";
import { Link } from "react-router-dom";

export default function Header() {
  const [aberto, setAberto] = useState(false);

  return (
    <header className="w-full shadow relative">
      <nav className="flex items-center justify-between p-4">
        <Link to="/">
          <img src="/logo-250x80.png" className="h-12" />
        </Link>

        <button onClick={() => setAberto(true)} className="flex flex-col gap-1 md:hidden">
          <span className="w-6 h-0.5 bg-black"></span>
          <span className="w-6 h-0.5 bg-black"></span>
          <span className="w-6 h-0.5 bg-black"></span>
        </button>

        <div className="hidden md:flex gap-6">
          <Link to="/">Home</Link>
          <Link to="/NossosServicos">Serviços</Link>
          <Link to="/Integrantes">Integrantes</Link>
          <Link to="/SobreNos">Sobre</Link>
          <Link to="/FAQ">FAQ</Link>
          <Link to="/FaleConosco">Contato</Link>
        </div>
      </nav>

      {aberto && (<div onClick={() => setAberto(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden" />)}

      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 md:hidden
        ${aberto ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 flex justify-between border-b">
          <span>Menu</span>
          <button onClick={() => setAberto(false)}>✕</button>
        </div>

        <nav className="flex flex-col">
          <Link className="p-4 border-b" to="/">Home</Link>
          <Link className="p-4 border-b" to="/NossosServicos">Serviços</Link>
          <Link className="p-4 border-b" to="/Integrantes">Integrantes</Link>
          <Link className="p-4 border-b" to="/SobreNos">Sobre</Link>
          <Link className="p-4 border-b" to="/FAQ">FAQ</Link>
          <Link className="p-4" to="/FaleConosco">Contato</Link>
        </nav>
      </div>
    </header>
  );
}