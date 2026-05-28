import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom'

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
import CadastrarVoluntario from './Pages/CadastrarVoluntario/CadastrarVoluntario'
//import PlaceholderPage from './Pages/Dashboard/pages/PlaceholderPage'
import VisaoGeralPage from './Pages/Dashboard/pages/VisaoGeralPage'
import CentralPage from './Pages/Dashboard/pages/CentralPage'
import TriagensPage from './Pages/Dashboard/pages/TriagensPage'
import VoluntariosPage from './Pages/Dashboard/pages/VoluntariosPage'
import DentistaPerfilPage from './Pages/Dashboard/pages/DentistaPerfilPage'
import AtendimentosPage from './Pages/Dashboard/pages/AtendimentosPage'
import MutiroesPage from './Pages/Dashboard/pages/MutiroesPage'
import FinanceiroPage from './Pages/Dashboard/pages/FinanceiroPage'
import RelatoriosPage from './Pages/Dashboard/pages/RelatoriosPage'
import ConfiguracoesPage from './Pages/Dashboard/pages/ConfiguracoesPage'

const App = () => {
  return (
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

        <Route path="/login" element={<Login />} />
        <Route path="/solicitar-atendimento" element={<SolicitarAtendimento />} />
        <Route path="/validar-paciente" element={<ValidarPaciente />} />
        <Route path="/cadastrar-voluntario" element={<CadastrarVoluntario />} />

        <Route
          path="/meu-atendimento"
          element={
            <ProtectedRoutePaciente>
              <PortalBeneficiario />
            </ProtectedRoutePaciente>
          }
        />
        <Route
          path="/meu-painel"
          element={
            <ProtectedRouteDentista>
              <PainelDentistaPage />
            </ProtectedRouteDentista>
          }
        />

        {/* Dashboard com sub-rotas aninhadas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="visao-geral" replace />} />
          <Route path="visao-geral"   element={<VisaoGeralPage />} />
          <Route path="triagens"      element={<TriagensPage />} />
          <Route path="atendimentos"  element={<AtendimentosPage />} />
          <Route path="voluntarios"     element={<VoluntariosPage />} />
          <Route path="voluntarios/:id" element={<DentistaPerfilPage />} />
          <Route path="mutiroes"      element={<MutiroesPage />} />
          <Route path="financeiro"    element={<FinanceiroPage />} />
          <Route path="comunicacoes"  element={<CentralPage />} />
          <Route path="relatorios"    element={<RelatoriosPage />} />
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;