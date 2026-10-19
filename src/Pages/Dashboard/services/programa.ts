/**
 * Regra de programa da Turma do Bem (um lugar só, usado pela Central e pelo ML):
 *   - Apolônias do Bem → mulheres
 *   - Dentista do Bem  → jovens homens de 11 a 17 anos
 */
export type ProgramaPaciente = 'Dentista do Bem' | 'Apolônias do Bem';
export type Sexo = 'feminino' | 'masculino';

export function normalizarSexo(bruto?: string): Sexo | undefined {
  const s = (bruto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  if (!s) return undefined;
  if (s === 'f' || s.startsWith('fem') || s.startsWith('mulher')) return 'feminino';
  if (s === 'm' || s.startsWith('masc') || s.startsWith('homem')) return 'masculino';
  return undefined;
}

/**
 * Sexo decide. Sem sexo no cadastro: protocolo APO- é Apolônias;
 * menor de 18 é Dentista do Bem; adulto é Apolônias (Dentista do Bem não atende adulto).
 */
export function programaPorPerfil(sexo?: string, idade?: number, protocolo?: string): ProgramaPaciente {
  const sx = normalizarSexo(sexo);
  if (sx === 'feminino') return 'Apolônias do Bem';
  if (sx === 'masculino') return 'Dentista do Bem';
  if (protocolo?.toUpperCase().startsWith('APO-')) return 'Apolônias do Bem';
  if (idade !== undefined && idade < 18) return 'Dentista do Bem';
  if (idade !== undefined) return 'Apolônias do Bem';
  return 'Dentista do Bem';
}
