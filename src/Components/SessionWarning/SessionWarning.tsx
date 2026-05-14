interface SessionWarningProps {
  minutesLeft: number
  onContinuar: () => void
  onSair:      () => void
}

export default function SessionWarning({ minutesLeft, onContinuar, onSair }: SessionWarningProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">

        {/* Icone */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-400 mb-5">
          <span className="text-3xl">⏰</span>
        </div>

        {/* Texto */}
        <h2 className="text-[20px] font-extrabold text-gray-800 mb-2">
          Sessao expirando!
        </h2>
        <p className="text-gray-500 text-[14px] mb-1">
          Sua sessao vai encerrar em
        </p>
        <p className="text-[32px] font-extrabold text-amber-500 mb-2 leading-none">
          {minutesLeft} {minutesLeft === 1 ? 'minuto' : 'minutos'}
        </p>
        <p className="text-gray-400 text-[13px] mb-6">
          Deseja continuar conectado?
        </p>

        {/* Botoes */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onContinuar}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer border-none text-[14px]"
          >
            Continuar conectado
          </button>
          <button
            onClick={onSair}
            className="w-full bg-gray-100 text-gray-600 font-semibold py-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 cursor-pointer border-none text-[14px]"
          >
            Sair agora
          </button>
        </div>

      </div>
    </div>
  )
}