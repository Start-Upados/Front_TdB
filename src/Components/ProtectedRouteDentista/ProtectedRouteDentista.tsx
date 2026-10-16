import { Navigate } from 'react-router-dom'
import { portalAutenticado } from '../../Services/sessao'
 
interface Props {
  children: React.ReactNode
}
 
export default function ProtectedRouteDentista({ children }: Props) {
  if (!portalAutenticado()) {
    return <Navigate to="/login" replace />
  }
 
  return <>{children}</>
}