import { Routes, Route, BrowserRouter } from 'react-router-dom'

import Home from './Pages/Home/Home'
import SobreNos from './Pages/SobreNos/SobreNos'
import NossosServicos from './Pages/NossosServicos/NossosServicos'
import FAQ from './Pages/FAQ/FAQ'
import FaleConosco from './Pages/FaleConosco/FaleConosco'
import Integrantes from './Pages/Integrantes/Integrantes'
import Layout from './Components/Layout/Layout'
import Login from './Pages/Login/Login'
import Dashboard from './Pages/Dashboard/Dashboard'
import ProtectedRoute from './Components/ProtectedRoute/ProtectedRoute'
import PortalBeneficiario from './Pages/PortalBeneficiario/PortalBeneficiario'
import ProtectedRoutePaciente from './Components/ProtectedRoutePaciente/ProtectedRoutePaciente'
import PainelDentistaPage from './Pages/PortalDentista/PortalDentista'
import ProtectedRouteDentista from './Components/ProtectedRouteDentista/ProtectedRouteDentista'
import NotFound from './Pages/NotFound/NotFound'
import SolicitarAtendimento from './Pages/SolicitarAtendimento/SolicitarAtendimento'
import ValidarPaciente from './Pages/ValidarPaciente/ValidarPaciente'


const App = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/NossosServicos" element={<NossosServicos />} />
            <Route path="/SobreNos" element={<SobreNos />} />
            <Route path="/Integrantes" element={<Integrantes />} />
            <Route path="/FAQ" element={<FAQ />} />
            <Route path="/FaleConosco" element={<FaleConosco />} />
          </Route>

          {/* Login */}
          <Route path="/login" element={<Login />} />

          <Route path="/solicitar-atendimento" element={<SolicitarAtendimento />} />

          <Route path="/validar-paciente" element={<ValidarPaciente />} />

          {/* Portal do beneficiário */}
          <Route
            path="/meu-atendimento"
            element={
              <ProtectedRoutePaciente>
                <PortalBeneficiario />
              </ProtectedRoutePaciente>
            }
          />
          {/* Portal do Dentista/Voluntário */}
          <Route
            path="/meu-painel"
            element={
              <ProtectedRouteDentista>
                <PainelDentistaPage />
              </ProtectedRouteDentista>
            }
          />

          {/* Dashboard — protegido, exige login */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App;