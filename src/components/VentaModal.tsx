"use client";

import React, { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { X, Check, Loader2, Sparkles } from "lucide-react";

interface VentaModalProps {
  numero: number | null;
  onClose: () => void;
}

export default function VentaModal({ numero, onClose }: VentaModalProps) {
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [pago, setPago] = useState<"pagado" | "pendiente">("pendiente");
  const [loading, setLoading] = useState(false);

  if (numero === null) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "ventas"), {
        numero,
        nombre,
        contacto,
        pago,
        tipo: "admin",
        creadoEn: serverTimestamp(),
      });
      onClose();
    } catch (error) {
      console.error("Error al registrar venta:", error);
      alert("Error al procesar el registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 transition-colors">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Registro Manual</h2>
            <div className="flex items-center gap-2 text-blue-600 mt-1">
              <Sparkles size={16} />
              <span className="text-sm font-black uppercase tracking-widest">Número #{numero.toString().padStart(2, "0")}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-200 rounded-2xl transition-all text-zinc-500">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-2">Nombre del participante</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-gray-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-2">Contacto / Ciudad</label>
              <input
                type="text"
                required
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="Ej: 310... / Pasto"
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 text-center">Estado del pago</label>
            <div className="flex gap-4 mt-3">
              <button
                type="button"
                onClick={() => setPago("pendiente")}
                className={`flex-1 py-4 rounded-2xl font-black transition-all border-2 text-sm ${
                  pago === "pendiente" 
                    ? "bg-orange-500 border-orange-400 text-white shadow-xl shadow-orange-100" 
                    : "bg-gray-50 border-transparent text-gray-400"
                }`}
              >
                Pendiente
              </button>
              <button
                type="button"
                onClick={() => setPago("pagado")}
                className={`flex-1 py-4 rounded-2xl font-black transition-all border-2 text-sm ${
                  pago === "pagado" 
                    ? "bg-green-500 border-green-400 text-white shadow-xl shadow-green-100" 
                    : "bg-gray-50 border-transparent text-gray-400"
                }`}
              >
                Pagado
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-gray-200 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (
              <>
                <Check size={20} />
                CONFIRMAR REGISTRO
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
