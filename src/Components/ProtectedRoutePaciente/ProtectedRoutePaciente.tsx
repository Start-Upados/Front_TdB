import { Navigate } from 'react-router-dom'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoutePaciente({ children }: Props) {
  const cpfSalvo = sessionStorage.getItem('tdb_cpf')

  if (!cpfSalvo) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}