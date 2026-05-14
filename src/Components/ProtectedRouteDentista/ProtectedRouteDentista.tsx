import { Navigate } from 'react-router-dom'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRouteDentista({ children }: Props) {
  const croSalvo = sessionStorage.getItem('tdb_cro')

  if (!croSalvo) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}