import { Navigate } from 'react-router-dom'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoutePaciente({ children }: Props) {
  const cpfSalvo = sessionStorage.getItem('tdb_rgCpf')

  if (!cpfSalvo) {
    return <Navigate to="/meu-atendimento" replace />
  }

  return <>{children}</>
}