import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { Logo } from "./Logo";

export const Footer = () => {
    return (
        <footer className="bg-zinc-950 pt-20 pb-10 text-zinc-400">
            <div className="container mx-auto px-4">
                <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col gap-6">
                        <a href="/" className="flex items-center gap-2">
                            <Logo size={32} showText textColor="text-white" />
                        </a>
                        <p className="text-sm leading-relaxed">
                            Capacitando criadores moçambicanos a alcançar o mercado global.
                            A plataforma líder para comércio digital e artesanato em Moçambique.
                        </p>
                        <div className="flex gap-4">
                            {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 transition-all hover:bg-white hover:text-zinc-950">
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="mb-6 font-bold text-white">Mercado</h4>
                        <ul className="flex flex-col gap-4 text-sm">
                            <li><a href="#" className="hover:text-primary-500 transition-colors">Todos os Produtos</a></li>
                            <li><a href="#" className="hover:text-primary-500 transition-colors">Digital Assets</a></li>
                            <li><a href="#" className="hover:text-primary-500 transition-colors">Artesanato Local</a></li>
                            <li><a href="#" className="hover:text-primary-500 transition-colors">Eletrónicos</a></li>
                            <li><a href="#" className="hover:text-primary-500 transition-colors">Hardware Moz</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-6 font-bold text-white">Suporte</h4>
                        <ul className="flex flex-col gap-4 text-sm">
                            <li><a href="#" className="hover:text-primary-500 transition-colors">Centro de Ajuda</a></li>
                            <li><a href="#" className="hover:text-primary-500 transition-colors">Venda na VELORA</a></li>
                            <li><a href="#" className="hover:text-primary-500 transition-colors">Política de Devolução</a></li>
                            <li><a href="#" className="hover:text-primary-500 transition-colors">Segurança</a></li>
                            <li><a href="#" className="hover:text-primary-500 transition-colors">Contacto</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-6 font-bold text-white">Contactos</h4>
                        <ul className="flex flex-col gap-4 text-sm">
                            <li className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-primary-500" />
                                <span>contacto@veloraprod.mz</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-primary-500" />
                                <span>+258 84 000 0000</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-primary-500" />
                                <span>Maputo, Moçambique</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-20 border-t border-zinc-800 pt-8 text-center text-xs">
                    <p>© {new Date().getFullYear()} VELORA. Desenvolvido para Moçambique.</p>
                </div>
            </div>
        </footer>
    );
};
