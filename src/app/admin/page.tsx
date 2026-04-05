"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { onSnapshot, doc, collection } from "firebase/firestore";
import { Config, Venta } from "@/types";
import ConfigForm from "@/components/ConfigForm";
import PasswordModal from "@/components/PasswordModal";
import VentasLista from "@/components/VentasLista";
import Link from "next/link";
import { 
  ArrowLeft, 
  Settings, 
  CheckCircle2, 
  Clock, 
  LogOut,
  LayoutDashboard,
  AlertTriangle,
  Download,
  Users,
  DollarSign,
  TrendingUp,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { checkAuth, logout } from "@/app/actions";
import { cn, formatCurrency } from "@/lib/utils";

type TabType = "dashboard" | "config" | "pagadas" | "pendientes";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [config, setConfig] = useState<Config | null>(null);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      try {
        const authenticated = await checkAuth();
        setIsAdmin(authenticated);
      } catch (err) {
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
          totalBoletas: 100,
          precioBoleta: 10000,
          premio: "Premio por definir",
          meta: 1000000,
        });
      }
      setLoading(false);
    }, (err) => {
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

  const exportToCSV = () => {
    const headers = ["Numero", "Nombre", "Contacto", "Pago", "Fecha"];
    const rows = ventas.map(v => [
      v.numero,
      v.nombre,
      v.contacto,
      v.pago,
      v.creadoEn?.toDate().toLocaleDateString() || ""
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ventas_sortea_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isAdmin === null) return null;
  if (!isAdmin) return <PasswordModal onSuccess={() => setIsAdmin(true)} />;
  if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;

  if (loading || !config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
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
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Elegant Sidebar */}
      <aside className="w-full lg:w-80 bg-zinc-50/50 lg:border-r border-zinc-100 p-8 lg:p-12 flex flex-col">
        <div className="flex items-center gap-4 mb-16">
          <div className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-zinc-200">
            <span className="text-white font-black text-lg uppercase">S</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black text-zinc-900 tracking-[0.3em] uppercase">SORTEA</h1>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 space-y-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all",
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
                  "px-3 py-1 rounded-full text-[9px] font-black",
                  activeTab === tab.id ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-400"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-16 pt-8 border-t border-zinc-100 space-y-6">
          <button 
            onClick={exportToCSV}
            className="w-full flex items-center justify-between group px-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-600 transition-all"
          >
            Exportar Datos
            <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
          </button>
          <Link 
            href="/" 
            className="w-full flex items-center justify-between group px-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-900 transition-all"
          >
            Vista Pública
            <ExternalLink size={14} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between group px-2 text-[10px] font-black text-zinc-300 uppercase tracking-widest hover:text-red-500 transition-all"
          >
            Salir del Sistema
            <LogOut size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </aside>

      {/* Modern Main Content */}
      <main className="flex-1 p-8 lg:p-20 overflow-hidden">
        {activeTab === "dashboard" && (
          <div className="animate-in fade-in zoom-in duration-700 space-y-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="h-[1px] w-6 bg-zinc-900"></span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Estado del Proyecto</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Análisis General</h2>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="group space-y-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-zinc-900 transition-colors">Capital Recaudado</p>
                <h3 className="text-6xl font-black text-zinc-900 tracking-tighter leading-none">{formatCurrency(totalRecaudado)}</h3>
                <div className="space-y-3">
                  <div className="w-full bg-zinc-50 h-2 rounded-full overflow-hidden border border-zinc-100">
                    <div className="bg-zinc-900 h-full transition-all duration-1000 ease-out" style={{ width: `${porcentajeMeta}%` }} />
                  </div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">{porcentajeMeta.toFixed(1)}% de la meta</p>
                </div>
              </div>

              <div className="group space-y-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-zinc-900 transition-colors">Base de Usuarios</p>
                <h3 className="text-6xl font-black text-zinc-900 tracking-tighter leading-none">{ventas.length}</h3>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{pagadas.length} Registros Confirmados</p>
              </div>

              <div className="group space-y-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-zinc-900 transition-colors">Tareas Pendientes</p>
                <h3 className="text-6xl font-black text-zinc-900 tracking-tighter leading-none">{pendientes.length}</h3>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Requieren Validación</p>
              </div>
            </div>

            <div className="pt-20 border-t border-zinc-50">
              <div className="bg-zinc-50/50 p-12 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="space-y-4 text-center md:text-left">
                  <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Configuración Actual</p>
                  <h4 className="text-3xl font-black text-zinc-900 tracking-tight leading-none uppercase">{config.premio}</h4>
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Meta de {formatCurrency(config.meta)}</p>
                </div>
                <button 
                  onClick={() => setActiveTab("config")} 
                  className="bg-white border border-zinc-200 text-zinc-900 px-10 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all duration-300 flex items-center gap-4 group shadow-xl shadow-zinc-100"
                >
                  Gestionar Sistema
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "config" && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            <ConfigForm config={config} />
          </div>
        )}

        {(activeTab === "pagadas" || activeTab === "pendientes") && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            <VentasLista ventas={activeTab === "pagadas" ? pagadas : pendientes} />
          </div>
        )}
      </main>
    </div>
  );
}
