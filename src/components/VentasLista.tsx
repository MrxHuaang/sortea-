"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, writeBatch, onSnapshot } from "firebase/firestore";
import { Venta, Config } from "@/types";
import { Check, Trash2, Search, Edit3, Share2, Square, CheckSquare, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import EditVentaModal from "./EditVentaModal";

interface VentasListaProps {
  ventas: Venta[];
}

export default function VentasLista({ ventas }: VentasListaProps) {
  const [filtro, setFiltro] = useState<"todas" | "pagado" | "pendiente">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [editingVenta, setEditingVenta] = useState<Venta | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "actual"), (snap) => {
      if (snap.exists()) setConfig(snap.data() as Config);
    });
    return unsub;
  }, []);

  const formatNumber = (num: number) => {
    return String(num).padStart(config?.cifrasJuego || 3, '0');
  };

  const markAsPaid = async (id: string) => {
    try {
      await updateDoc(doc(db, "ventas", id), { pago: "pagado" });
    } catch (error) {
      console.error("Error al actualizar pago:", error);
    }
  };

  const markBulkAsPaid = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`¿Confirmar pago de ${selectedIds.length} boletas?`)) return;
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => batch.update(doc(db, "ventas", id), { pago: "pagado" }));
      await batch.commit();
      setSelectedIds([]);
    } catch (error) {
      console.error("Error en confirmación masiva:", error);
    }
  };

  const removeBulk = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`¿ELIMINAR ${selectedIds.length} boletas?`)) return;
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => batch.delete(doc(db, "ventas", id)));
      await batch.commit();
      setSelectedIds([]);
    } catch (error) {
      console.error("Error al eliminar en masa:", error);
    }
  };

  const shareWhatsApp = (venta: Venta) => {
    const text = `¡Hola ${venta.nombre}! 👋\n\nConfirmamos tu boleta #${formatNumber(venta.numero)} como PAGADA. ¡Gracias! 🍀`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === ventasFiltradas.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(ventasFiltradas.map(v => v.id));
    }
  };

  const exportToCSV = () => {
    const headers = ["Boleta", "Participante", "Contacto", "Estado", "Tipo", "Fecha"];
    const rows = ventasFiltradas.map(v => [
      formatNumber(v.numero),
      v.nombre,
      v.contacto,
      v.pago.toUpperCase(),
      v.tipo || "online",
      v.creadoEn?.toDate().toLocaleDateString() || ""
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `compradores-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const ventasFiltradas = ventas
    .filter((v) => (filtro === "todas" ? true : v.pago === filtro))
    .filter((v) => v.nombre.toLowerCase().includes(busqueda.toLowerCase()) || v.numero.toString().includes(busqueda))
    .sort((a, b) => a.numero - b.numero);

  return (
    <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-zinc-100 overflow-hidden shadow-sm transition-colors">
      <div className="p-6 md:p-12 border-b border-zinc-50 bg-zinc-50/30 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight italic">Compradores</h2>
            <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest">{ventasFiltradas.length} Registros</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <>
                <button onClick={markBulkAsPaid} className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center gap-2 animate-in zoom-in">
                  <Check size={14} /> Confirmar ({selectedIds.length})
                </button>
                <button onClick={removeBulk} className="bg-red-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 flex items-center gap-2 animate-in zoom-in">
                  <Trash2 size={14} /> Eliminar ({selectedIds.length})
                </button>
              </>
            )}
            <button onClick={exportToCSV} className="bg-zinc-100 text-zinc-500 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-zinc-900 border border-zinc-200 transition-all flex items-center gap-2">
              <Download size={14} /> Exportar CSV
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
            <input type="text" placeholder="Buscar por nombre o #" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-12 pr-6 py-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold outline-none w-full sm:w-64 focus:border-zinc-900 transition-all text-zinc-900" />
          </div>
          <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
            {(["todas", "pagado", "pendiente"] as const).map((f) => (
              <button key={f} onClick={() => setFiltro(f)} className={cn("px-4 py-2 text-[9px] font-black rounded-lg transition-all uppercase tracking-widest", filtro === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600")}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="text-zinc-300 text-[9px] uppercase font-black tracking-[0.2em] border-b border-zinc-50">
              <th className="px-8 py-6 w-32">
                <div className="flex items-center gap-3">
                  <button onClick={toggleSelectAll} className="hover:text-zinc-900 transition-colors">
                    {selectedIds.length === ventasFiltradas.length && ventasFiltradas.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                  <span className="text-[8px]">Todo</span>
                </div>
              </th>
              <th className="px-8 py-6 w-24">Boleta</th>
              <th className="px-8 py-6">Participante</th>
              <th className="px-8 py-6 text-center w-32">Estado</th>
              <th className="px-8 py-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {ventasFiltradas.length === 0 ? (
              <tr><td colSpan={5} className="px-8 py-32 text-center text-zinc-300 text-xs font-black uppercase tracking-widest">No se encontraron registros</td></tr>
            ) : (
              ventasFiltradas.map((venta) => (
                <tr key={venta.id} className={cn("hover:bg-zinc-50/50 transition-colors group", selectedIds.includes(venta.id) && "bg-zinc-50")}>
                  <td className="px-8 py-6">
                    <button onClick={() => toggleSelect(venta.id)} className={cn("transition-colors", selectedIds.includes(venta.id) ? "text-zinc-900" : "text-zinc-200 hover:text-zinc-400")}>
                      {selectedIds.includes(venta.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="px-8 py-6">
                    <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-zinc-900/10 italic">
                      {formatNumber(venta.numero)}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-base font-black text-zinc-900 uppercase leading-none italic">{venta.nombre}</span>
                      <span className="text-xs font-bold text-zinc-400 mt-1">{venta.contacto}</span>
                      {venta.tipo === "fisica" && <span className="inline-flex mt-2 text-[8px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest w-fit">Física</span>}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center">
                      <div className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-colors", venta.pago === "pagado" ? "bg-emerald-50 text-emerald-500 border-emerald-100" : "bg-amber-50 text-amber-500 border-amber-100")}>
                        {venta.pago}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => shareWhatsApp(venta)} className="p-2 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"><Share2 size={16} /></button>
                      <button onClick={() => setEditingVenta(venta)} className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={16} /></button>
                      {venta.pago === "pendiente" && <button onClick={() => markAsPaid(venta.id)} className="p-2 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"><Check size={16} /></button>}
                      <button onClick={() => removeVenta(venta.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {editingVenta && <EditVentaModal venta={editingVenta} onClose={() => setEditingVenta(null)} />}
    </div>
  );
}
