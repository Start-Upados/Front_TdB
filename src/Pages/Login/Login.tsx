import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Stethoscope, LayoutDashboard, Plus, ArrowRight, ArrowLeft, Eye, EyeOff, AlertCircle, Heart } from 'lucide-react';
import { authService } from '../../Services/api';

type Modo = 'selecao' | 'admin' | 'paciente' | 'dentista';

function formatCPF(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
  if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
}

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
      <label className="block text-[11px] text-[#475569] font-semibold mb-1.5 uppercase tracking-[0.6px]">
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
          className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#E88407] focus:ring-2 focus:ring-[#E88407]/15 transition-all duration-200"
        />
        {children}
      </div>
    </div>
  );
}

// TELA DE SELEÇÃO //
function TelaSelecao({ onSelect }: { onSelect: (modo: Modo) => void }) {
  const navigate = useNavigate();
  const opcoes = [
    { modo: 'paciente' as Modo, Icon: User,            title: 'Sou paciente', desc: 'Acompanhar meu atendimento' },
    { modo: 'dentista' as Modo, Icon: Stethoscope,     title: 'Sou dentista', desc: 'Meus atendimentos' },
    { modo: 'admin'    as Modo, Icon: LayoutDashboard, title: 'Área admin',   desc: 'Acesso ao dashboard Turma do Bem' },
  ];

  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm">

        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFEDD5] border-2 border-[#E88407] mb-4">
            <span className="text-3xl">🦷</span>
          </div>
          <h1 className="text-[22px] font-bold text-[#0F172A] leading-tight">Bem-vindo à Turma do Bem</h1>
          <p className="text-[13px] text-[#475569] mt-1.5">Como deseja acessar o sistema?</p>
        </div>

        {/* Ação principal */}
        <button
          onClick={() => navigate('/solicitar-atendimento')}
          className="flex items-center gap-3 w-full p-4 mb-3 rounded-xl bg-[#FFEDD5] border-2 border-[#E88407] hover:bg-[#FED7AA] transition-all duration-200 cursor-pointer text-left"
        >
          <div className="w-11 h-11 rounded-full bg-[#E88407] flex items-center justify-center shrink-0">
            <Plus size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#9A3412] text-[14px]">Solicitar atendimento</p>
            <p className="text-[#9A3412]/85 text-[12px] mt-0.5">Cadastro gratuito para tratamento bucal</p>
          </div>
          <ArrowRight size={18} className="text-[#E88407] shrink-0" />
        </button>

        {/* Opções — 3 botões em coluna */}
        <div className="flex flex-col gap-2.5 mb-5">
          {opcoes.map(({ modo, Icon, title, desc }) => (
            <button
              key={modo}
              onClick={() => onSelect(modo)}
              className="flex items-center gap-3 w-full p-4 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] transition-all duration-200 cursor-pointer text-left"
            >
              <div className="w-11 h-11 rounded-full bg-[#F1F5F9] flex items-center justify-center shrink-0">
                <Icon size={20} className="text-[#475569]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#0F172A] text-[14px]">{title}</p>
                <p className="text-[#475569] text-[12px] mt-0.5">{desc}</p>
              </div>
              <ArrowRight size={18} className="text-[#94A3B8] shrink-0" />
            </button>
          ))}
        </div>

        {/* Doação — destaque com lime TdB */}
        <button
          onClick={() => window.open('https://paybox.doare.org/paybox?payboxId=83fed202-df0f-4665-9c74-688a834028d4', '_blank')}
          className="w-full bg-[#CED600] text-[#1A2E05] font-semibold py-3 rounded-xl hover:bg-[#B5BC00] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-none text-[14px] flex items-center justify-center gap-2"
        >
          <Heart size={16} fill="#1A2E05" />
          Quero fazer uma doação
        </button>

        {/* Rodapé */}
        <div className="text-center pt-4 border-t border-[#E2E8F0] mt-5">
          <p className="text-[12px] text-[#1A2E05]">
            Sistema desenvolvido por{' '}
            <Link to="/" className="text-[#E88407] font-extrabold hover:underline">
              StartUpados
            </Link>
          </p>
        </div>
      </div>

      <p className="text-center mt-5 text-[13px]">
        <Link to="/" className="text-[#E88407] hover:underline transition-colors inline-flex items-center gap-1.5 font-medium">
          <ArrowLeft size={14} />
          Voltar ao site
        </Link>
      </p>
    </div>
  );
}

