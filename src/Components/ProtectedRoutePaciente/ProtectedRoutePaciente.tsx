import { Navigate } from 'react-router-dom'
import { portalAutenticado } from '../../Services/sessao'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoutePaciente({ children }: Props) {
  if (!portalAutenticado()) {
    return <Navigate to="/meu-atendimento" replace />
  }

  return <>{children}</>
}