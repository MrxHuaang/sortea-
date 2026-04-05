"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Venta } from "@/types";
import { Search, Phone, Clock, CheckCircle2, MessageCircle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";

export default function StatusPage() {
  const [celular, setCelular] = useState("");
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Forzar scroll al inicio al cargar
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!celular) return;
    setLoading(true);

    const q = query(collection(db, "ventas"), where("contacto", ">=", celular));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Venta))
        .filter(v => v.contacto.includes(celular));
      setVentas(results);
      setLoading(false);
      setSearched(true);
    });

    return () => unsub();
  };

  const getStatusConfig = (venta: Venta) => {
    if (venta.pago === "pagado") {
      return {
        icon: CheckCircle2,
        color: "text-emerald-500 bg-emerald-50 border-emerald-100",
        message: "✓ Confirmada — ¡Estás participando!",
        label: "PAGADA"
      };
    }
    
    return {
      icon: Clock,
      color: "text-amber-500 bg-amber-50 border-amber-100",
      message: "⏳ Pendiente de confirmación — envíanos tu comprobante por WhatsApp.",
      label: "PENDIENTE"
    };
  };

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24 transition-colors">
        <div className="space-y-4 mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-zinc-900 tracking-tighter uppercase leading-none italic">Mi Estado</h1>
          <p className="text-gray-400 font-medium max-w-sm">Consulta el estado de tus boletas con tu número de celular.</p>
        </div>

        <form onSubmit={handleSearch} className="relative mb-24">
          <div className="relative group">
            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 transition-colors group-focus-within:text-zinc-900" size={20} />
            <input
              type="tel"
              required
              value={celular}
              onChange={(e) => setCelular(e.target.value.replace(/\D/g, ""))}
              placeholder="3101234567"
              className="w-full pl-16 pr-32 py-6 rounded-[2rem] bg-zinc-50 border-2 border-transparent focus:border-zinc-900 focus:bg-white outline-none transition-all font-bold text-zinc-900 text-lg"
            />
            <button 
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : (
                <>
                  <Search size={14} />
                  Buscar
                </>
              )}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          {searched && ventas.length === 0 && !loading && (
            <div className="text-center py-24 space-y-6 animate-in fade-in zoom-in">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto border border-zinc-100">
                <Info className="text-zinc-200" size={32} />
              </div>
              <div className="space-y-2">
                <p className="text-zinc-900 font-black uppercase tracking-widest text-sm">No encontramos boletas con ese número</p>
                <p className="text-zinc-400 text-xs font-medium">¿Ya enviaste tu comprobante de pago por WhatsApp?</p>
              </div>
            </div>
          )}

          {ventas.map((venta) => {
            const statusConfig = getStatusConfig(venta);
            return (
              <div 
                key={venta.id} 
                className="bg-white border border-zinc-100 p-8 md:p-10 rounded-[3rem] shadow-sm animate-in slide-in-from-bottom-4 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-zinc-900 rounded-[1.5rem] flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-zinc-900/10">
                      {venta.numero.toString().padStart(2, "0")}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Titular</p>
                      <p className="text-lg font-black text-zinc-900 uppercase leading-none">{venta.nombre}</p>
                    </div>
                  </div>
                  <div className={cn("px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest border self-start sm:self-center shadow-sm", statusConfig.color)}>
                    {statusConfig.label}
                  </div>
                </div>

                <div className={cn("flex items-start gap-4 p-6 rounded-2xl border mb-8 transition-colors", statusConfig.color)}>
                  <statusConfig.icon size={20} className="shrink-0 mt-0.5" />
                  <p className="text-xs font-black leading-relaxed italic">{statusConfig.message}</p>
                </div>
              </div>
            );
          })}

          {(searched || ventas.length > 0) && (
            <div className="pt-12 text-center">
              <a 
                href="https://wa.me/573213873880?text=Hola%2C%20tengo%20una%20pregunta%20sobre%20el%20estado%20de%20mi%20boleta%20🎟️"
                target="_blank"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-zinc-50 text-zinc-500 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:text-zinc-900 border border-zinc-100 transition-all"
              >
                <MessageCircle size={16} />
                ¿Tienes dudas? Escríbenos
              </a>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
