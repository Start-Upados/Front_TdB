import { Link } from "react-router-dom";

const Footer = () =>{
    return(
        <>
            <footer className=" bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#1a1a2e] text-center border-t-[5px] border-yellow-500 w-full py-4 px-5">
                <div className="text-white max-w-[1200px] mx-auto">
                    <Link to="/">
                    <img src="/logo-250x80.png" alt="Logo StartUpados()" className="mx-auto" />
                    </Link>
                    {/*
                    <p className="text-[#077cf0] text-base m-0 opacity-90 mt-0">
                    Inovação e tecnologia para transformar idéias em realidade. 💡
                    </p>*/}
                    <p className="text-white text-base m-0 opacity-90 mt-1">
                     © 2026 StartUpados | Todos os direitos reservados. Desenvolvido com inovação, tecnologia, criatividade e responsabilidade.
                    </p>
                </div>
            </footer>
        </>
    )
}
export default Footer;