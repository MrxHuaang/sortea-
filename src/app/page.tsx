"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { Config, Venta } from "@/types";
import TicketGrid from "@/components/TicketGrid";
import VentasLista from "@/components/VentasLista";
import VentaModal from "@/components/VentaModal";
import Link from "next/link";
import { Settings, Info, Trophy, AlertTriangle, ArrowRight, ArrowUpRight } from "lucide-react";

export default function Home() {
  const [config, setConfig] = useState<Config | null>(null);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
      setError("Error al cargar la configuración. Verifica tu conexión.");
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <AlertTriangle className="text-zinc-400 mb-4" size={48} />
        <h2 className="text-xl font-bold mb-2 tracking-tight">Problema de Conexión</h2>
        <p className="text-zinc-500 mb-6 text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-zinc-900 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest">Reintentar</button>
      </div>
    );
  }

  if (loading || !config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-zinc-100 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  const recaudado = ventas
    .filter((v) => v.pago === "pagado")
    .length * config.precioBoleta;

  return (
    <main className="max-w-7xl mx-auto px-6 py-12 md:py-24 lg:py-32">
      {/* Brand Header */}
      <div className="flex items-center justify-between mb-24">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">S</span>
          </div>
          <span className="text-sm font-black uppercase tracking-[0.4em] text-zinc-900">SORTEA</span>
        </div>
        <Link 
          href="/admin" 
          className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all"
        >
          Acceso Administrador
          <ArrowUpRight size={14} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col gap-12 mb-32">
        <div className="space-y-6 max-w-4xl">
          <div className="flex items-center gap-3">
            <span className="h-[1px] w-6 bg-zinc-900"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Gran Rifa Familiar</span>
          </div>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-zinc-900 tracking-tighter leading-[0.85] uppercase">
            {config.premio}
          </h1>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4 pt-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Participación</p>
              <p className="text-xl font-bold text-zinc-900">{config.totalBoletas} Boletas</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Inversión</p>
              <p className="text-xl font-bold text-zinc-900">
                {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(config.precioBoleta)}
              </p>
            </div>
            {config.fechaSorteo && (
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Sorteo</p>
                <p className="text-xl font-bold text-zinc-900">{config.fechaSorteo}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-40">
        <div className="group relative">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-4 group-hover:text-zinc-900 transition-colors">Estado de Ventas</p>
          <div className="flex items-baseline gap-3">
            <span className="text-6xl font-black text-zinc-900">{ventas.length}</span>
            <span className="text-xl font-bold text-zinc-200 uppercase tracking-tighter">Confirmadas</span>
          </div>
          <p className="text-xs font-bold text-zinc-400 mt-2">De un total de {config.totalBoletas} disponibles</p>
        </div>

        <div className="group relative">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-4 group-hover:text-zinc-900 transition-colors">Recaudación Total</p>
          <div className="flex items-baseline gap-3">
            <span className="text-6xl font-black text-zinc-900">
              {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(recaudado)}
            </span>
          </div>
          <p className="text-xs font-bold text-zinc-400 mt-2">Meta establecida: {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(config.meta)}</p>
        </div>

        <div className="group relative">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-4 group-hover:text-zinc-900 transition-colors">Progreso Meta</p>
          <div className="flex items-center gap-6">
            <span className="text-6xl font-black text-zinc-900">
              {Math.min((recaudado / config.meta) * 100, 100).toFixed(0)}<span className="text-3xl">%</span>
            </span>
            <div className="flex-1 h-3 bg-zinc-50 rounded-full overflow-hidden border border-zinc-100">
              <div 
                className="h-full bg-zinc-900 transition-all duration-1000 ease-out" 
                style={{ width: `${(recaudado / config.meta) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Selection */}
      <section className="mb-40">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-zinc-900 tracking-tight uppercase">Selección</h2>
            <p className="text-zinc-400 font-medium max-w-sm">Haz clic en un número disponible para iniciar tu participación.</p>
          </div>
          <div className="flex flex-wrap gap-8 text-[9px] font-black uppercase tracking-[0.2em]">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full border border-zinc-200 bg-white" /> 
              <span className="text-zinc-400">Libre</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-400" /> 
              <span className="text-amber-600">En Proceso</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-zinc-900" /> 
              <span className="text-zinc-900">Asignada</span>
            </div>
          </div>
        </div>
        <TicketGrid 
          total={config.totalBoletas} 
          ventas={ventas} 
          onSelectTicket={setSelectedTicket} 
        />
      </section>

      {/* Participants Sidebar-like section */}
      <VentasLista ventas={ventas} />

      <VentaModal 
        numero={selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
      />

      <footer className="mt-40 pt-16 border-t border-zinc-50 flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center">
            <span className="text-zinc-900 font-black text-xs">S</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300">SORTEA &copy; 2026</p>
        </div>
        <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-zinc-200">
          <span>Pasto</span>
          <span>Pereira</span>
          <span>Premium System</span>
        </div>
      </footer>
    </main>
  );
}
