import { Link } from "react-router-dom";

const Header = () =>{
    return(
        <>
        <div className="menu" id="menu">
            <Link to="/src/Pages/Home">Home</Link>
            <Link to="/src/Pages/NossosServicos">Nossos Serviços</Link>
            <Link to="/src/Pages/Integrantes">Integrantes</Link>
                    link ou href?
            <Link to="/src/Pages/SobreNos">Sobre nós</Link>
            <Link to="/src/Pages/FAQ">Perguntas Frequentes</Link>
            <Link to="/src/Pages/FaleConosco">Fale conosco</Link>
        </div>
        </>
    )
}
export default Header;