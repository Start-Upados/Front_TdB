import { useState, useEffect } from 'react';
import { readSheet } from '../../../Services/googleSheets';

// ─── TIPOS ────────────────────────────────────
interface Mensagem {
  id:       string;
  nome:     string;
  email:    string;
  telefone: string;
  assunto:  string;
  mensagem: string;
  canal:    string;
  tipo:     string;
  status:   'Nova' | 'Em atendimento' | 'Resolvida';
  data:     string;
  hora:     string;
  row:      number;
}

// ─── MOCK DATA (usado quando API não responde) ─
{/*
const MOCK: Mensagem[] = [
  { id: '001', nome: 'João Silva',      email: 'joao@email.com',    telefone: '(11) 99999-1111', assunto: 'Solicitar atendimento',   mensagem: 'Olá, meu filho de 14 anos precisa de atendimento odontológico urgente. Como posso agendar pelo programa?', canal: 'Site', tipo: 'Beneficiário', status: 'Nova',           data: '11/05/2025', hora: '09:14', row: 2 },
  { id: '002', nome: 'Dra. Ana Lima',   email: 'ana@dental.com',    telefone: '(21) 98888-2222', assunto: 'Quero ser voluntária',    mensagem: 'Sou dentista formada há 5 anos e gostaria muito de me cadastrar como voluntária do programa Dentista do Bem. Como faço?', canal: 'Site', tipo: 'Voluntário', status: 'Em atendimento', data: '11/05/2025', hora: '10:32', row: 3 },
  { id: '003', nome: 'Colgate Brasil',  email: 'csr@colgate.com',   telefone: '(11) 3333-4444', assunto: 'Proposta de parceria',    mensagem: 'Nossa empresa tem interesse em ampliar a parceria com a Turma do Bem para 2026. Podemos agendar uma reunião para discutir novos projetos?', canal: 'Email', tipo: 'Doador',    status: 'Nova',           data: '10/05/2025', hora: '14:20', row: 4 },
  { id: '004', nome: 'Maria Santos',    email: 'maria@gmail.com',   telefone: '(31) 97777-3333', assunto: 'Dúvida sobre programa',  mensagem: 'Gostaria de saber se minha filha de 12 anos se enquadra no programa. Ela nunca foi ao dentista e estamos em situação de vulnerabilidade social.', canal: 'Site', tipo: 'Beneficiário', status: 'Resolvida',      data: '09/05/2025', hora: '08:55', row: 5 },
  { id: '005', nome: 'Dr. Carlos Melo', email: 'carlos@clinic.com', telefone: '(41) 96666-4444', assunto: 'Cadastro voluntário',   mensagem: 'Tenho clínica própria em Curitiba e quero disponibilizar horários semanais para o programa. Qual é o processo de cadastramento?', canal: 'Site', tipo: 'Voluntário', status: 'Nova',           data: '09/05/2025', hora: '16:08', row: 6 },
  { id: '006', nome: 'Fundação XYZ',    email: 'contato@fund.org',  telefone: '(11) 5555-6666', assunto: 'Doação corporativa',     mensagem: 'Nossa fundação deseja fazer uma doação destinada ao programa Norte do Brasil, que tem baixa cobertura. Como proceder?', canal: 'Email', tipo: 'Doador',    status: 'Em atendimento', data: '08/05/2025', hora: '11:30', row: 7 },
]; */}

// ─── CONFIGURAÇÕES ────────────────────────────
const TIPO_OPTIONS = ['Todas', 'Beneficiário', 'Voluntário', 'Doador', 'Parceiro', 'Geral'];

const STATUS_CONFIG = {
  'Nova':           { cls: 'bg-[rgba(255,71,87,0.12)] text-[#FF4757]',   dot: '#FF4757'  },
  'Em atendimento': { cls: 'bg-[rgba(255,215,64,0.12)] text-[#FFD740]',  dot: '#FFD740'  },
  'Resolvida':      { cls: 'bg-[rgba(0,230,118,0.12)] text-[#00E676]',   dot: '#00E676'  },
};

