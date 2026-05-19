import { useState } from 'react';
import { Card } from '../components/Shared';
import {
  useAddPaciente,
  useAddAtendimento,
  useAddVoluntario,
  useAddDoacao,
} from '../../../Hooks/useSheets';

type TabId = 'paciente' | 'atendimento' | 'voluntario' | 'doacao';

const TABS: { id: TabId; label: string }[] = [
  { id: 'paciente',    label: 'Novo Paciente'    },
  { id: 'atendimento', label: 'Novo Atendimento' },
  { id: 'voluntario',  label: 'Novo Voluntário'  },
  { id: 'doacao',      label: 'Nova Doação'       },
];


function Input({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] text-[#7EB3CE] font-semibold mb-1.5 uppercase tracking-[0.6px]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#07111E] border border-[rgba(0,212,170,0.15)] text-[#E8F4FD] placeholder-[#3D6A85] rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-[#00D4AA] transition-colors"
      />
    </div>
  );
}


function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-[11px] text-[#7EB3CE] font-semibold mb-1.5 uppercase tracking-[0.6px]">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#07111E] border border-[rgba(0,212,170,0.15)] text-[#E8F4FD] rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-[#00D4AA] transition-colors"
      >
        <option value="">Selecione...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}


function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="w-full bg-[#00D4AA] text-[#07111E] font-bold py-2.5 rounded-lg text-[13px] transition-all hover:bg-[#00b891] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
    >
      {saving ? 'Salvando na planilha...' : 'Salvar no Google Sheets'}
    </button>
  );
}


function Success({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 bg-[rgba(0,230,118,0.08)] border border-[rgba(0,230,118,0.25)] text-[#00E676] text-[12px] px-4 py-2.5 rounded-lg">
      <span>✓</span> {msg}
    </div>
  );
}

// ─── FORMULÁRIO PACIENTE ──────────────────────
function FormPaciente() {
  const { addPaciente, saving } = useAddPaciente();
  const [success, setSuccess]  = useState(false);
  const [form, setForm] = useState({ nome: '', idade: '', cidade: '', programa: '', status: '' });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.nome || !form.idade) return;
    await addPaciente(form);
    setSuccess(true);
    setForm({ nome: '', idade: '', cidade: '', programa: '', status: '' });
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Input label="Nome completo"  value={form.nome}    onChange={set('nome')}   placeholder="Ex: João Silva" />
      <Input label="Idade"          value={form.idade}   onChange={set('idade')}  placeholder="Ex: 15"  type="number" />
      <Input label="Cidade"         value={form.cidade}  onChange={set('cidade')} placeholder="Ex: São Paulo" />
      <Select label="Programa"      value={form.programa} onChange={set('programa')}
        options={['Dentista do Bem', 'Apolônias do Bem']} />
      <Select label="Status"        value={form.status}  onChange={set('status')}
        options={['Ativo', 'Concluído', 'Pendente', 'Em espera']} />
      <div className="col-span-2">
        {success && <Success msg="Paciente salvo na planilha com sucesso!" />}
        <SaveButton saving={saving} onClick={handleSave} />
      </div>
    </div>
  );
}

// ─── FORMULÁRIO ATENDIMENTO ───────────────────
function FormAtendimento() {
  const { addAtendimento, saving } = useAddAtendimento();
  const [success, setSuccess]      = useState(false);
  const today = new Date().toLocaleDateString('pt-BR');
  const [form, setForm] = useState({ paciente: '', procedimento: '', dentista: '', status: '', data: today });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.paciente || !form.procedimento) return;
    await addAtendimento(form);
    setSuccess(true);
    setForm({ paciente: '', procedimento: '', dentista: '', status: '', data: today });
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Input  label="Nome do paciente"  value={form.paciente}     onChange={set('paciente')}     placeholder="Ex: João Silva" />
      <Select label="Procedimento"      value={form.procedimento}  onChange={set('procedimento')}
        options={['Avaliação inicial', 'Ortodontia', 'Extração', 'Restauração', 'Canal', 'Clareamento', 'Periodontia']} />
      <Input  label="Dentista"          value={form.dentista}     onChange={set('dentista')}     placeholder="Ex: Dra. Ana Paula" />
      <Select label="Status"            value={form.status}       onChange={set('status')}
        options={['Ativo', 'Concluído', 'Pendente', 'Alerta']} />
      <Input  label="Data"              value={form.data}         onChange={set('data')}         placeholder="DD/MM/AAAA" />
      <div className="col-span-2">
        {success && <Success msg="Atendimento salvo na planilha com sucesso!" />}
        <SaveButton saving={saving} onClick={handleSave} />
      </div>
    </div>
  );
}

