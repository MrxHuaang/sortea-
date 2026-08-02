"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Config } from "@/types";
import confetti from "canvas-confetti";
import { Trophy, Crown, Star, TicketX } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function WinnerPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);

  // Forzar scroll al inicio al cargar
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const triggerConfetti = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "actual"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Config;
        setConfig(data);
        if (data.ganador && !data.ganador.sinGanador) {
          triggerConfetti();
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const formatWinnerNumber = (num: number) => {
    return String(num).padStart(config?.cifrasJuego || 3, '0');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-10 h-10 border-2 border-zinc-100 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24 transition-colors overflow-hidden">
        <div className="flex flex-col items-center text-center space-y-12">
          {!config?.ganador ? (
            <div className="animate-in fade-in zoom-in duration-700 space-y-8">
              <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mx-auto border border-zinc-100">
                <Star className="text-zinc-200" size={48} />
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl font-black text-zinc-900 uppercase tracking-tight">Sorteo en Proceso</h1>
                <p className="text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed italic">
                  La fecha oficial del sorteo se establecerá una vez completada la venta de la boletería, rigiéndose por los resultados de la Lotería de Bogotá. ¡Aún puedes participar!
                </p>
              </div>
              <Link 
                href="/comprar"
                className="inline-flex items-center gap-3 bg-zinc-900 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
              >
                Elegir mis números
              </Link>
            </div>
          ) : config.ganador.sinGanador ? (
            <div className="animate-in fade-in zoom-in duration-700 space-y-12 w-full">
              <div className="w-32 h-32 bg-zinc-900 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl">
                <TicketX size={64} strokeWidth={2.5} />
              </div>

              <div className="space-y-6">
                <h1 className="text-6xl md:text-8xl font-black text-zinc-900 tracking-tighter uppercase leading-none italic">
                  Sorteo Desierto
                </h1>
                <p className="text-zinc-400 font-black uppercase tracking-[0.4em] text-sm">Nadie ganó esta vez</p>
              </div>

              <div className="bg-zinc-50 border border-zinc-100 p-12 md:p-16 rounded-[4rem] space-y-10">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">Número Ganador</p>
                  <p className="text-8xl md:text-[10rem] font-black tracking-tighter leading-none italic text-zinc-900">
                    #{formatWinnerNumber(config.ganador.numero)}
                  </p>
                  {config.ganador.numeroLoteria && (
                    <div className="pt-4 space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Resultado {config.loteria}</p>
                      <p className="text-xl font-bold text-zinc-600">Lotero: {config.ganador.numeroLoteria} — Últimas {config.cifrasJuego} cifras: {formatWinnerNumber(config.ganador.numero)}</p>
                    </div>
                  )}
                </div>

                <div className="h-px bg-zinc-200 w-24 mx-auto" />

                <p className="text-zinc-500 font-medium max-w-md mx-auto leading-relaxed italic">
                  Esta boleta no fue vendida, así que el premio queda sin reclamar. Gracias a todos por participar.
                </p>
              </div>

              <p className="text-zinc-400 font-medium italic">Resultado oficial certificado por Sortea System</p>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in duration-1000 space-y-12 w-full">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400/20 blur-[100px] rounded-full animate-pulse" />
                <div className="relative w-32 h-32 bg-amber-400 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl rotate-12">
                  <Crown size={64} strokeWidth={2.5} />
                </div>
              </div>

              <div className="space-y-6">
                <h1 className="text-7xl md:text-9xl font-black text-zinc-900 tracking-tighter uppercase leading-none italic">
                  ¡Victoria!
                </h1>
                <p className="text-zinc-400 font-black uppercase tracking-[0.4em] text-sm">Felicidades al ganador oficial</p>
              </div>

              <div className="bg-zinc-900 text-white p-12 md:p-20 rounded-[4rem] shadow-2xl relative overflow-hidden group transition-colors border border-transparent">
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                  <Trophy size={160} />
                </div>
                
                <div className="relative z-10 space-y-10">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Número Ganador</p>
                    <p className="text-8xl md:text-[12rem] font-black tracking-tighter leading-none italic">
                      #{formatWinnerNumber(config.ganador.numero)}
                    </p>
                    {config.ganador.numeroLoteria && (
                      <div className="pt-4 space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Resultado {config.loteria}</p>
                        <p className="text-xl font-bold opacity-80">Lotero: {config.ganador.numeroLoteria} — Últimas {config.cifrasJuego} cifras: {formatWinnerNumber(config.ganador.numero)}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="h-px bg-white/10 w-24 mx-auto" />
                  
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Titular de la boleta</p>
                    <p className="text-3xl md:text-5xl font-black uppercase tracking-tight italic">{config.ganador.nombre}</p>
                  </div>
                </div>
              </div>

              <p className="text-zinc-400 font-medium italic">Resultado oficial certificado por Sortea System</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
