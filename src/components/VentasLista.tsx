"use client";

import React, { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Venta } from "@/types";
import { Check, Trash2, Search, Edit3, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import EditVentaModal from "./EditVentaModal";

interface VentasListaProps {
  ventas: Venta[];
}

export default function VentasLista({ ventas }: VentasListaProps) {
  const [filtro, setFiltro] = useState<"todas" | "pagado" | "pendiente">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [editingVenta, setEditingVenta] = useState<Venta | null>(null);

  const markAsPaid = async (id: string) => {
    try {
      await updateDoc(doc(db, "ventas", id), { pago: "pagado" });
    } catch (error) {
      console.error("Error al actualizar pago:", error);
    }
  };

  const removeVenta = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta venta?")) return;
    try {
      await deleteDoc(doc(db, "ventas", id));
    } catch (error) {
      console.error("Error al eliminar venta:", error);
    }
  };

  const shareWhatsApp = (venta: Venta) => {
    const text = `¡Hola ${venta.nombre}! 👋\n\nConfirmamos tu boleta para la rifa:\n🎫 *Número:* ${venta.numero.toString().padStart(2, "0")}\n💰 *Estado:* ${venta.pago.toUpperCase()}\n\n¡Gracias por participar! 🍀`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const ventasFiltradas = ventas
    .filter((v) => (filtro === "todas" ? true : v.pago === filtro))
    .filter((v) => 
      v.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
      v.numero.toString().includes(busqueda)
    )
    .sort((a, b) => a.numero - b.numero);

  return (
    <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
      <div className="p-8 md:p-12 border-b border-zinc-50 bg-zinc-50/20 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Compradores</h2>
          <p className="text-zinc-400 text-sm font-medium mt-1">Gestión detallada de participantes</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-bold shadow-sm outline-none w-full sm:w-64 focus:border-zinc-900 transition-all"
            />
          </div>

          <div className="flex bg-zinc-100/50 p-1 rounded-2xl">
            {(["todas", "pagado", "pendiente"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={cn(
                  "px-5 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest",
                  filtro === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-zinc-300 text-[10px] uppercase font-black tracking-widest border-b border-zinc-50">
              <th className="px-10 py-6 font-black">#</th>
              <th className="px-10 py-6 font-black">Participante</th>
              <th className="px-10 py-6 font-black text-center">Estado</th>
              <th className="px-10 py-6 font-black text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {ventasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-10 py-24 text-center text-zinc-300 text-xs font-bold">
                  Sin registros
                </td>
              </tr>
            ) : (
              ventasFiltradas.map((venta) => (
                <tr key={venta.id} className="hover:bg-zinc-50/30 transition-all group">
                  <td className="px-10 py-6">
                    <span className="text-base font-black text-zinc-900">
                      {venta.numero.toString().padStart(2, "0")}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                      <span className="text-base font-black text-zinc-900">{venta.nombre}</span>
                      <span className="text-xs font-bold text-zinc-400">{venta.contacto}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <div className="flex justify-center">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        venta.pago === "pagado" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                      )} />
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button
                        onClick={() => shareWhatsApp(venta)}
                        className="p-2.5 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                      >
                        <Share2 size={16} />
                      </button>
                      <button
                        onClick={() => setEditingVenta(venta)}
                        className="p-2.5 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                      {venta.pago === "pendiente" && (
                        <button
                          onClick={() => markAsPaid(venta.id)}
                          className="p-2.5 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => removeVenta(venta.id)}
                        className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingVenta && (
        <EditVentaModal 
          venta={editingVenta} 
          onClose={() => setEditingVenta(null)} 
        />
      )}
    </div>
  );
}
