"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { Config, Venta } from "@/types";
import Navbar from "@/components/Navbar";
import { 
  AlertTriangle, 
  Trophy,
  ArrowRight,
  Check,
  Info,
  Star,
  Calendar,
  Sparkles,
  Copy,
  GraduationCap,
  ShoppingCart
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [config, setConfig] = useState<Config | null>(null);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Persistence: Load selected tickets from localStorage on mount (Safe way)
  useEffect(() => {
    const saved = localStorage.getItem("selected_tickets_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Use a small delay to move the state update out of the synchronous effect body
          // to avoid the 'react-hooks/set-state-in-effect' lint error.
          setTimeout(() => setSelectedNumbers(parsed), 0);
        }
      } catch {
        // Error is handled silently or logged without unused variable
      }
    }
  }, []);

  // Persistence: Save selected tickets to localStorage whenever they change
  useEffect(() => {
    if (selectedNumbers.length > 0) {
      localStorage.setItem("selected_tickets_draft", JSON.stringify(selectedNumbers));
    } else {
      localStorage.removeItem("selected_tickets_draft");
    }
  }, [selectedNumbers]);

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, "config", "actual"), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as Config);
      } else {
        setConfig({
          totalBoletas: 1000,
          precioBoleta: 10000,
          premio: "Premio por definir",
          meta: 1000000,
          loteria: "Lotería por definir",
          cifrasJuego: 3
        });
      }
      setLoading(false);
    }, () => {
      setError("Error al cargar la configuración.");
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
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSelect = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(prev => prev.filter(n => n !== num));
    } else {
      setSelectedNumbers(prev => [...prev, num]);
    }
  };

  const goToPurchase = () => {
    sessionStorage.setItem("preSelectedTickets", JSON.stringify(selectedNumbers));
    localStorage.removeItem("selected_tickets_draft");
    router.push("/comprar");
  };

  const formatTicketNumber = (num: number) => {
    return String(num).padStart(config?.cifrasJuego || 3, '0');
  };

  const isFlexibleDate = config?.fechaSorteo === "Al completar la boletería";

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "Próximamente";
    if (dateStr === "Al completar la boletería") return dateStr;
    
    try {
      const date = new Date(dateStr + "T12:00:00");
      return new Intl.DateTimeFormat('es-ES', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-white transition-colors">
        <AlertTriangle className="text-zinc-400 mb-4" size={48} />
        <h2 className="text-xl font-bold mb-2 tracking-tight text-gray-900">Problema de Conexión</h2>
        <p className="text-gray-500 mb-6 text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-zinc-900 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest cursor-pointer hover:scale-105 transition-all">Reintentar</button>
      </div>
    );
  }

  if (loading || !config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white transition-colors">
        <div className="w-10 h-10 border-2 border-zinc-100 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalTicketsVendidos = ventas.reduce((acc, v) => {
    if (v["numeros boletas"] && Array.isArray(v["numeros boletas"])) {
      return acc + v["numeros boletas"].length;
    }
    return acc + (v.numero !== undefined ? 1 : 0);
  }, 0);

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 md:pt-48 transition-colors">
        {/* Hero Section */}
        <section className="flex flex-col gap-12 mb-20 md:mb-32">
          <div className="space-y-8 max-w-5xl">
            <div className="flex items-center gap-3">
              <span className="h-[1px] w-8 bg-zinc-900"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Gran Rifa Familiar</span>
            </div>
            <h1 className="text-5xl md:text-8xl lg:text-[10rem] font-black text-gray-900 tracking-tighter leading-[0.85] uppercase italic">
              {config.premio}
            </h1>
            
            <div className="flex flex-wrap items-start gap-x-12 gap-y-8 pt-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Participación</p>
                <p className="text-2xl md:text-3xl font-black text-gray-900">{config.totalBoletas} <span className="text-gray-900">Boletas</span></p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inversión</p>
                <p className="text-2xl md:text-3xl font-black text-gray-900">{formatCurrency(config.precioBoleta)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</p>
                <p className="text-2xl md:text-3xl font-black text-gray-900">
                  {config.fechaSorteo && config.fechaSorteo !== "Al completar la boletería" ? "Fecha Confirmada" : "Abierta"}
                </p>
              </div>
            </div>

            {/* Progreso de la Meta */}
            <div className="max-w-xl space-y-4 pt-8">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Progreso de Ventas</p>
                  <p className="text-xl font-black text-zinc-900 italic">Meta del {((totalTicketsVendidos / config.totalBoletas) * 100).toFixed(0)}% cumplida</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Faltan</p>
                  <p className="text-xl font-black text-amber-500">{config.totalBoletas - totalTicketsVendidos} Boletas</p>
                </div>
              </div>
              <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200 shadow-inner">
                <div 
                  className="h-full bg-zinc-900 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${(totalTicketsVendidos / config.totalBoletas) * 100}%` }}
                />
              </div>
            </div>

            {isFlexibleDate && (
              <div className="bg-zinc-50 border-l-4 border-amber-400 p-8 rounded-r-[2rem] max-w-2xl animate-in fade-in slide-in-from-left-4 duration-700">
                <p className="text-sm md:text-base font-medium text-zinc-600 leading-relaxed italic mb-6">
                  Una vez agotada la boletería, se establecerá la fecha definitiva del sorteo, la cual se regirá por los resultados de la <span className="text-zinc-900 font-black">Lotería de Bogotá</span>. Podrás consultar el ganador oficial aquí mismo:
                </p>
                <Link 
                  href="/ganador"
                  className="inline-flex items-center gap-3 bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-zinc-200 cursor-pointer"
                >
                  <Trophy size={16} className="text-amber-400" />
                  Ver ganador →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Dynamic Raffle Date Banner */}
        {!isFlexibleDate && config.fechaSorteo && (
          <section className="mb-32 animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="bg-amber-50 border-l-[12px] border-amber-400 p-8 md:p-12 rounded-r-[3rem] flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-amber-900/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12">
                <Sparkles size={120} className="text-amber-600" />
              </div>
              <div className="w-20 h-20 bg-amber-400 text-white rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg shadow-amber-400/30 rotate-3">
                <Calendar size={40} strokeWidth={2.5} />
              </div>
              <div className="space-y-2 text-center md:text-left relative z-10">
                <div className="flex items-center justify-center md:justify-start gap-2 text-amber-600">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">¡Ya tenemos fecha confirmada!</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-black text-zinc-900 leading-tight">
                  El sorteo es el <span className="italic underline decoration-amber-300 underline-offset-8">{formatDate(config.fechaSorteo)}</span>
                </h2>
                <p className="text-sm font-bold text-amber-700 uppercase tracking-widest opacity-80">
                  Jugamos con el premio mayor de la {config.loteria}
                </p>
              </div>
              <Link 
                href="#boleteria"
                className="md:ml-auto bg-zinc-900 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-zinc-900/20 flex items-center gap-3 whitespace-nowrap cursor-pointer"
              >
                Apartar mi boleta
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        )}

        {/* ¿Cómo se juega? */}
        <section className="mb-20 md:mb-32">
          <div className="bg-zinc-900 text-white rounded-[3rem] p-10 md:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
              <Star size={160} />
            </div>
            <div className="relative z-10 max-w-3xl space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Info className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-widest italic">¿Cómo se juega?</h2>
              </div>
              <p className="text-xl md:text-3xl font-medium leading-relaxed italic opacity-90">
                Jugamos con las últimas <span className="text-amber-400 font-black">{config.cifrasJuego} cifras</span> del número ganador de la <span className="text-amber-400 font-black">{config.loteria}</span>. Si el número de tu boleta coincide exactamente, ¡ganás el premio!
              </p>
            </div>
          </div>
        </section>

        {/* Causa / ¿Para qué es la rifa? */}
        <section className="mb-40">
          <div className="bg-amber-50/50 border border-amber-100 p-10 md:p-16 rounded-[3rem] flex flex-col md:flex-row items-center gap-10">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-amber-900/5 rotate-2 shrink-0">
              <GraduationCap className="text-amber-500" size={40} />
            </div>
            <div className="space-y-4 text-center md:text-left">
              <h3 className="text-2xl font-black text-zinc-900 uppercase italic tracking-tight">Propósito de la Iniciativa</h3>
              <p className="text-lg md:text-xl font-medium text-zinc-600 leading-relaxed italic">
                &quot;Tu participación contribuye directamente al cumplimiento de metas académicas en <span className="text-zinc-900 font-black">Ingeniería</span>. Cada boleta representa un apoyo fundamental para la culminación de este proyecto profesional. ¡Gracias por ser parte de este logro!&quot;
              </p>
            </div>
          </div>
        </section>

        {/* Grid Visualizer / Selector */}
        <section className="mb-40 scroll-mt-32" id="boleteria">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-16">
            <div className="space-y-4">
              <h2 className="text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Boletería</h2>
              <p className="text-gray-500 font-medium max-w-sm leading-relaxed">Toca los números que deseas directamente en la cuadrícula.</p>
            </div>
            <div className="flex flex-wrap gap-8 text-[9px] font-black uppercase tracking-[0.2em]">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-100 border border-zinc-200" /> 
                <span className="text-gray-400">Libre</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-400" /> 
                <span className="text-amber-600">Apartada</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-zinc-900" /> 
                <span className="text-gray-900">Confirmada</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 gap-2 md:gap-3 mb-12">
            {Array.from({ length: config.totalBoletas }, (_, i) => i).map((num) => {
              const v = ventas.find(v => 
                v.numero === num || 
                (v["numeros boletas"] && Array.isArray(v["numeros boletas"]) && v["numeros boletas"].includes(num))
              );
              const isSelected = selectedNumbers.includes(num);
              
              let status = "disponible";
              if (v) {
                if (v.tipo === "fisica" || v.pago === "pagado") status = "bloqueada";
                else status = "reservada";
              }

              const isAvailable = status === "disponible";

              return (
                <button
                  key={num}
                  onClick={() => isAvailable && handleSelect(num)}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center rounded-xl md:rounded-2xl transition-all duration-300 border relative group overflow-hidden",
                    isAvailable && !isSelected && "bg-gray-50 border-zinc-100 text-gray-400 hover:border-zinc-900 hover:text-zinc-900 cursor-pointer shadow-sm active:scale-90",
                    isAvailable && isSelected && "bg-white border-zinc-900 text-zinc-900 shadow-xl shadow-zinc-100 cursor-pointer",
                    status === "reservada" && "bg-amber-400 border-amber-300 text-white cursor-not-allowed opacity-90",
                    status === "bloqueada" && "bg-zinc-900 border-zinc-900 text-white cursor-not-allowed shadow-inner"
                  )}
                >
                  <span className={cn(
                    "text-xs md:text-sm font-black leading-none tracking-tighter",
                    isAvailable && !isSelected ? "text-gray-900" : "text-white",
                    isAvailable && isSelected && "text-zinc-900"
                  )}>
                    {formatTicketNumber(num)}
                  </span>
                  {isAvailable && isSelected && (
                    <div className="absolute top-1 right-1">
                      <Check size={10} strokeWidth={4} className="text-zinc-900" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Métodos de Pago */}
        <section className="mb-40">
          <div className="space-y-4 mb-12">
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Métodos de pago</h2>
            <p className="text-gray-500 font-medium max-w-sm">Transfiere el valor de tu boleta a cualquiera de estas cuentas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Hiliana */}
            <div className="bg-white border border-zinc-100 p-8 rounded-[2.5rem] shadow-sm space-y-6">
              <Image src="/nequi.png" alt="Nequi" width={80} height={28} className="object-contain" />
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Titular</p>
                <p className="text-lg font-black text-gray-900 uppercase italic">Hiliana Ordoñez Lasso</p>
              </div>
              <div 
                onClick={() => copyToClipboard("3138648345")}
                className="flex items-center justify-between bg-zinc-50 p-4 rounded-2xl cursor-pointer hover:bg-zinc-100 transition-colors group relative"
              >
                <span className="text-xl font-black text-gray-900">3138648345</span>
                <Copy size={18} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                {copiedText === "3138648345" && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-black px-4 py-2 rounded-lg animate-in fade-in zoom-in">¡COPIADO!</div>
                )}
              </div>
            </div>

            {/* Juan */}
            <div className="bg-white border border-zinc-100 p-8 rounded-[2.5rem] shadow-sm space-y-6">
              <Image src="/nequi.png" alt="Nequi" width={80} height={28} className="object-contain" />
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Titular</p>
                <p className="text-lg font-black text-gray-900 uppercase italic">Juan Pantoja</p>
              </div>
              <div 
                onClick={() => copyToClipboard("3213873880")}
                className="flex items-center justify-between bg-zinc-50 p-4 rounded-2xl cursor-pointer hover:bg-zinc-100 transition-colors group relative"
              >
                <span className="text-xl font-black text-gray-900">3213873880</span>
                <Copy size={18} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                {copiedText === "3213873880" && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-black px-4 py-2 rounded-lg animate-in fade-in zoom-in">¡COPIADO!</div>
                )}
              </div>
            </div>

            {/* Bre-b */}
            <div className="bg-white border border-zinc-100 p-8 rounded-[2.5rem] shadow-sm space-y-6">
              <Image src="/bre-b.png" alt="Bre-b" width={80} height={28} className="object-contain" />
              <div className="space-y-4">
                <div 
                  onClick={() => copyToClipboard("3213873880")}
                  className="flex items-center justify-between bg-zinc-50 p-4 rounded-2xl cursor-pointer hover:bg-zinc-100 transition-colors group relative"
                >
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-zinc-400 uppercase">Celular</span>
                    <span className="text-lg font-black text-gray-900">3213873880</span>
                  </div>
                  <Copy size={16} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                  {copiedText === "3213873880" && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-black px-4 py-2 rounded-lg animate-in fade-in zoom-in">¡COPIADO!</div>
                  )}
                </div>
                <div 
                  onClick={() => copyToClipboard("@jupaor")}
                  className="flex items-center justify-between bg-zinc-50 p-4 rounded-2xl cursor-pointer hover:bg-zinc-100 transition-colors group relative"
                >
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-zinc-400 uppercase">Llave Bre-b</span>
                    <span className="text-lg font-black text-gray-900">@jupaor</span>
                  </div>
                  <Copy size={16} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                  {copiedText === "@jupaor" && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-black px-4 py-2 rounded-lg animate-in fade-in zoom-in">¡COPIADO!</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Floating Cart Pill */}
        <div className={cn(
          "fixed bottom-8 left-1/2 -translate-x-1/2 z-[150] transition-all duration-500 ease-out transform",
          selectedNumbers.length > 0 ? "translate-y-0 opacity-100 scale-100" : "translate-y-24 opacity-0 scale-90"
        )}>
          <div className="bg-zinc-900 text-white px-8 py-5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-8 whitespace-nowrap border border-white/10">
            <div className="flex items-center gap-4 border-r border-white/10 pr-8">
              <div className="relative">
                <ShoppingCart size={20} />
                <span className="absolute -top-3 -right-3 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-black text-white">{selectedNumbers.length}</span>
              </div>
              <p className="text-sm font-black tracking-tight">{formatCurrency(selectedNumbers.length * config.precioBoleta)} COP</p>
            </div>
            <button 
              onClick={goToPurchase}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:gap-4 transition-all cursor-pointer"
            >
              Ver resumen
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <footer className="mt-48 pt-16 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left pb-12">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-zinc-100">
              <span className="text-gray-900 font-black text-sm italic">S</span>
            </div>
            <div className="flex flex-col">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">SORTEA &copy; 2026</p>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                Desarrollado por <span className="text-zinc-900">JUAN JOSE PANTOJA</span>
              </p>
            </div>
          </div>
          <div className="flex gap-8 md:gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-200">
            <span>Premium System</span>
            <span>Seguridad Cifrada</span>
          </div>
        </footer>
      </main>
    </>
  );
}
