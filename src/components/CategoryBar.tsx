import { Code, Palette, Smartphone, Cpu, Camera, Music, GraduationCap, Briefcase } from "lucide-react";

const categories = [
    { name: "Digital Assets", icon: Code, color: "text-blue-500", bg: "bg-blue-50" },
    { name: "Artesanato", icon: Palette, color: "text-orange-500", bg: "bg-orange-50" },
    { name: "Smartphones", icon: Smartphone, color: "text-emerald-500", bg: "bg-emerald-50" },
    { name: "Tecnologia", icon: Cpu, color: "text-emerald-500", bg: "bg-emerald-50" },
    { name: "Fotografia", icon: Camera, color: "text-red-500", bg: "bg-red-50" },
    { name: "Música", icon: Music, color: "text-pink-500", bg: "bg-pink-50" },
    { name: "Educação", icon: GraduationCap, color: "text-indigo-500", bg: "bg-indigo-50" },
    { name: "Serviços", icon: Briefcase, color: "text-amber-500", bg: "bg-amber-50" },
];

export const CategoryBar = () => {
    return (
        <div className="border-b bg-white">
            <div className="container mx-auto px-4 overflow-x-auto no-scrollbar py-6">
                <div className="flex gap-4 md:justify-between items-center min-w-max">
                    {categories.map((cat) => (
                        <button
                            key={cat.name}
                            className="group flex flex-col items-center gap-2 transition-all hover:-translate-y-1"
                        >
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${cat.bg} ${cat.color} transition-all group-hover:scale-110 group-hover:shadow-lg shadow-sm border border-black/5`}>
                                <cat.icon className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-bold text-zinc-600 group-hover:text-primary-600">{cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
