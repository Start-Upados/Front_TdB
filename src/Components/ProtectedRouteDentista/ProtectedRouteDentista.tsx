import { Navigate } from 'react-router-dom'
 
interface Props {
  children: React.ReactNode
}
 
export default function ProtectedRouteDentista({ children }: Props) {
  const rgCpfSalvo = sessionStorage.getItem('tdb_rgCpf')
 
  if (!rgCpfSalvo) {
    return <Navigate to="/login" replace />
  }
 
  return <>{children}</>
}