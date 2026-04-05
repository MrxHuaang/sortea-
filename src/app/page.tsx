"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { Config, Venta } from "@/types";
import TicketGrid from "@/components/TicketGrid";
import Navbar from "@/components/Navbar";
import { 
  AlertTriangle, 
  ShoppingCart, 
  Search, 
  Trophy,
  ArrowRight,
  Check,
  Info,
  Star,
  ExternalLink
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
    }, (err) => {
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

  const handleSelect = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(prev => prev.filter(n => n !== num));
    } else {
      setSelectedNumbers(prev => [...prev, num]);
    }
  };

  const goToPurchase = () => {
    sessionStorage.setItem("preSelectedTickets", JSON.stringify(selectedNumbers));
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
    } catch (e) {
      return dateStr;
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-white transition-colors">
        <AlertTriangle className="text-zinc-400 mb-4" size={48} />
        <h2 className="text-xl font-bold mb-2 tracking-tight text-gray-900">Problema de Conexión</h2>
        <p className="text-gray-500 mb-6 text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-zinc-900 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest">Reintentar</button>
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

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 md:pt-48 transition-colors">
        {/* Hero Section */}
        <section className="flex flex-col gap-12 mb-32 md:mb-48">
          <div className="space-y-8 max-w-5xl">
            <div className="flex items-center gap-3">
              <span className="h-[1px] w-8 bg-zinc-900"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Gran Rifa Familiar</span>
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black text-gray-900 tracking-tighter leading-[0.8] uppercase italic">
              {config.premio}
            </h1>
            
            <div className="flex flex-wrap items-start gap-x-12 gap-y-8 pt-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Participación</p>
                <p className="text-2xl md:text-3xl font-black text-gray-900">{config.totalBoletas} <span className="text-gray-300">Boletas</span></p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inversión</p>
                <p className="text-2xl md:text-3xl font-black text-gray-900">{formatCurrency(config.precioBoleta)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gran Sorteo</p>
                <p className="text-2xl md:text-3xl font-black text-gray-900">{formatDate(config.fechaSorteo)}</p>
              </div>
            </div>

            {isFlexibleDate && (
              <div className="bg-zinc-50 border-l-4 border-amber-400 p-8 rounded-r-[2rem] max-w-2xl animate-in fade-in slide-in-from-left-4 duration-700">
                <p className="text-sm md:text-base font-medium text-zinc-600 leading-relaxed italic mb-6">
                  Agotada la boletería se asignará una fecha en que juega la <span className="text-zinc-900 font-black">Lotería de Bogotá</span>. Podrás consultar el ganador oficial aquí mismo:
                </p>
                <Link 
                  href="/ganador"
                  className="inline-flex items-center gap-3 bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-zinc-200"
                >
                  <Trophy size={16} className="text-amber-400" />
                  Ver ganador →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ¿Cómo se juega? */}
        <section className="mb-40">
          <div className="bg-zinc-900 text-white rounded-[3rem] p-10 md:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
              <Star size={160} />
            </div>
            <div className="relative z-10 max-w-3xl space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Info className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-widest">¿Cómo se juega?</h2>
              </div>
              <p className="text-xl md:text-3xl font-medium leading-relaxed italic opacity-90">
                Jugamos con las últimas <span className="text-amber-400 font-black">{config.cifrasJuego} cifras</span> del número ganador de la <span className="text-amber-400 font-black">{config.loteria}</span>. Si el número de tu boleta coincide exactamente, ¡ganás el premio!
              </p>
            </div>
          </div>
        </section>

        {/* Grid Visualizer / Selector */}
        <section className="mb-24 scroll-mt-32" id="boleteria">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-16">
            <div className="space-y-4">
              <h2 className="text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Elige tus números</h2>
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
              const v = ventas.find(v => v.numero === num);
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
                    isAvailable && !isSelected && "bg-gray-50 border-zinc-200 hover:border-zinc-900 cursor-pointer shadow-sm active:scale-90",
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
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:gap-4 transition-all"
            >
              Ver resumen
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <footer className="mt-48 pt-16 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-zinc-100">
              <span className="text-gray-900 font-black text-sm italic">S</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">SORTEA &copy; 2026</p>
          </div>
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-200">
            <span>Premium System</span>
            <span>Seguridad Cifrada</span>
          </div>
        </footer>
      </main>
    </>
  );
}