// TELA DE DENTISTA //
function TelaDentista({ onVoltar }: { onVoltar: () => void }) {
  const [rgCpf, setRgCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [erro, setErro] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!rgCpf || senha.length < 6) return;

    setBuscando(true);
    setErro(false);

    try {
      const ok = await authService.loginDentista(rgCpf, senha);
      console.log(ok);
      if (ok) {
        sessionStorage.setItem('tdb_rgCpf', rgCpf);
        navigate('/meu-painel');
      }
    } catch (error) {
      console.log(error);
      setErro(true);
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onVoltar}
            className="w-9 h-9 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center text-[#475569] transition-colors cursor-pointer border-none">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="font-bold text-[#0F172A] text-[17px]">Sou dentista voluntário</h2>
            <p className="text-[#475569] text-[12px]">Digite suas credenciais para acessar</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] text-[#475569] font-semibold mb-1.5 uppercase tracking-[0.6px]">
              RG ou CPF
            </label>
            <input type="text" value={rgCpf}
              onChange={e => setRgCpf(formatCPF(e.target.value))}
              placeholder="123.456.789-00"
              className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#E88407] focus:ring-2 focus:ring-[#E88407]/15 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#475569] font-semibold mb-1.5 uppercase tracking-[0.6px]">
              Senha
            </label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={senha}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSenha(e.target.value)}
                placeholder="••••••••••"
                className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-lg px-4 py-3 pr-11 text-[13px] outline-none focus:border-[#E88407] focus:ring-2 focus:ring-[#E88407]/15 transition-all duration-200"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors border-none bg-transparent cursor-pointer">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-[12px] px-4 py-2.5 rounded-lg">
              <AlertCircle size={14} className="shrink-0" />
              <span>RG/CPF ou senha incorretos.</span>
            </div>
          )}

          <button type="submit" disabled={!rgCpf || senha.length < 6 || buscando}
            className="w-full bg-[#0F172A] text-white font-semibold py-3 rounded-xl mt-1 text-[14px] transition-all duration-200 hover:bg-[#1E293B] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 border-none cursor-pointer">
            {buscando ? 'Verificando...' : 'Entrar'}
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-[#E2E8F0]" />
            <span className="text-[#94A3B8] text-[12px]">ou</span>
            <div className="flex-1 h-px bg-[#E2E8F0]" />
          </div>

          <Link
            to="/cadastrar-voluntario"
            className="w-full bg-white border-2 border-[#E88407] text-[#E88407] font-semibold py-3 rounded-xl hover:bg-[#FFEDD5] hover:-translate-y-0.5 transition-all duration-200 text-center text-[14px] no-underline block"
          >
            Fazer cadastro como voluntário
          </Link>
        </form>
      </div>

      <p className="text-center mt-5 text-[13px]">
        <button onClick={onVoltar}
          className="text-[#E88407] hover:underline transition-colors bg-transparent border-none cursor-pointer inline-flex items-center gap-1.5 font-medium">
          <ArrowLeft size={14} />
          Voltar
        </button>
      </p>
    </div>
  );
}

