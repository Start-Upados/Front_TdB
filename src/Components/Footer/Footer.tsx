import { Link } from "react-router-dom";

const Footer = () =>{
    return(
        <>
            <footer className=" bg-black text-center border-t-[5px] border-yellow-500 w-full py-16 px-5">
                <div className="text-white max-w-[1200px] mx-auto">
                    <Link to="/">
                    <img src="/logo-250x80.png" alt="Logo StartUpados()" className="mx-auto" />
                    </Link>
                    <p className="text-[#077cf0] text-base m-0 opacity-90 mt-4">
                    Inovação e tecnologia para transformar ideias em realidade 💡
                    </p>
                </div>
            </footer>
        </>
    )
}
export default Footer;