const CANAL_CONFIG: Record<string, { color: string; icon: string }> = {
  'Site':      { color: '#40C4FF', icon: '🌐' },
  'Email':     { color: '#B39DDB', icon: '📧' },
  'WhatsApp':  { color: '#00E676', icon: '💬' },
  'Instagram': { color: '#FF9557', icon: '📸' },
};

const TIPO_COLOR: Record<string, string> = {
  'Beneficiário': '#00D4AA',
  'Voluntário':   '#40C4FF',
  'Doador':       '#FFD740',
  'Parceiro':     '#B39DDB',
  'Geral':        '#7EB3CE',
};

function timeAgo(data: string, hora: string): string {
  return `${data} às ${hora}`;
}

// ─── AVATAR ───────────────────────────────────
function Avatar({ nome, color }: { nome: string; color: string }) {
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
      style={{ background: color }}
    >
      {nome.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── CARD DA MENSAGEM (lista) ─────────────────
function MessageCard({ msg, selected, onClick }: { msg: Mensagem; selected: boolean; onClick: () => void }) {
  const sc  = STATUS_CONFIG[msg.status];
  const cc  = CANAL_CONFIG[msg.canal] ?? CANAL_CONFIG['Site'];
  const tc  = TIPO_COLOR[msg.tipo] ?? '#7EB3CE';

  return (
    <div
      onClick={onClick}
      className={`px-4 py-3.5 border-b border-[rgba(0,212,170,0.06)] cursor-pointer transition-all duration-150 ${
        selected ? 'bg-[rgba(0,212,170,0.08)] border-l-2 border-l-[#00D4AA]' : 'hover:bg-[rgba(255,255,255,0.02)]'
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar nome={msg.nome} color={tc} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[13px] font-semibold text-[#E8F4FD] truncate">{msg.nome}</span>
            <span className="text-[10px] text-[#3D6A85] shrink-0 ml-2">{msg.hora}</span>
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px]">{cc.icon}</span>
            <span className="text-[10px] font-medium" style={{ color: cc.color }}>{msg.canal}</span>
            <span className="text-[#3D6A85] text-[10px]">·</span>
            <span className="text-[10px] font-medium" style={{ color: tc }}>{msg.tipo}</span>
          </div>
          <p className="text-[12px] text-[#7EB3CE] truncate">{msg.mensagem}</p>
          <div className="mt-1.5">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.cls}`}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sc.dot }} />
              {msg.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAINEL DE DETALHE ────────────────────────
function MessageDetail({ msg, onStatusChange }: { msg: Mensagem; onStatusChange: (id: string, status: Mensagem['status']) => void }) {
  const [note, setNote]     = useState('');
  const [replied, setReplied] = useState(false);
  const tc = TIPO_COLOR[msg.tipo] ?? '#7EB3CE';
  const cc = CANAL_CONFIG[msg.canal] ?? CANAL_CONFIG['Site'];

  function handleReply() {
    if (!note.trim()) return;
    setReplied(true);
    setNote('');
    setTimeout(() => setReplied(false), 3000);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[rgba(0,212,170,0.1)]">
        <div className="flex items-start gap-3">
          <Avatar nome={msg.nome} color={tc} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-[#E8F4FD]">{msg.nome}</h3>
              <span className="text-[11px] text-[#3D6A85]">{timeAgo(msg.data, msg.hora)}</span>
            </div>
            <p className="text-[12px] text-[#7EB3CE] mt-0.5">{msg.email} · {msg.telefone}</p>

            {/* Badges */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: `${cc.color}18`, color: cc.color }}>
                {cc.icon} {msg.canal}
              </span>
              <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: `${tc}18`, color: tc }}>
                {msg.tipo}
              </span>
              <span className="text-[10.5px] text-[#3D6A85] font-medium">
                Assunto: {msg.assunto}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mensagem */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="bg-[#0C1B2E] rounded-xl p-4 mb-4">
          <p className="text-[13.5px] text-[#E8F4FD] leading-relaxed">{msg.mensagem}</p>
        </div>

        {/* Alterar status */}
        <div className="mb-4">
          <p className="text-[11px] text-[#3D6A85] uppercase tracking-wide font-semibold mb-2">
            Alterar status
          </p>
          <div className="flex gap-2">
            {(['Nova', 'Em atendimento', 'Resolvida'] as Mensagem['status'][]).map((s) => {
              const sc = STATUS_CONFIG[s];
              const isActive = msg.status === s;
              return (
                <button
                  key={s}
                  onClick={() => onStatusChange(msg.id, s)}
                  className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all cursor-pointer border-none font-[inherit] ${
                    isActive ? sc.cls : 'bg-[rgba(255,255,255,0.04)] text-[#3D6A85] hover:bg-[rgba(255,255,255,0.08)]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? sc.dot : '#3D6A85' }} />
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nota interna */}
        <div>
          <p className="text-[11px] text-[#3D6A85] uppercase tracking-wide font-semibold mb-2">
            Nota interna / resposta
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Digite uma nota ou resposta para esta mensagem..."
            className="w-full bg-[#07111E] border border-[rgba(0,212,170,0.15)] text-[#E8F4FD] placeholder-[#3D6A85] rounded-lg px-4 py-3 text-[12.5px] outline-none focus:border-[#00D4AA] transition-colors resize-none"
            rows={4}
          />
          {replied && (
            <div className="flex items-center gap-2 mt-2 text-[12px] text-[#00E676]">
              <span>✓</span> Nota salva com sucesso!
            </div>
          )}
          <button
            onClick={handleReply}
            className="mt-2 w-full bg-[#00D4AA] text-[#07111E] font-bold py-2.5 rounded-lg text-[13px] transition-all hover:bg-[#00b891] cursor-pointer border-none font-[inherit]"
          >
            Salvar nota
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CENTRAL DE MENSAGENS (PAGE PRINCIPAL) ────
export default function MessagesPage() {
  const [mensagens, setMensagens]   = useState<Mensagem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filtro, setFiltro]         = useState('Todas');
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState<Mensagem | null>(null);

  // Carrega dados do Google Sheets
  useEffect(() => {
    async function load() {
      try {
        const rows = await readSheet('Mensagens!A:M');
        if (rows.length > 1) {
          const parsed: Mensagem[] = rows.slice(1).filter(r => r[0]).map((r, i) => ({
            id:       r[0]  ?? '',
            nome:     r[1]  ?? '',
            email:    r[2]  ?? '',
            telefone: r[3]  ?? '',
            assunto:  r[4]  ?? '',
            mensagem: r[5]  ?? '',
            canal:    r[6]  ?? 'Site',
            tipo:     r[7]  ?? 'Geral',
            status:   (['Nova', 'Em andamento', 'Respondida', 'Fechada'].includes(r[8])
                        ? r[8]
                        : 'Nova') as Mensagem['status'],
            data:     r[9]  ?? '',
            hora:     r[10] ?? '',
            row:      i + 2,
          }));
          setMensagens(parsed.reverse());
          setSelected(parsed[0] ?? null);
        }
      } catch {
        // Usa mock data se API falhar
        setMensagens([]);
        setSelected(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Atualiza status
  function handleStatusChange(id: string, status: Mensagem['status']) {
    setMensagens(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
    // TODO: quando backend Java estiver pronto, chamar endpoint PATCH /api/mensagens/:id/status
  }

  // Filtragem
  const filtered = mensagens.filter(m => {
    const matchFiltro = filtro === 'Todas' || m.tipo === filtro;
    const matchSearch = !search || m.nome.toLowerCase().includes(search.toLowerCase()) ||
      m.mensagem.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    return matchFiltro && matchSearch;
  });

  // KPIs
  const total     = mensagens.length;
  const novas     = mensagens.filter(m => m.status === 'Nova').length;
  const emAtend   = mensagens.filter(m => m.status === 'Em atendimento').length;
  const resolvidas = mensagens.filter(m => m.status === 'Resolvida').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#3D6A85] text-[13px]">
        Carregando mensagens...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── KPIs ── */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total de mensagens',  value: total,      color: '#00D4AA', icon: '📨' },
          { label: 'Novas',               value: novas,      color: '#FF4757', icon: '🔴' },
          { label: 'Em atendimento',      value: emAtend,    color: '#FFD740', icon: '⏳' },
          { label: 'Resolvidas',          value: resolvidas, color: '#00E676', icon: '✅' },
        ].map((k, i) => (
          <div
            key={i}
            className="bg-[#0F2035] border border-[rgba(0,212,170,0.1)] border-t-2 rounded-xl px-4 py-3"
            style={{ borderTopColor: k.color }}
          >
            <p className="text-[10.5px] text-[#3D6A85] uppercase tracking-[0.6px] font-semibold mb-1.5">
              {k.icon} {k.label}
            </p>
            <p className="text-[24px] font-bold text-[#E8F4FD] leading-none">{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Canais futuros (preview) ── */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[11px] text-[#3D6A85] font-medium">Canais ativos:</span>
        {[
          { label: 'Site',       color: '#40C4FF', active: true  },
          { label: 'Email',      color: '#B39DDB', active: true  },
          { label: 'WhatsApp',   color: '#00E676', active: false },
          { label: 'Instagram',  color: '#FF9557', active: false },
          { label: 'Facebook',   color: '#4FC3F7', active: false },
        ].map((c) => (
          <span
            key={c.label}
            className={`text-[10.5px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
              c.active ? '' : 'opacity-40'
            }`}
            style={{
              background: `${c.color}15`,
              color: c.color,
              border: `1px solid ${c.color}30`,
            }}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${c.active ? 'animate-pulse' : ''}`}
              style={{ background: c.color }} />
            {c.label}
            {!c.active && <span className="text-[9px] opacity-60">em breve</span>}
          </span>
        ))}
      </div>

      {/* ── Painel principal ── */}
      <div className="flex flex-1 gap-3 min-h-0" style={{ height: '520px' }}>

        {/* ── Lista de mensagens ── */}
        <div className="w-[340px] shrink-0 bg-[#0F2035] border border-[rgba(0,212,170,0.1)] rounded-xl flex flex-col overflow-hidden">

          {/* Search */}
          <div className="p-3 border-b border-[rgba(0,212,170,0.08)]">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar mensagens..."
              className="w-full bg-[#07111E] border border-[rgba(0,212,170,0.15)] text-[#E8F4FD] placeholder-[#3D6A85] rounded-lg px-3 py-2 text-[12px] outline-none focus:border-[#00D4AA] transition-colors"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-1 p-2 border-b border-[rgba(0,212,170,0.08)] flex-wrap">
            {TIPO_OPTIONS.map(t => (
              <button
                key={t}
                onClick={() => setFiltro(t)}
                className={`text-[10px] font-semibold px-2 py-1 rounded-full transition-all cursor-pointer border-none font-[inherit] ${
                  filtro === t
                    ? 'bg-[rgba(0,212,170,0.15)] text-[#00D4AA]'
                    : 'bg-transparent text-[#3D6A85] hover:text-[#7EB3CE]'
                }`}
              >
                {t}
                {t !== 'Todas' && (
                  <span className="ml-1 opacity-60">
                    ({mensagens.filter(m => m.tipo === t).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-[#3D6A85] text-[12px]">
                Nenhuma mensagem encontrada
              </div>
            ) : (
              filtered.map(m => (
                <MessageCard
                  key={m.id}
                  msg={m}
                  selected={selected?.id === m.id}
                  onClick={() => setSelected(m)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Detalhe da mensagem ── */}
        <div className="flex-1 bg-[#0F2035] border border-[rgba(0,212,170,0.1)] rounded-xl overflow-hidden">
          {selected ? (
            <MessageDetail
              key={selected.id}
              msg={selected}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#3D6A85]">
              <span className="text-4xl mb-3">📨</span>
              <p className="text-[13px]">Selecione uma mensagem para visualizar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}