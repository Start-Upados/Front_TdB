/**
 * Leitor de QR Code pela câmera (celular ou notebook).
 *
 * Usa a câmera traseira quando existe e decodifica cada quadro com o jsQR
 * (funciona em Chrome, Safari/iPhone, Firefox e Edge — o BarcodeDetector nativo
 * não existe no iPhone nem no Chrome do Windows). A câmera só abre em HTTPS ou localhost.
 */
import { useEffect, useRef, useState } from 'react'
import { X, Camera, AlertCircle } from 'lucide-react'

function mensagemDeErro(err: unknown): string {
  const nome = err instanceof DOMException ? err.name : ''
  if (nome === 'NotAllowedError' || nome === 'SecurityError') {
    return 'Permissão da câmera negada. Libere a câmera para este site nas configurações do navegador e tente de novo.'
  }
  if (nome === 'NotFoundError' || nome === 'OverconstrainedError') return 'Nenhuma câmera encontrada neste aparelho.'
  if (nome === 'NotReadableError') return 'A câmera está sendo usada por outro aplicativo. Feche-o e tente de novo.'
  if (typeof navigator !== 'undefined' && !navigator.mediaDevices?.getUserMedia) {
    return 'Este navegador não permite usar a câmera aqui (a câmera só funciona em https).'
  }
  return 'Não foi possível abrir a câmera.'
}

export function LeitorQrCode({ onLido, onFechar }: {
  onLido: (texto: string) => void
  onFechar: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [pronto, setPronto] = useState(false)
  // Callbacks mais recentes sem reiniciar a câmera a cada render do pai
  const onLidoRef = useRef(onLido)
  useEffect(() => { onLidoRef.current = onLido }, [onLido])

  useEffect(() => {
    let ativo = true
    let stream: MediaStream | null = null
    let frame = 0
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    async function iniciar() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('sem getUserMedia')
        const { default: jsQR } = await import('jsqr')
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (!ativo) { stream.getTracks().forEach((t) => t.stop()); return }
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        video.setAttribute('playsinline', 'true')   // iPhone: não abrir em tela cheia
        await video.play()
        setPronto(true)

        const ler = () => {
          if (!ativo) return
          if (ctx && video.readyState >= 2 && video.videoWidth > 0) {
            // Reduz o quadro: mais rápido e lê igual
            const escala = Math.min(1, 640 / video.videoWidth)
            canvas.width = Math.round(video.videoWidth * escala)
            canvas.height = Math.round(video.videoHeight * escala)
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const codigo = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
            if (codigo?.data) {
              ativo = false
              stream?.getTracks().forEach((t) => t.stop())
              onLidoRef.current(codigo.data)
              return
            }
          }
          frame = requestAnimationFrame(ler)
        }
        frame = requestAnimationFrame(ler)
      } catch (err) {
        if (ativo) setErro(mensagemDeErro(err))
      }
    }
    iniciar()

    return () => {
      ativo = false
      cancelAnimationFrame(frame)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
          <p className="flex items-center gap-2 text-[14px] font-bold text-[#0F172A]">
            <Camera size={16} className="text-[#E88407]" />
            Escanear QR Code
          </p>
          <button
            onClick={onFechar}
            className="rounded-lg p-1.5 text-[#475569] hover:bg-[#F1F5F9] border-none bg-transparent cursor-pointer"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {erro ? (
          <div className="flex items-start gap-2 p-5 text-[13px] text-red-600">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{erro}</p>
          </div>
        ) : (
          <div className="relative aspect-square bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            {/* Moldura de mira */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-3/5 w-3/5 rounded-2xl border-4 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
            {!pronto && (
              <p className="absolute inset-x-0 bottom-4 text-center text-[12px] text-white/90">Abrindo a câmera...</p>
            )}
          </div>
        )}

        <p className="px-4 py-3 text-center text-[12px] text-[#475569]">
          Aponte para o QR Code do comprovante do paciente. A leitura é automática.
        </p>
      </div>
    </div>
  )
}
