import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// ─── Credenciais de acesso ─────────────────────
const CREDENTIALS = {
  email:    'turmadobem@tdb.org.br',
  password: 'tdb2026',
};

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simula delay de autenticação
    setTimeout(() => {
      if (email === CREDENTIALS.email && password === CREDENTIALS.password) {
        localStorage.setItem('tdb_auth', 'true');
        navigate('/dashboard');
      } else {
        setError('E-mail ou senha incorretos. Verifique e tente novamente.');
      }
      setLoading(false);
    }, 800);
  }

  return (
    <div className="min-h-screen bg-[#07111E] flex items-center justify-center p-4">

      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-blue-600 border border-amber-400 rounded-2xl p-8 shadow-2xl">

          {/* Header do card */}
          <div className="text-center mb-8bg-amber-400">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg- border border-amber-400 mb-4">
              <span className="text-[#00D4AA] text-2xl">📊</span>
            </div>
            <h1 className="text-[22px] font-bold text-amber-400">Painel Administrativo</h1>
            <p className="text-[13px] text-white mt-1 mb-5">Coloque suas credenciais e acesse seu Dashboard personalizado</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* E-mail */}
            <div>
              <label className="block text-[11px] text-white font-semibold mb-1.5 uppercase tracking-[0.6px]">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@turmadobem.org.br"
                required
                autoComplete="email"
                className="w-full bg-[#07111E] border border-[rgba(0,212,170,0.15)] text-[#E8F4FD] placeholder-[#3D6A85] rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#00D4AA] transition-colors duration-200"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-[11px] text-white font-semibold mb-1.5 uppercase tracking-[0.6px]">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-[#07111E] border border-[rgba(0,212,170,0.15)] text-[#E8F4FD] placeholder-[#3D6A85] rounded-lg px-4 py-3 pr-11 text-[13px] outline-none focus:border-[#00D4AA] transition-colors duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3D6A85] hover:text-[#7EB3CE] transition-colors text-[16px]"
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Mensagem de erro */}
            {error && (
              <div className="flex items-center gap-2 bg-[rgba(255,71,87,0.08)] border border-[rgba(255,71,87,0.25)] text-[#FF4757] text-[12px] px-4 py-2.5 rounded-lg">
                <span>⚠</span>
                {error}
              </div>
            )}

            {/* Botão entrar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 text-[#07111E] font-bold py-3 rounded-lg mt-1 text-[14px] transition-all duration-200 hover:bg-green-500 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? 'Verificando...' : 'Entrar no Dashboard'}
            </button>

          </form>

          
        </div>

        {/* Voltar ao site */}
        <p className="text-center mt-5 text-[15px] text-white">
          <Link to="/" className="text-[#7EB3CE] hover:text-amber-400 transition-colors">
            ← Voltar ao site
          </Link>
        </p>

      </div>
    </div>
  );
}