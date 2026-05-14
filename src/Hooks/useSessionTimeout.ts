import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

interface UseSessionTimeoutOptions {
  timeoutMinutes?:  number   // tempo até deslogar (padrão: 30min)
  warningMinutes?:  number   // aviso antes de deslogar (padrão: 1min)
  storageKey:       string   // chave do sessionStorage a remover
  redirectTo?:      string   // rota de redirecionamento (padrão: /login)
}

interface UseSessionTimeoutReturn {
  showWarning:    boolean
  minutesLeft:    number
  resetTimer:     () => void
}

export function useSessionTimeout({
  timeoutMinutes = 30,
  warningMinutes = 1,
  storageKey,
  redirectTo = '/login',
}: UseSessionTimeoutOptions): UseSessionTimeoutReturn {
  const navigate                    = useNavigate()
  const [showWarning, setShowWarning] = useState(false)
  const [minutesLeft, setMinutesLeft] = useState(timeoutMinutes)

  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearAllTimers = useCallback(() => {
    if (timerRef.current)    clearTimeout(timerRef.current)
    if (warningRef.current)  clearTimeout(warningRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }, [])

  const logout = useCallback(() => {
    clearAllTimers()
    sessionStorage.removeItem(storageKey)
    navigate(redirectTo)
  }, [clearAllTimers, storageKey, redirectTo, navigate])

  const startCountdown = useCallback(() => {
    setMinutesLeft(warningMinutes)
    countdownRef.current = setInterval(() => {
      setMinutesLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 60000)
  }, [warningMinutes])

  const resetTimer = useCallback(() => {
    clearAllTimers()
    setShowWarning(false)
    setMinutesLeft(timeoutMinutes)

    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000
    const logoutMs  = timeoutMinutes * 60 * 1000

    // Aviso antes de deslogar
    warningRef.current = setTimeout(() => {
      setShowWarning(true)
      startCountdown()
    }, warningMs)

    // Deslogar automaticamente
    timerRef.current = setTimeout(() => {
      logout()
    }, logoutMs)
  }, [clearAllTimers, timeoutMinutes, warningMinutes, startCountdown, logout])

  // Inicia o timer na montagem
  useEffect(() => {
    resetTimer()
    return () => clearAllTimers()
  }, [resetTimer, clearAllTimers])

  // Detecta atividade do usuário e reseta o timer
  useEffect(() => {
    const eventos = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']

    const handleAtividade = () => {
      if (!showWarning) {
        resetTimer()
      }
    }

    eventos.forEach(ev => window.addEventListener(ev, handleAtividade))
    return () => eventos.forEach(ev => window.removeEventListener(ev, handleAtividade))
  }, [resetTimer, showWarning])

  return { showWarning, minutesLeft, resetTimer }
}