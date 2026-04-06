"use client";

import React, { useState } from "react";
import { Config } from "@/types";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Save, Calendar, CheckCircle, Loader2 } from "lucide-react";

interface ConfigFormProps {
  config: Config;
}

export default function ConfigForm({ config: initialConfig }: ConfigFormProps) {
  const [config, setConfig] = useState<Config>(initialConfig);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tipoFecha, setTipoFecha] = useState(initialConfig.fechaSorteo === "Al completar la boletería" ? "flexible" : "definida");

  React.useEffect(() => {
    setConfig(initialConfig);
    setTipoFecha(initialConfig.fechaSorteo === "Al completar la boletería" ? "flexible" : "definida");
  }, [initialConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    const finalConfig = {
      ...config,
      fechaSorteo: tipoFecha === "flexible" ? "Al completar la boletería" : config.fechaSorteo
    };

    try {
      await setDoc(doc(db, "config", "actual"), finalConfig, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Error al guardar cambios");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-10 md:p-16 border border-zinc-100 shadow-sm overflow-hidden relative transition-colors">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-1.5 h-12 bg-zinc-900 rounded-full" />
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight italic">Ajustes</h2>
          <p className="text-zinc-400 text-sm font-medium">Configuración de parámetros globales</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Premio */}
          <div className="md:col-span-2 space-y-4">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Premio Principal</label>
            <input
              type="text"
              required
              value={config.premio || ""}
              onChange={(e) => setConfig({ ...config, premio: e.target.value })}
              className="w-full bg-transparent border-b border-zinc-100 focus:border-zinc-900 py-4 outline-none transition-all text-2xl font-black text-zinc-900"
              placeholder="Nombre del premio..."
            />
          </div>

          {/* Lotería */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Lotería / Juego</label>
            <input
              type="text"
              required
              value={config.loteria || ""}
              onChange={(e) => setConfig({ ...config, loteria: e.target.value })}
              className="w-full bg-transparent border-b border-zinc-100 focus:border-zinc-900 py-4 outline-none transition-all text-xl font-bold text-zinc-900"
              placeholder="Ej: Lotería del Chocó"
            />
          </div>

          {/* Cifras de Juego */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">¿Con cuántas cifras se juega?</label>
            <select
              value={config.cifrasJuego || 3}
              onChange={(e) => setConfig({ ...config, cifrasJuego: parseInt(e.target.value) })}
              className="w-full bg-transparent border-b border-zinc-100 focus:border-zinc-900 py-4 outline-none transition-all text-xl font-bold text-zinc-900"
            >
              <option value={2}>2 Cifras (00-99)</option>
              <option value={3}>3 Cifras (000-999)</option>
            </select>
          </div>

          {/* Fecha Flexible */}
          <div className="space-y-6">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Fecha del Sorteo</label>
            <div className="flex gap-4 p-1 bg-zinc-50 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setTipoFecha("definida")}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipoFecha === "definida" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400"}`}
              >
                Fecha Definida
              </button>
              <button
                type="button"
                onClick={() => setTipoFecha("flexible")}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipoFecha === "flexible" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400"}`}
              >
                Al completar
              </button>
            </div>

            {tipoFecha === "definida" ? (
              <div className="relative animate-in fade-in duration-300">
                <Calendar className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-300" size={24} />
                <input
                  type="date"
                  required={tipoFecha === "definida"}
                  value={config.fechaSorteo === "Al completar la boletería" ? "" : config.fechaSorteo || ""}
                  onChange={(e) => setConfig({ ...config, fechaSorteo: e.target.value })}
                  className="w-full bg-transparent border-b border-zinc-100 focus:border-zinc-900 py-4 outline-none transition-all text-2xl font-black text-zinc-900"
                />
              </div>
            ) : (
              <div className="py-4 text-zinc-400 italic text-sm animate-in fade-in duration-300">
                El sorteo se realizará cuando se vendan todas las boletas.
              </div>
            )}
          </div>

          {/* Precio y Total */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Valor de la boleta</label>
            <input
              type="number"
              required
              value={config.precioBoleta || 0}
              onChange={(e) => setConfig({ ...config, precioBoleta: Number(e.target.value) })}
              className="w-full bg-transparent border-b border-zinc-100 focus:border-zinc-900 py-4 outline-none transition-all text-2xl font-black text-zinc-900"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Total Boletas</label>
            <input
              type="number"
              required
              value={config.totalBoletas || 0}
              onChange={(e) => setConfig({ ...config, totalBoletas: Number(e.target.value) })}
              className="w-full bg-transparent border-b border-zinc-100 focus:border-zinc-900 py-4 outline-none transition-all text-2xl font-black text-zinc-900"
            />
          </div>

          {/* Datos de Pago */}
          <div className="md:col-span-2 pt-12 border-t border-zinc-50">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-1.5 h-8 bg-zinc-900 rounded-full" />
              <div>
                <h3 className="text-xl font-black text-zinc-900 tracking-tight uppercase italic">Datos de Pago</h3>
                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mt-1">Configuración para transferencias</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Número Nequi</label>
            <input
              type="text"
              value={config.nequiNumero || ""}
              onChange={(e) => setConfig({ ...config, nequiNumero: e.target.value })}
              className="w-full bg-transparent border-b border-zinc-100 focus:border-zinc-900 py-4 outline-none transition-all text-2xl font-black text-zinc-900"
              placeholder="310..."
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Nombre Titular</label>
            <input
              type="text"
              value={config.nequiNombre || ""}
              onChange={(e) => setConfig({ ...config, nequiNombre: e.target.value })}
              className="w-full bg-transparent border-b border-zinc-100 focus:border-zinc-900 py-4 outline-none transition-all text-2xl font-black text-zinc-900"
              placeholder="Nombre completo..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`px-12 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all flex items-center gap-4 ${
            saved 
              ? "bg-emerald-500 text-white shadow-xl shadow-emerald-100" 
              : "bg-zinc-900 text-white hover:bg-black shadow-xl shadow-zinc-200"
          }`}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : saved ? <CheckCircle size={20} /> : <Save size={20} />}
          {saved ? "Guardado" : "Actualizar Sistema"}
        </button>
      </form>
    </div>
  );
}
