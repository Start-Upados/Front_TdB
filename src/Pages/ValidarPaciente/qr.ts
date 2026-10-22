/**
 * Lê o protocolo de dentro do QR Code do comprovante:
 * "https://.../validar-paciente?protocolo=TDB-2026-0042" ou "TDB-2026-0042" → "TDB-2026-0042".
 */
export function protocoloDoQr(texto: string): string {
  const t = (texto ?? '').trim()
  try {
    const url = new URL(t)
    const p = url.searchParams.get('protocolo')
    if (p) return p.trim().toUpperCase()
  } catch { /* não é URL: é o próprio protocolo */ }
  const m = t.match(/protocolo=([^&\s#]+)/i)
  if (m) return decodeURIComponent(m[1]).trim().toUpperCase()
  return t.toUpperCase()
}