// ─── FORMULÁRIO VOLUNTÁRIO ────────────────────
function FormVoluntario() {
  const { addVoluntario, saving } = useAddVoluntario();
  const [success, setSuccess]     = useState(false);
  const [form, setForm] = useState({ nome: '', cidade: '', estado: '', status: '' });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

  async function handleSave() {
    if (!form.nome || !form.cidade) return;
    await addVoluntario(form);
    setSuccess(true);
    setForm({ nome: '', cidade: '', estado: '', status: '' });
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Input  label="Nome completo" value={form.nome}   onChange={set('nome')}   placeholder="Ex: Dr. Carlos Mendes" />
      <Input  label="Cidade"        value={form.cidade} onChange={set('cidade')} placeholder="Ex: Belo Horizonte" />
      <Select label="Estado"        value={form.estado} onChange={set('estado')} options={ESTADOS} />
      <Select label="Status"        value={form.status} onChange={set('status')} options={['Ativo', 'Inativo']} />
      <div className="col-span-2">
        {success && <Success msg="Voluntário salvo na planilha com sucesso!" />}
        <SaveButton saving={saving} onClick={handleSave} />
      </div>
    </div>
  );
}

// ─── FORMULÁRIO DOAÇÃO ────────────────────────
function FormDoacao() {
  const { addDoacao, saving } = useAddDoacao();
  const [success, setSuccess] = useState(false);
  const today = new Date().toLocaleDateString('pt-BR');
  const [form, setForm] = useState({ empresa: '', valor: '', tipo: '', data: today });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.empresa || !form.valor) return;
    await addDoacao(form);
    setSuccess(true);
    setForm({ empresa: '', valor: '', tipo: '', data: today });
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Input  label="Empresa / Doador" value={form.empresa} onChange={set('empresa')} placeholder="Ex: Colgate-Palmolive" />
      <Input  label="Valor (R$)"       value={form.valor}   onChange={set('valor')}   placeholder="Ex: 50000" type="number" />
      <Select label="Tipo"             value={form.tipo}    onChange={set('tipo')}
        options={['Patrocinador Master', 'Patrocinador Diamante', 'Patrocinador Ouro', 'Patrocinador Prata', 'Apoiador']} />
      <Input  label="Data"             value={form.data}    onChange={set('data')}    placeholder="DD/MM/AAAA" />
      <div className="col-span-2">
        {success && <Success msg="Doação salva na planilha com sucesso!" />}
        <SaveButton saving={saving} onClick={handleSave} />
      </div>
    </div>
  );
}

// ─── DATA ENTRY PAGE ──────────────────────────
export default function DataEntryPage() {
  const [activeTab, setActiveTab] = useState<TabId>('paciente');

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-[18px] font-bold text-[#E8F4FD]">Insira os Dados</h2>
        <p className="text-[12px] text-[#3D6A85] mt-1">
          Os dados são salvos diretamente no banco de dados Oracle e na planilha Google Sheets da Turma do Bem.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-[12.5px] font-medium transition-all border cursor-pointer font-[inherit]
              ${activeTab === t.id
                ? 'bg-[rgba(0,212,170,0.15)] text-[#00D4AA] border-[rgba(0,212,170,0.3)]'
                : 'bg-transparent text-[#7EB3CE] border-[rgba(0,212,170,0.1)] hover:bg-[#152843]'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Form Card */}
      <Card title={TABS.find(t => t.id === activeTab)?.label}>
        {activeTab === 'paciente'    && <FormPaciente />}
        {activeTab === 'atendimento' && <FormAtendimento />}
        {activeTab === 'voluntario'  && <FormVoluntario />}
        {activeTab === 'doacao'      && <FormDoacao />}
      </Card>

      {/* Info */}
      <div className="mt-4 flex items-center gap-2 text-[11px] text-[#3D6A85]">
        <span className="text-[#00D4AA]">●</span>
        Dados salvos em tempo real no Banco de dados Oracle e Google Sheets planilha Turma_Do_Bem.
      </div>
    </div>
  );
}