"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { X, Save, Loader2 } from "lucide-react";
import { Venta } from "@/types";

interface EditVentaModalProps {
  venta: Venta | null;
  onClose: () => void;
}

export default function EditVentaModal({ venta, onClose }: EditVentaModalProps) {
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [pago, setPago] = useState<"pagado" | "pendiente">("pendiente");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (venta) {
      setNombre(venta.nombre);
      setContacto(venta.contacto);
      setPago(venta.pago);
    }
  }, [venta]);

  if (!venta) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateDoc(doc(db, "ventas", venta.id), {
        nombre,
        contacto,
        pago,
      });
      onClose();
    } catch (error) {
      console.error("Error al actualizar venta:", error);
      alert("Hubo un error al actualizar los datos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl border border-zinc-100 w-full max-w-sm overflow-hidden">
        <div className="p-10 pb-0 flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Editar</h2>
            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Boleta #{venta.numero.toString().padStart(2, "0")}</p>
          </div>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nombre</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-transparent border-b border-zinc-100 focus:border-zinc-900 py-2 outline-none transition-all font-bold text-zinc-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Contacto</label>
              <input
                type="text"
                required
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                className="w-full bg-transparent border-b border-zinc-100 focus:border-zinc-900 py-2 outline-none transition-all font-bold text-zinc-900"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Pago</label>
              <div className="flex gap-2">
                {(["pendiente", "pagado"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPago(p)}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      pago === p 
                        ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" 
                        : "bg-zinc-50 text-zinc-400 hover:text-zinc-600"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Actualizar"}
          </button>
        </form>
      </div>
    </div>
  );
}
