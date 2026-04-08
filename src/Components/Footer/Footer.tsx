import { Link } from "react-router-dom";

const Footer = () =>{
    return(
        <>
            <div className="footer" id="footer">
                <Link to="/src/Pages/Home">Página Inicial</Link>
                <h2><strong>Inovação e tecnologia para transformar idéias em realidade💡</strong></h2>
            </div>
        </>
    )
}
export default Footer;