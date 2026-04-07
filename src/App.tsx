
import { Routes, Route } from 'react-router-dom'
import Header from "./Components/Header/Header";
import Footer from "./Components/Footer/Footer";

import Home from './Pages/Home/Home'
import SobreNos from './Pages/SobreNos/SobreNos'
import NossosServicos from './Pages/NossosServicos/NossosServicos'
import FAQ from './Pages/FAQ/FAQ'
import FaleConosco from './Pages/FaleConosco/FaleConosco'
import Integrantes from './Pages/Integrantes/Integrantes'

const App = () =>{

  return(
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/NossosServicos" element={<NossosServicos />} />
        <Route path="/SobreNós" element={<SobreNos />} />
        <Route path="/Integrantes" element={<Integrantes />} />
        <Route path="/FAQ" element={<FAQ />} />
        <Route path="/FaleConosco" element={<FaleConosco />} />
      </Routes>

      <Footer />
      
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  )
}
export default App;