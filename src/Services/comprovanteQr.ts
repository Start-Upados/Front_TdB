/**
 * QR Code do comprovante do paciente — usado no fim da solicitação e no portal do paciente.
 * O QR abre a tela "Validar paciente" do dentista já com o protocolo.
 */

export function urlValidacao(protocolo: string): string {
  return `https://www.startupados.com.br/validar-paciente?protocolo=${encodeURIComponent(protocolo)}`
}

/**
 * Monta uma imagem com o QR Code e o protocolo e baixa como PNG.
 * A senha NÃO vai na imagem: o comprovante é para mostrar ao dentista, e uma foto dele
 * não pode dar acesso ao portal do paciente.
 */
export async function baixarComprovante(svg: SVGSVGElement, protocolo: string, programa: string, cor: string): Promise<void> {
  const xml = new XMLSerializer().serializeToString(svg)
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const img = await new Promise<HTMLImageElement>((ok, falha) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = () => falha(new Error('QR Code não carregou'))
      i.src = url
    })
    const L = 720, A = 980
    const canvas = document.createElement('canvas')
    canvas.width = L; canvas.height = A
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas indisponível')
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, L, A)
    ctx.fillStyle = cor; ctx.fillRect(0, 0, L, 16)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#0F172A'; ctx.font = 'bold 44px Arial, sans-serif'
    ctx.fillText('Turma do Bem', L / 2, 96)
    ctx.fillStyle = '#475569'; ctx.font = '26px Arial, sans-serif'
    ctx.fillText(`Comprovante de solicitação · ${programa}`, L / 2, 140)
    // QR com margem branca
    const q = 460, x = (L - q) / 2, y = 190
    ctx.drawImage(img, x, y, q, q)
    ctx.fillStyle = '#475569'; ctx.font = '24px Arial, sans-serif'
    ctx.fillText('Número do protocolo', L / 2, y + q + 70)
    ctx.fillStyle = '#0F172A'; ctx.font = 'bold 52px "Courier New", monospace'
    ctx.fillText(protocolo, L / 2, y + q + 135)
    ctx.fillStyle = '#64748B'; ctx.font = '22px Arial, sans-serif'
    ctx.fillText('Mostre este QR Code ao dentista no dia da consulta.', L / 2, y + q + 195)
    ctx.fillText('startupados.com.br/validar-paciente', L / 2, y + q + 230)
    const png = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/png'))
    if (!png) throw new Error('Não foi possível gerar a imagem')
    const link = document.createElement('a')
    const href = URL.createObjectURL(png)
    link.href = href
    link.download = `comprovante-${protocolo}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(href), 1000)
  } finally {
    URL.revokeObjectURL(url)
  }
}
