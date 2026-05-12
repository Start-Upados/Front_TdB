import { useState, useEffect, useCallback } from 'react';
import { readSheet, appendSheet } from '../Services/googleSheets';

// ─── TIPOS ────────────────────────────────────
export interface Paciente {
  nome:          string;
  idade:         string;
  cidade:        string;
  programa:      string;
  status:        string;
  dataCadastro:  string;
}

export interface Atendimento {
  paciente:      string;
  procedimento:  string;
  dentista:      string;
  status:        string;
  data:          string;
}

export interface Voluntario {
  nome:      string;
  cidade:    string;
  estado:    string;
  pacientes: string;
  status:    string;
}

export interface Doacao {
  empresa: string;
  valor:   string;
  tipo:    string;
  data:    string;
}

export interface SheetsData {
  pacientes:     Paciente[];
  atendimentos:  Atendimento[];
  voluntarios:   Voluntario[];
  doacoes:       Doacao[];
}

// ─── PARSER: converte linhas em objetos ───────
function parsePacientes(rows: string[][]): Paciente[] {
  return rows.slice(1).filter(r => r[0]).map(r => ({
    nome:         r[0] ?? '',
    idade:        r[1] ?? '',
    cidade:       r[2] ?? '',
    programa:     r[3] ?? '',
    status:       r[4] ?? '',
    dataCadastro: r[5] ?? '',
  }));
}

function parseAtendimentos(rows: string[][]): Atendimento[] {
  return rows.slice(1).filter(r => r[0]).map(r => ({
    paciente:     r[0] ?? '',
    procedimento: r[1] ?? '',
    dentista:     r[2] ?? '',
    status:       r[3] ?? '',
    data:         r[4] ?? '',
  }));
}

function parseVoluntarios(rows: string[][]): Voluntario[] {
  return rows.slice(1).filter(r => r[0]).map(r => ({
    nome:      r[0] ?? '',
    cidade:    r[1] ?? '',
    estado:    r[2] ?? '',
    pacientes: r[3] ?? '0',
    status:    r[4] ?? '',
  }));
}

function parseDoacoes(rows: string[][]): Doacao[] {
  return rows.slice(1).filter(r => r[0]).map(r => ({
    empresa: r[0] ?? '',
    valor:   r[1] ?? '',
    tipo:    r[2] ?? '',
    data:    r[3] ?? '',
  }));
}

// ─── HOOK PRINCIPAL ───────────────────────────
export function useSheetsData() {
  const [data,    setData]    = useState<SheetsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [pacRows, atdRows, volRows, docRows] = await Promise.all([
        readSheet('Pacientes!A:F'),
        readSheet('Atendimentos!A:E'),
        readSheet('Voluntários!A:E'),
        readSheet('Doações!A:D'),
      ]);

      setData({
        pacientes:    parsePacientes(pacRows),
        atendimentos: parseAtendimentos(atdRows),
        voluntarios:  parseVoluntarios(volRows),
        doacoes:      parseDoacoes(docRows),
      });
    } catch (err) {
      setError('Erro ao carregar dados da planilha. Verifique as credenciais.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ─── HOOKS DE INSERÇÃO ────────────────────────
export function useAddPaciente() {
  const [saving, setSaving] = useState(false);

  async function addPaciente(p: Omit<Paciente, 'dataCadastro'>) {
    setSaving(true);
    const data = new Date().toLocaleDateString('pt-BR');
    await appendSheet('Pacientes!A:F', [[
      p.nome, p.idade, p.cidade, p.programa, p.status, data,
    ]]);
    setSaving(false);
  }

  return { addPaciente, saving };
}

export function useAddAtendimento() {
  const [saving, setSaving] = useState(false);

  async function addAtendimento(a: Atendimento) {
    setSaving(true);
    await appendSheet('Atendimentos!A:E', [[
      a.paciente, a.procedimento, a.dentista, a.status, a.data,
    ]]);
    setSaving(false);
  }

  return { addAtendimento, saving };
}

export function useAddVoluntario() {
  const [saving, setSaving] = useState(false);

  async function addVoluntario(v: Omit<Voluntario, 'pacientes'>) {
    setSaving(true);
    await appendSheet('Voluntários!A:E', [[
      v.nome, v.cidade, v.estado, '0', v.status,
    ]]);
    setSaving(false);
  }

  return { addVoluntario, saving };
}

export function useAddDoacao() {
  const [saving, setSaving] = useState(false);

  async function addDoacao(d: Doacao) {
    setSaving(true);
    await appendSheet('Doações!A:D', [[
      d.empresa, d.valor, d.tipo, d.data,
    ]]);
    setSaving(false);
  }

  return { addDoacao, saving };
}