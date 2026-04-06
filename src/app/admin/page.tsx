"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { onSnapshot, doc, collection, updateDoc } from "firebase/firestore";
import { Config, Venta } from "@/types";
import ConfigForm from "@/components/ConfigForm";
import PasswordModal from "@/components/PasswordModal";
import VentasLista from "@/components/VentasLista";
import SheetsManager from "@/components/SheetsManager";
import Link from "next/link";
import { 
  Settings, 
  CheckCircle2, 
  Clock, 
  LogOut,
  LayoutDashboard,
  ExternalLink,
  FileText,
  Menu,
  X,
  Trophy,
  Trash2
} from "lucide-react";
import { checkAuth, logout } from "@/app/actions";
import { cn, formatCurrency } from "@/lib/utils";

type TabType = "dashboard" | "config" | "pagadas" | "pendientes" | "hojas";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [config, setConfig] = useState<Config | null>(null);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Estados para sorteo
  const [loteroNumber, setLoteroNumber] = useState("");
  const [winnerName, setWinnerName] = useState("");
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);

  useEffect(() => {
    async function verify() {
      try {
        const authenticated = await checkAuth();
        setIsAdmin(authenticated);
      } catch {
        setIsAdmin(false);
      }
    }
    verify();
  }, []);

  useEffect(() => {
    if (isAdmin !== true) return;

    const unsubConfig = onSnapshot(doc(db, "config", "actual"), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as Config);
      } else {
        setConfig({
          totalBoletas: 1000,
          precioBoleta: 10000,
          premio: "Premio por definir",
          meta: 1000000,
          cifrasJuego: 3
        });
      }
      setLoading(false);
    }, () => {
      setError("Error al conectar con la base de datos.");
      setLoading(false);
    });

    const unsubVentas = onSnapshot(collection(db, "ventas"), (snapshot) => {
      const vData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Venta));
      setVentas(vData);
    });

    return () => {
      unsubConfig();
      unsubVentas();
    };
  }, [isAdmin]);

  const handleLogout = async () => {
    await logout();
    setIsAdmin(false);
  };

  const recordWinner = async () => {
    if (!loteroNumber || !winnerName || !config) return;
    
    const cifras = config.cifrasJuego || 3;
    const winningTicket = parseInt(loteroNumber.slice(-cifras));

    if (confirm(`¿Confirmar a ${winnerName} con la boleta #${winningTicket.toString().padStart(cifras, '0')} como ganador?`)) {
      try {
        await updateDoc(doc(db, "config", "actual"), {
          ganador: {
            numero: winningTicket,
            nombre: winnerName,
            numeroLoteria: loteroNumber
          }
        });
        setIsDrawModalOpen(false);
        setLoteroNumber("");
        setWinnerName("");
      } catch {
        alert("Error al registrar ganador");
      }
    }
  };

  const removeWinner = async () => {
    if (confirm("¿Eliminar información del ganador actual?")) {
      await updateDoc(doc(db, "config", "actual"), { ganador: null });
    }
  };

  if (isAdmin === null) return null;
  if (!isAdmin) return <PasswordModal onSuccess={() => setIsAdmin(true)} />;
  if (error) return <div className="p-10 text-center text-red-500 font-bold bg-white min-h-screen">{error}</div>;

  if (loading || !config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 border-2 border-zinc-100 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  const pagadas = ventas.filter(v => v.pago === "pagado");
  const pendientes = ventas.filter(v => v.pago === "pendiente");
  const totalRecaudado = pagadas.length * config.precioBoleta;
  const porcentajeMeta = Math.min((totalRecaudado / config.meta) * 100, 100);

  const tabs = [
    { id: "dashboard", label: "Resumen", icon: LayoutDashboard },
    { id: "config", label: "Configuración", icon: Settings },
    { id: "pagadas", label: "Confirmadas", icon: CheckCircle2, count: pagadas.length },
    { id: "pendientes", label: "Pendientes", icon: Clock, count: pendientes.length },
    { id: "hojas", label: "Hojas Físicas", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row transition-colors">
      {/* Mobile Header */}
      <div className="lg:hidden h-20 bg-white border-b border-zinc-100 px-6 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <h1 className="text-xs font-black text-zinc-900 tracking-widest uppercase">Admin</h1>
          </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-zinc-900 transition-all cursor-pointer">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-0 z-40 lg:sticky lg:top-0 lg:h-screen w-full lg:w-80 bg-white lg:bg-zinc-50/50 lg:border-r border-zinc-100 p-8 lg:p-12 flex flex-col transition-all duration-300 transform",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="hidden lg:flex items-center justify-between mb-16 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-zinc-200">
              <span className="text-white font-black text-lg italic">S</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-black text-zinc-900 tracking-[0.3em] uppercase italic">SORTEA</h1>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mt-1">Admin</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as TabType); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer",
                activeTab === tab.id 
                  ? "bg-zinc-900 text-white shadow-2xl shadow-zinc-200 scale-[1.02]" 
                  : "text-zinc-400 hover:text-zinc-900 hover:bg-white"
              )}
            >
              <div className="flex items-center gap-4">
                <tab.icon size={18} strokeWidth={2.5} />
                {tab.label}
              </div>
              {tab.count !== undefined && (
                <span className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black transition-colors",
                  activeTab === tab.id ? "bg-white/10" : "bg-zinc-100"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-zinc-100 space-y-6 shrink-0">
          <Link 
            href="/" 
            className="w-full flex items-center justify-between group px-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-900 transition-all cursor-pointer"
          >
            Vista Pública
            <ExternalLink size={14} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between group px-2 text-[10px] font-black text-zinc-300 uppercase tracking-widest hover:text-red-500 transition-all cursor-pointer"
          >
            Salir del Sistema
            <LogOut size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 lg:p-20 overflow-hidden bg-white transition-colors">
        {activeTab === "dashboard" && (
          <div className="animate-in fade-in zoom-in duration-700 space-y-16 md:space-y-24">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="h-[1px] w-6 bg-zinc-900"></span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Panel General</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-zinc-900 tracking-tighter uppercase leading-none italic">Análisis</h2>
              </div>
              <button 
                onClick={() => setIsDrawModalOpen(true)}
                className="bg-amber-400 hover:bg-amber-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-400/20 flex items-center gap-3 transition-all cursor-pointer"
              >
                <Trophy size={18} />
                Realizar Sorteo
              </button>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              <div className="group space-y-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-zinc-900 transition-colors italic">Recaudación Real</p>
                <h3 className="text-5xl md:text-6xl font-black text-zinc-900 tracking-tighter leading-none">{formatCurrency(totalRecaudado)}</h3>
                <div className="space-y-3">
                  <div className="w-full bg-zinc-50 h-2 rounded-full overflow-hidden border border-zinc-100 transition-colors">
                    <div className="bg-zinc-900 h-full transition-all duration-1000 ease-out" style={{ width: `${porcentajeMeta}%` }} />
                  </div>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right">{porcentajeMeta.toFixed(1)}% de la meta</p>
                </div>
              </div>

              <div className="group space-y-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-zinc-900 transition-colors italic">Base de Datos</p>
                <h3 className="text-5xl md:text-6xl font-black text-zinc-900 tracking-tighter leading-none">{ventas.length}</h3>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{pagadas.length} Registros Confirmados</p>
              </div>

              <div className="group space-y-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-zinc-900 transition-colors italic">Acciones Pendientes</p>
                <h3 className="text-5xl md:text-6xl font-black text-zinc-900 tracking-tighter leading-none">{pendientes.length}</h3>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Validación de pagos requerida</p>
              </div>
            </div>

            {config.ganador && (
              <div className="bg-amber-50 border border-amber-100 p-8 rounded-[3rem] flex items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-amber-400 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-amber-400/20">
                    <Trophy size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Ganador Registrado</p>
                    <h4 className="text-2xl font-black text-zinc-900 uppercase italic">#{config.ganador.numero.toString().padStart(config.cifrasJuego || 3, '0')} — {config.ganador.nombre}</h4>
                  </div>
                </div>
                <button onClick={removeWinner} className="p-4 text-zinc-300 hover:text-red-500 transition-colors cursor-pointer">
                  <Trash2 size={20} />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "config" && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            <ConfigForm config={config} />
          </div>
        )}

        {(activeTab === "pagadas" || activeTab === "pendientes") && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700 max-w-full overflow-hidden">
            <VentasLista ventas={activeTab === "pagadas" ? pagadas : pendientes} />
          </div>
        )}

        {activeTab === "hojas" && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            <SheetsManager totalBoletas={config.totalBoletas} ventas={ventas} />
          </div>
        )}
      </main>

      {/* Modal de Sorteo */}
      {isDrawModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md space-y-8 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-zinc-900 uppercase italic">Registrar Ganador</h3>
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest">Ingresa el resultado oficial de la lotería</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Número de Lotería (4 cifras)</label>
                <input 
                  type="text" 
                  maxLength={4}
                  value={loteroNumber}
                  onChange={(e) => setLoteroNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-zinc-50 p-5 rounded-2xl border-2 border-transparent focus:border-amber-400 outline-none transition-all font-black text-3xl tracking-widest text-center"
                  placeholder="0000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nombre del Ganador</label>
                <input 
                  type="text" 
                  value={winnerName}
                  onChange={(e) => setWinnerName(e.target.value)}
                  className="w-full bg-zinc-50 p-5 rounded-2xl border-2 border-transparent focus:border-amber-400 outline-none transition-all font-bold"
                  placeholder="Ej: Martha Cecilia"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsDrawModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-zinc-400 cursor-pointer">Cancelar</button>
              <button onClick={recordWinner} className="flex-[2] bg-amber-400 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-amber-400/20 cursor-pointer">Confirmar Ganador</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
