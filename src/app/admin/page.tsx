"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  onSnapshot, 
  doc, 
  collection, 
  updateDoc, 
  writeBatch, 
  deleteField,
  getDocs,
  query,
  where 
} from "firebase/firestore";
import { Config, Venta } from "@/types";
import ConfigForm from "@/components/ConfigForm";
import PasswordModal from "@/components/PasswordModal";
import VentasLista from "@/components/VentasLista";
import SheetsManager from "@/components/SheetsManager";
import Link from "next/link";
import Image from "next/image";
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
  Trash2,
  ChevronDown,
  Wrench
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
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  // Estados para sorteo
  const [loteroNumber, setLoteroNumber] = useState("");
  const [winnerName, setWinnerName] = useState("");
  const [drawDate, setDrawDate] = useState("");
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);

  const openDrawModal = () => {
    // Prellenar con la fecha configurada del sorteo si ya es una fecha real
    const fecha = config?.fechaSorteo;
    setDrawDate(fecha && fecha !== "Al completar la boletería" ? fecha : "");
    setIsDrawModalOpen(true);
  };

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

  const formatDrawDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
      .format(new Date(dateStr + "T12:00:00"));
  };

  const recordWinner = async () => {
    if (!loteroNumber || !winnerName || !drawDate || !config) return;

    const cifras = config.cifrasJuego || 3;
    const winningTicket = parseInt(loteroNumber.slice(-cifras));

    if (confirm(`¿Confirmar a ${winnerName} con la boleta #${winningTicket.toString().padStart(cifras, '0')} como ganador?`)) {
      try {
        await updateDoc(doc(db, "config", "actual"), {
          ganador: {
            numero: winningTicket,
            nombre: winnerName,
            numeroLoteria: loteroNumber,
            fechaJugada: drawDate
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

  const recordNoWinner = async () => {
    if (!loteroNumber || !drawDate || !config) return;

    const cifras = config.cifrasJuego || 3;
    const winningTicket = parseInt(loteroNumber.slice(-cifras));

    if (confirm(`¿Confirmar que la boleta #${winningTicket.toString().padStart(cifras, '0')} no fue vendida y el sorteo quedó desierto?`)) {
      try {
        await updateDoc(doc(db, "config", "actual"), {
          ganador: {
            numero: winningTicket,
            nombre: "",
            numeroLoteria: loteroNumber,
            sinGanador: true,
            fechaJugada: drawDate
          }
        });
        setIsDrawModalOpen(false);
        setLoteroNumber("");
        setWinnerName("");
      } catch {
        alert("Error al registrar el sorteo desierto");
      }
    }
  };

  const removeWinner = async () => {
    if (confirm("¿Eliminar información del ganador actual?")) {
      await updateDoc(doc(db, "config", "actual"), { ganador: null });
    }
  };

  const standardizeVentas = async () => {
    if (!confirm("¿Deseas estandarizar todos los registros al formato nuevo? (Esto moverá el campo 'numero' a 'numeros boletas')")) return;
    
    try {
      const batch = writeBatch(db);
      let count = 0;
      
      ventas.forEach(v => {
        if (v.numero !== undefined && (!v["numeros boletas"] || v["numeros boletas"].length === 0)) {
          batch.update(doc(db, "ventas", v.id), {
            "numeros boletas": [v.numero],
            numero: deleteField()
          });
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        alert(`Se estandarizaron ${count} registros correctamente.`);
      } else {
        alert("Todos los registros ya están en el formato nuevo.");
      }
    } catch (error) {
      console.error("Error al estandarizar:", error);
      alert("Hubo un error al procesar la estandarización.");
    }
  };

  const consolidateVentas = async () => {
    if (!confirm("¿Deseas consolidar los registros duplicados? Esto unirá todas las compras de la misma persona (mismo nombre y contacto) en un solo registro, igual que la compra de Alveiro.")) return;
    
    try {
      const groups: { [key: string]: Venta[] } = {};
      
      // Agrupar por nombre y contacto (ignora mayúsculas/minúsculas y espacios extra)
      ventas.forEach(v => {
        const key = `${v.nombre.trim().toLowerCase()}_${v.contacto.trim().toLowerCase()}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(v);
      });

      const batch = writeBatch(db);
      let updatesCount = 0;
      let deletesCount = 0;

      Object.values(groups).forEach(group => {
        if (group.length > 1) {
          // Extraer todos los números de todos los registros del grupo
          const allNumbers = new Set<number>();
          group.forEach(v => {
            if (v.numero !== undefined) allNumbers.add(v.numero);
            if (v["numeros boletas"] && Array.isArray(v["numeros boletas"])) {
              v["numeros boletas"].forEach(n => allNumbers.add(n));
            }
          });

          // Ordenar registros por fecha para mantener el más antiguo como principal
          const sortedGroup = [...group].sort((a, b) => 
            (a.creadoEn?.toMillis() || 0) - (b.creadoEn?.toMillis() || 0)
          );
          
          const [main, ...others] = sortedGroup;
          
          // Actualizar el registro principal con la lista completa de números
          batch.update(doc(db, "ventas", main.id), {
            "numeros boletas": Array.from(allNumbers).sort((a, b) => a - b),
            numero: deleteField()
          });
          updatesCount++;

          // Eliminar los registros duplicados
          others.forEach(other => {
            batch.delete(doc(db, "ventas", other.id));
            deletesCount++;
          });
        }
      });

      if (deletesCount > 0) {
        await batch.commit();
        alert(`¡Éxito! Se consolidaron ${updatesCount} personas y se eliminaron ${deletesCount} registros duplicados.`);
      } else {
        alert("No se encontraron registros duplicados para consolidar.");
      }
    } catch (error) {
      console.error("Error al consolidar:", error);
      alert("Hubo un error durante la consolidación.");
    }
  };

  const cleanOrphanSales = async () => {
    if (!confirm("¿Deseas limpiar registros de ventas huérfanos? Esto liberará boletas de hojas que ya fueron borradas.")) return;
    
    try {
      const hojasSnapshot = await getDocs(collection(db, "hojas"));
      const existingHojaIds = new Set(hojasSnapshot.docs.map(d => d.id));
      
      const batch = writeBatch(db);
      let count = 0;
      
      ventas.forEach(v => {
        if (v.tipo === "fisica" && v.hojaId && !existingHojaIds.has(v.hojaId)) {
          batch.delete(doc(db, "ventas", v.id));
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        alert(`Se liberaron ${count} registros de boletas físicas huérfanas.`);
      } else {
        alert("No se encontraron registros huérfanos.");
      }
    } catch (error) {
      console.error("Error al limpiar:", error);
      alert("Hubo un error al procesar la limpieza.");
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

  const pagadas = ventas.filter(v => v.pago === "pagado" && v.tipo !== "fisica");
  const pendientes = ventas.filter(v => v.pago === "pendiente" && v.tipo !== "fisica");
  const fisicas = ventas.filter(v => v.tipo === "fisica");

  // Función para contar boletas de una venta (Soporta formato antiguo y nuevo)
  const getTicketsCount = (v: Venta) => {
    if (v["numeros boletas"] && Array.isArray(v["numeros boletas"])) {
      return v["numeros boletas"].length;
    }
    return v.numero !== undefined ? 1 : 0;
  };

  const totalTicketsPagados = pagadas.reduce((acc, v) => acc + getTicketsCount(v), 0);
  const totalTicketsPendientes = pendientes.reduce((acc, v) => acc + getTicketsCount(v), 0);
  const totalTicketsFisicos = fisicas.reduce((acc, v) => acc + getTicketsCount(v), 0);
  
  const totalRecaudado = totalTicketsPagados * config.precioBoleta;
  const porcentajeMeta = Math.min((totalRecaudado / config.meta) * 100, 100);

  const tabs = [
    { id: "dashboard", label: "Resumen", icon: LayoutDashboard },
    { id: "config", label: "Configuración", icon: Settings },
    { id: "pagadas", label: "Confirmadas", icon: CheckCircle2, count: totalTicketsPagados },
    { id: "pendientes", label: "Pendientes", icon: Clock, count: totalTicketsPendientes },
    { id: "hojas", label: "Hojas Físicas", icon: FileText, count: totalTicketsFisicos },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row transition-colors">
      {/* Mobile Header */}
      <div className="lg:hidden h-20 bg-white border-b border-zinc-100 px-6 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
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
              <div className="flex flex-wrap items-center gap-4">
                {/* Menú de Herramientas Discreto */}
                <div className="relative">
                  <button 
                    onClick={() => setIsToolsOpen(!isToolsOpen)}
                    className={cn(
                      "p-4 rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer",
                      isToolsOpen ? "bg-zinc-900 text-white shadow-xl" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    )}
                  >
                    <Wrench size={16} />
                    <span className="hidden sm:inline">Herramientas</span>
                    <ChevronDown size={14} className={cn("transition-transform", isToolsOpen && "rotate-180")} />
                  </button>

                  {isToolsOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-zinc-100 p-3 z-[150] animate-in fade-in slide-in-from-top-4 duration-300">
                      <button 
                        onClick={() => { standardizeVentas(); setIsToolsOpen(false); }}
                        className="w-full text-left px-5 py-4 rounded-2xl hover:bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-zinc-600 transition-colors cursor-pointer"
                      >
                        Estandarizar Datos
                      </button>
                      <button 
                        onClick={() => { consolidateVentas(); setIsToolsOpen(false); }}
                        className="w-full text-left px-5 py-4 rounded-2xl hover:bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-zinc-600 transition-colors cursor-pointer"
                      >
                        Consolidar Duplicados
                      </button>
                      <button 
                        onClick={() => { cleanOrphanSales(); setIsToolsOpen(false); }}
                        className="w-full text-left px-5 py-4 rounded-2xl hover:bg-red-50 text-[10px] font-black uppercase tracking-widest text-red-600 transition-colors cursor-pointer"
                      >
                        Limpiar Huérfanos
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  onClick={openDrawModal}
                  className="bg-amber-400 hover:bg-amber-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-400/20 flex items-center gap-3 transition-all cursor-pointer"
                >
                  <Trophy size={18} />
                  Realizar Sorteo
                </button>
              </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              <div className="group space-y-6 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-900 transition-colors italic truncate">Recaudación Real</p>
                <h3 className="text-4xl sm:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black text-zinc-900 tracking-tighter leading-none truncate">{formatCurrency(totalRecaudado)}</h3>
                <div className="space-y-3">
                  <div className="w-full bg-zinc-50 h-2 rounded-full overflow-hidden border border-zinc-100 transition-colors">
                    <div className="bg-zinc-900 h-full transition-all duration-1000 ease-out" style={{ width: `${porcentajeMeta}%` }} />
                  </div>
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right">{porcentajeMeta.toFixed(1)}% de la meta</p>
                </div>
              </div>

              <div className="group space-y-6 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-900 transition-colors italic truncate">Base de Datos</p>
                <h3 className="text-4xl sm:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black text-zinc-900 tracking-tighter leading-none truncate">{ventas.length}</h3>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest truncate">{pagadas.length} Registros Confirmados</p>
              </div>

              <div className="group space-y-6 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-900 transition-colors italic truncate">Acciones Pendientes</p>
                <h3 className="text-4xl sm:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black text-zinc-900 tracking-tighter leading-none truncate">{pendientes.length}</h3>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest truncate">Validación de pagos requerida</p>
              </div>
            </div>

            {config.ganador && (
              <div className={cn(
                "p-8 rounded-[3rem] flex items-center justify-between gap-8 border",
                config.ganador.sinGanador ? "bg-zinc-50 border-zinc-100" : "bg-amber-50 border-amber-100"
              )}>
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-16 h-16 text-white rounded-2xl flex items-center justify-center shadow-xl",
                    config.ganador.sinGanador ? "bg-zinc-900 shadow-zinc-200" : "bg-amber-400 shadow-amber-400/20"
                  )}>
                    <Trophy size={32} />
                  </div>
                  <div>
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      config.ganador.sinGanador ? "text-zinc-500" : "text-amber-600"
                    )}>
                      {config.ganador.sinGanador ? "Sorteo Desierto" : "Ganador Registrado"}
                    </p>
                    <h4 className="text-2xl font-black text-zinc-900 uppercase italic">
                      #{config.ganador.numero.toString().padStart(config.cifrasJuego || 3, '0')}
                      {config.ganador.sinGanador ? " — Boleta no vendida" : ` — ${config.ganador.nombre}`}
                    </h4>
                    {config.ganador.fechaJugada && (
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
                        Jugó el {formatDrawDate(config.ganador.fechaJugada)}
                      </p>
                    )}
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
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Fecha en que jugó el sorteo</label>
                <input
                  type="date"
                  value={drawDate}
                  onChange={(e) => setDrawDate(e.target.value)}
                  className="w-full bg-zinc-50 p-5 rounded-2xl border-2 border-transparent focus:border-amber-400 outline-none transition-all font-bold text-zinc-900"
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
                <p className="text-[10px] font-medium text-zinc-400 leading-relaxed">
                  Si la boleta ganadora no fue vendida, deja este campo vacío y usa <span className="font-black text-zinc-500">Nadie ganó</span>.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex gap-4">
                <button onClick={() => setIsDrawModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-zinc-400 cursor-pointer">Cancelar</button>
                <button
                  onClick={recordWinner}
                  disabled={!loteroNumber || !winnerName || !drawDate}
                  className="flex-[2] bg-amber-400 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-amber-400/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Confirmar Ganador
                </button>
              </div>
              <button
                onClick={recordNoWinner}
                disabled={!loteroNumber || !drawDate}
                className="w-full py-4 rounded-2xl border-2 border-zinc-100 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 disabled:opacity-40 disabled:hover:border-zinc-100 disabled:hover:text-zinc-500 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Nadie ganó — Sorteo desierto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
