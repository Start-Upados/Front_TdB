import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// ─── TIPOS ────────────────────────────────────
type Modo = 'selecao' | 'admin' | 'paciente';

// ─── CREDENCIAIS ADMIN ────────────────────────
const CREDENTIALS = {
  email:    'turmadobem@tdb.org.br',
  password: 'tdb2026',
};

// ─── UTILITÁRIOS ──────────────────────────────
function formatCPF(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
  if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
}

// ─── INPUT REUTILIZÁVEL ───────────────────────
function Input({
  label, type = 'text', value, onChange, placeholder, autoComplete, children,
}: {
  label: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; autoComplete?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] text-white font-semibold mb-1.5 uppercase tracking-[0.6px]">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="w-full bg-[#07111E] border border-[rgba(0,212,170,0.15)] text-[#E8F4FD] placeholder-[#3D6A85] rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#00D4AA] transition-colors duration-200"        />
        {children}
      </div>
    </div>
  );
}

// ─── TELA DE SELEÇÃO ──────────────────────────
function TelaSelecao({ onSelect }: { onSelect: (modo: Modo) => void }) {
  return (
    <div className="w-full max-w-md">
      <div className="bg-blue-600 border border-amber-400 rounded-2xl p-8 shadow-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-amber-400 mb-4">
            <span className="text-2xl">🦷</span>
          </div>
          <h1 className="text-[22px] font-bold text-amber-400">Turma do Bem</h1>
          <p className="text-[13px] text-white mt-1">
            Como deseja acessar o sistema?
          </p>
        </div>

        {/* Opções */}
        <div className="grid grid-cols-2 gap-4 mb-6">

          {/* Paciente */}
          <button
            onClick={() => onSelect('paciente')}
            className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-amber-400/30 hover:border-amber-400 hover:bg-[#07111E]/30 transition-all duration-200 cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full bg-[#07111E]/40 group-hover:bg-[#07111E]/60 flex items-center justify-center text-2xl transition-colors duration-200">
              🧑
            </div>
            <div className="text-center">
              <p className="font-bold text-amber-400 text-[14px]">Sou Paciente</p>
              <p className="text-white/70 text-[11px] mt-0.5 leading-tight">
                Acompanhar meu atendimento
              </p>
            </div>
          </button>

          {/* Admin */}
          <button
            onClick={() => onSelect('admin')}
            className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-amber-400/30 hover:border-amber-400 hover:bg-[#07111E]/30 transition-all duration-200 cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full bg-[#07111E]/40 group-hover:bg-[#07111E]/60 flex items-center justify-center text-2xl transition-colors duration-200">
              📊
            </div>
            <div className="text-center">
              <p className="font-bold text-amber-400 text-[14px]">Área Admin</p>
              <p className="text-white/70 text-[11px] mt-0.5 leading-tight">
                Acesso ao dashboard
              </p>
            </div>
          </button>
        </div>

        {/* Rodapé */}
        <div className="text-center pt-4 border-t border-amber-400/20">
          <p className="text-[11px] text-white/50">
            Sistema desenvolvido por{' '}
            <Link to="/" className="text-amber-400 font-semibold hover:underline">
              StartUpados()
            </Link>
          </p>
        </div>
      </div>

      <p className="text-center mt-5 text-[15px]">
        <Link to="/" className="text-[#7EB3CE] hover:text-amber-400 transition-colors">
          ← Voltar ao site
        </Link>
      </p>
    </div>
  );
}

// ─── TELA DE PACIENTE ─────────────────────────
function TelaPaciente({ onVoltar }: { onVoltar: () => void }) {
  const [cpf,       setCpf]       = useState('');
  const [buscando,  setBuscando]  = useState(false);
  const [naoAchado, setNaoAchado] = useState(false);
  const navigate = useNavigate();

  const [senha, setSenha] = useState('');
  //const [showPass, setShowPass] = useState('');

  const PACIENTES_VALIDOS = [
  { cpf: '123.456.789-10', senha: 'paciente123' },
  { cpf: '000.000.000-00', senha: '0' },
];

  function handleCPFChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCpf(formatCPF(e.target.value));
    setNaoAchado(false);
  }

  async function handleBuscar(e: React.FormEvent) {
  e.preventDefault();
  if (cpf.length < 14 || senha.length < 6) return;
  setBuscando(true);
  setNaoAchado(false);
  await new Promise(r => setTimeout(r, 800));

  // TODO: substituir por fetch(`${import.meta.env.VITE_API_URL}/api/pacientes/cpf/${cpf}`)
  const encontrado = PACIENTES_VALIDOS.find(
    p => p.cpf === cpf && p.senha === senha
  );

    console.log('CPF digitado:', cpf)
    console.log('Senha digitada:', senha)
    console.log('Encontrado:', encontrado)

  if (encontrado) {
    sessionStorage.setItem('tdb_cpf', cpf);
    navigate('/meu-atendimento');
  } else {
    setNaoAchado(true);
  }
  setBuscando(false);
}

  return (
    <div className="w-full max-w-md">
      <div className="bg-blue-600 border border-amber-400 rounded-2xl p-8 shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onVoltar}
            className="w-8 h-8 rounded-full bg-[#07111E]/40 hover:bg-[#07111E]/70 flex items-center justify-center text-white transition-colors cursor-pointer border-none text-[16px]"
          >
            ←
          </button>
          <div>
            <h1 className="text-[18px] font-bold text-amber-400">Sou Paciente</h1>
            <p className="text-[12px] text-white/70">Digite seu CPF para acessar</p>
          </div>
        </div>

        <form onSubmit={handleBuscar} className="flex flex-col gap-4">
          <Input
            label="CPF"
            value={cpf}
            onChange={handleCPFChange}
            placeholder="000.000.000-00"
          />
          <Input
            label="Senha"
            value={senha}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSenha(e.target.value)}
            placeholder="••••••••••"
          />

          {naoAchado && (
            <div className="flex items-start gap-2 bg-[rgba(255,71,87,0.08)] border border-[rgba(255,71,87,0.25)] text-[#FF4757] text-[12px] px-4 py-2.5 rounded-lg">
              <span>⚠</span>
              <div>
                <p className="font-semibold">CPF não encontrado</p>
                <p className="text-[11px] mt-0.5 opacity-80">
                  Verifique o CPF ou{' '}
                  <Link to="/FaleConosco" className="underline">entre em contato</Link>.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={cpf.length < 14 || buscando}
            className="w-full bg-amber-400 text-[#07111E] font-bold py-3 rounded-lg mt-1 text-[14px] transition-all duration-200 hover:bg-green-500 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 border-none cursor-pointer"
          >
            {buscando ? 'Buscando...' : 'Acessar meu atendimento'}
          </button>
        </form>

        {/* CPFs de teste 
        <div className="mt-5 p-3 bg-[#07111E]/30 border border-amber-400/20 rounded-xl">
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide mb-1.5">
            CPFs para teste
          </p>
          {[
            { cpf: '123.456.789-00', nome: 'João Silva'   },
            { cpf: '987.654.321-00', nome: 'Maria Santos' },
          ].map(p => (
            <p
              key={p.cpf}
              onClick={() => { setCpf(p.cpf); setNaoAchado(false); }}
              className="text-[12px] text-white/70 hover:text-amber-400 font-medium cursor-pointer transition-colors mt-0.5"
            >
              {p.cpf} — {p.nome}
            </p>
          ))}
        </div> */}
      </div>

      <p className="text-center mt-5 text-[15px]">
        <button
          onClick={onVoltar}
          className="text-[#7EB3CE] hover:text-amber-400 transition-colors bg-transparent border-none cursor-pointer text-[15px]"
        >
          ← Voltar
        </button>
      </p>
    </div>
  );
}

// ─── TELA DE ADMIN ────────────────────────────
function TelaAdmin({ onVoltar }: { onVoltar: () => void }) {
  const [email,    setEmail]    = useState('');
  const [senha, setSenha] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (email === CREDENTIALS.email && senha === CREDENTIALS.password) {
        localStorage.setItem('tdb_auth', 'true');
        navigate('/dashboard');
      } else {
        setError('E-mail ou senha incorretos. Verifique e tente novamente.');
      }
      setLoading(false);
    }, 800);
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-blue-600 border border-amber-400 rounded-2xl p-8 shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onVoltar}
            className="w-8 h-8 rounded-full bg-[#07111E]/40 hover:bg-[#07111E]/70 flex items-center justify-center text-white transition-colors cursor-pointer border-none text-[16px]"
          >
            ←
          </button>
          <div>
            <h1 className="text-[18px] font-bold text-amber-400">Painel Administrativo</h1>
            <p className="text-[12px] text-white/70">
              Coloque suas credenciais e acesse seu Dashboard
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* E-mail */}
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@turmadobem.org.br"
            autoComplete="email"
          />

          {/* Senha */}
          <div>
          <label className="block text-[11px] text-white font-semibold mb-1.5 uppercase tracking-[0.6px]">
            Senha
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••••"
              required
              className="w-full bg-[#07111E] border border-[rgba(0,212,170,0.15)] text-[#E8F4FD] placeholder-[#3D6A85] rounded-lg px-4 py-3 pr-11 text-[13px] outline-none focus:border-[#00D4AA] transition-colors duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3D6A85] hover:text-[#7EB3CE] transition-colors border-none bg-transparent cursor-pointer text-[16px]"
            >
              {showPass ? '🙈' : '👁'}  {/* ← usa o showPass aqui */}
            </button>
          </div>
        </div>

          {/* Erro */}
          {error && (
            <div className="flex items-center gap-2 bg-[rgba(255,71,87,0.08)] border border-[rgba(255,71,87,0.25)] text-[#FF4757] text-[12px] px-4 py-2.5 rounded-lg">
              <span>⚠</span>
              {error}
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 text-[#07111E] font-bold py-3 rounded-lg mt-1 text-[14px] transition-all duration-200 hover:bg-green-500 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 border-none cursor-pointer"
          >
            {loading ? 'Verificando...' : 'Entrar no Dashboard'}
          </button>

        </form>
      </div>

      <p className="text-center mt-5 text-[15px]">
        <button
          onClick={onVoltar}
          className="text-[#7EB3CE] hover:text-amber-400 transition-colors bg-transparent border-none cursor-pointer text-[15px]"
        >
          ← Voltar
        </button>
      </p>
    </div>
  );
}

// ─── LOGIN PRINCIPAL ──────────────────────────
export default function Login() {
  const [modo, setModo] = useState<Modo>('selecao');

  return (
    <div className="min-h-screen bg-[#07111E] flex items-center justify-center p-4">
      {modo === 'selecao'  && <TelaSelecao onSelect={setModo}                   />}
      {modo === 'paciente' && <TelaPaciente onVoltar={() => setModo('selecao')} />}
      {modo === 'admin'    && <TelaAdmin    onVoltar={() => setModo('selecao')} />}
    </div>
  );
}