// TELA DE PACIENTE //
function TelaPaciente({ onVoltar }: { onVoltar: () => void }) {
  const [rgCpf, setRgCpf] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [erro, setErro] = useState(false);
  const navigate = useNavigate();
  const [senha, setSenha] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!rgCpf || senha.length < 6) return;

    setBuscando(true);
    setErro(false);

    try {
      const ok = await authService.loginDentista(rgCpf, senha);
      console.log(ok);
      if (ok) {
        sessionStorage.setItem('tdb_rgCpf', rgCpf);
        navigate('/meu-painel');
      }
    } catch (error) {
      console.log(error);
      setErro(true);
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm">

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onVoltar}
            className="w-9 h-9 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center text-[#475569] transition-colors cursor-pointer border-none"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-[18px] font-bold text-[#0F172A]">Sou paciente</h1>
            <p className="text-[12px] text-[#475569]">Digite suas credenciais para acessar</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] text-[#475569] font-semibold mb-1.5 uppercase tracking-[0.6px]">
              RG ou CPF
            </label>
            <input type="text" value={rgCpf}
              onChange={e => setRgCpf(formatCPF(e.target.value))}
              placeholder="123.456.789-00"
              className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-lg px-4 py-3 text-[13px] outline-none focus:border-[#E88407] focus:ring-2 focus:ring-[#E88407]/15 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#475569] font-semibold mb-1.5 uppercase tracking-[0.6px]">
              Senha
            </label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={senha}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSenha(e.target.value)}
                placeholder="••••••••••"
                className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-lg px-4 py-3 pr-11 text-[13px] outline-none focus:border-[#E88407] focus:ring-2 focus:ring-[#E88407]/15 transition-all duration-200"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors border-none bg-transparent cursor-pointer">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-[12px] px-4 py-2.5 rounded-lg">
              <AlertCircle size={14} className="shrink-0" />
              <span>RG/CPF ou senha incorretos.</span>
            </div>
          )}

          <button type="submit" disabled={!rgCpf || senha.length < 6 || buscando}
            className="w-full bg-[#0F172A] text-white font-semibold py-3 rounded-xl mt-1 text-[14px] transition-all duration-200 hover:bg-[#1E293B] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 border-none cursor-pointer">
            {buscando ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>

      <p className="text-center mt-5 text-[13px]">
        <button
          onClick={onVoltar}
          className="text-[#E88407] hover:underline transition-colors bg-transparent border-none cursor-pointer inline-flex items-center gap-1.5 font-medium"
        >
          <ArrowLeft size={14} />
          Voltar
        </button>
      </p>
    </div>
  );
}

// TELA DE ADMIN //
function TelaAdmin({ onVoltar }: { onVoltar: () => void }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const logado = await authService.loginAdmin(email, senha);

      if (logado) {
        localStorage.setItem('tdb_auth', 'true');
        navigate('/dashboard');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro inesperado');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm">

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onVoltar}
            className="w-9 h-9 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center text-[#475569] transition-colors cursor-pointer border-none"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-[18px] font-bold text-[#0F172A]">Painel administrativo</h1>
            <p className="text-[12px] text-[#475569]">
              Preencha as credenciais e acesse o dashboard
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="exemplo@email.com"
            autoComplete="email"
          />

          <div>
            <label className="block text-[11px] text-[#475569] font-semibold mb-1.5 uppercase tracking-[0.6px]">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••••"
                required
                className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-lg px-4 py-3 pr-11 text-[13px] outline-none focus:border-[#E88407] focus:ring-2 focus:ring-[#E88407]/15 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors border-none bg-transparent cursor-pointer"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-[12px] px-4 py-2.5 rounded-lg">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F172A] text-white font-semibold py-3 rounded-xl mt-1 text-[14px] transition-all duration-200 hover:bg-[#1E293B] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 border-none cursor-pointer"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>

        </form>
      </div>

      <p className="text-center mt-5 text-[13px]">
        <button
          onClick={onVoltar}
          className="text-[#E88407] hover:underline transition-colors bg-transparent border-none cursor-pointer inline-flex items-center gap-1.5 font-medium"
        >
          <ArrowLeft size={14} />
          Voltar
        </button>
      </p>
    </div>
  );
}

// LOGIN PRINCIPAL //
export default function Login() {
  const [modo, setModo] = useState<Modo>('selecao');

  return (
    <div className="min-h-screen bg-[#FAFBFD] flex items-center justify-center p-4">
      {modo === 'selecao'  && <TelaSelecao  onSelect={setModo}                  />}
      {modo === 'paciente' && <TelaPaciente onVoltar={() => setModo('selecao')} />}
      {modo === 'admin'    && <TelaAdmin    onVoltar={() => setModo('selecao')} />}
      {modo === 'dentista' && <TelaDentista onVoltar={() => setModo('selecao')} />}
    </div>
  );
}