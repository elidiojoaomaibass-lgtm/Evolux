import { useState, useEffect } from "react";
import { cn } from "./lib/utils";
import { Sidebar } from "./components/Sidebar";
import type { ViewType } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Views } from "./components/Views";
import { LoginView } from "./components/LoginView";
import { supabase } from "./lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { Toaster } from 'sonner';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeView, setActiveView] = useState<ViewType>("Dashboard");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Close sidebar on view change on mobile
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [activeView]);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Show login screen if not authenticated
  if (!session) {
    return <LoginView onLogin={() => {
      supabase.auth.getSession().then(({ data: { session } }: any) => {
        setSession(session);
      });
    }} />;
  }

  return (
    <div className="flex bg-[#faf9ff] dark:bg-[#0d0d17] min-h-screen font-sans transition-colors duration-500 overflow-x-hidden relative">
      {/* Premium Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-violet-500/5 dark:bg-violet-600/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-fuchsia-500/5 dark:bg-fuchsia-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] bg-blue-500/5 dark:bg-blue-600/5 rounded-full blur-[130px] animate-pulse-slow" />
      </div>

      <Sidebar
        activeView={activeView}
        setView={setActiveView}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 min-w-0 min-h-screen transition-all duration-300 relative z-10",
        "lg:ml-64",
        sidebarOpen ? "ml-64 opacity-50 blur-sm pointer-events-none lg:opacity-100 lg:blur-0 lg:pointer-events-auto" : "ml-0"
      )}>
        <div key={activeView} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeView === "Dashboard" && (
            <Dashboard
              onLogout={handleLogout}
              setView={setActiveView}
              user={session.user}
              toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />
          )}
          {activeView === "Vendas" && <Views.Vendas user={session.user} />}
          {activeView === "Produtos" && <Views.Produtos />}
          {activeView === "Afiliados" && <Views.Afiliados />}
          {activeView === "Mercado" && <Views.Mercado />}
          {activeView === "Pagamentos" && <Views.Pagamentos />}
          {activeView === "Saque" && <Views.Saque />}
          {activeView === "Premiações" && <Views.Premiações />}
          {activeView === "Marketing" && <Views.Ferramentas />}
          {activeView === "Analytics" && <Views.Analytics />}
          {activeView === "Configurações" && <Views.Configuracoes />}
        </div>
      </main>

      <Toaster richColors position="top-right" expand={false} />
    </div>
  );
}

export default App;
