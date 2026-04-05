"use client";

import React, { useState } from "react";
import { Config } from "@/types";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Save, AlertCircle, Calendar, CheckCircle, Loader2 } from "lucide-react";

interface ConfigFormProps {
  config: Config;
}

export default function ConfigForm({ config: initialConfig }: ConfigFormProps) {
  const [config, setConfig] = useState<Config>(initialConfig);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      await setDoc(doc(db, "config", "actual"), config, { merge: true });
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
    <div className="bg-white rounded-[2.5rem] p-10 md:p-16 border border-zinc-100 shadow-sm overflow-hidden relative">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-1.5 h-12 bg-zinc-900 rounded-full" />
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Ajustes</h2>
          <p className="text-zinc-400 text-sm font-medium">Configuración de parámetros globales</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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

          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Meta Recaudación</label>
            <input
              type="number"
              required
              value={config.meta || 0}
              onChange={(e) => setConfig({ ...config, meta: Number(e.target.value) })}
              className="w-full bg-transparent border-b border-zinc-100 focus:border-zinc-900 py-4 outline-none transition-all text-2xl font-black text-zinc-900"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Fecha Sorteo</label>
            <div className="relative">
              <Calendar className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-300" size={24} />
              <input
                type="date"
                required
                value={config.fechaSorteo || ""}
                onChange={(e) => setConfig({ ...config, fechaSorteo: e.target.value })}
                className="w-full bg-transparent border-b border-zinc-100 focus:border-zinc-900 py-4 outline-none transition-all text-2xl font-black text-zinc-900"
              />
            </div>
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

          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Precio Boleta</label>
            <input
              type="number"
              required
              value={config.precioBoleta || 0}
              onChange={(e) => setConfig({ ...config, precioBoleta: Number(e.target.value) })}
              className="w-full bg-transparent border-b border-zinc-100 focus:border-zinc-900 py-4 outline-none transition-all text-2xl font-black text-zinc-900"
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
