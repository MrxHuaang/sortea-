"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, writeBatch, onSnapshot } from "firebase/firestore";
import { Venta, Config } from "@/types";
import { Check, Trash2, Search, Edit3, Share2, Square, CheckSquare, Download, Filter, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import EditVentaModal from "./EditVentaModal";

interface VentasListaProps {
  ventas: Venta[];
}

export default function VentasLista({ ventas }: VentasListaProps) {
  const [filtroPago, setFiltroPago] = useState<"todas" | "pagado" | "pendiente">("todas");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "online" | "fisica">("todos");
  const [busqueda, setBusqueda] = useState("");
  const [editingVenta, setEditingVenta] = useState<Venta | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [config, setConfig] = useState<Config | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "actual"), (snap) => {
      if (snap.exists()) setConfig(snap.data() as Config);
    });
    return unsub;
  }, []);

  const formatTicketNumber = (num: number) => {
    return String(num).padStart(config?.cifrasJuego || 3, '0');
  };

  const getNumbers = (venta: Venta) => {
    if (venta["numeros boletas"] && Array.isArray(venta["numeros boletas"])) {
      return venta["numeros boletas"];
    }
    return venta.numero !== undefined ? [venta.numero] : [];
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
    if (!confirm(`¿Confirmar pago de ${selectedIds.length} registros?`)) return;
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
    if (!confirm(`¿ELIMINAR ${selectedIds.length} registros?`)) return;
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => batch.delete(doc(db, "ventas", id)));
      await batch.commit();
      setSelectedIds([]);
    } catch (error) {
      console.error("Error al eliminar en masa:", error);
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
    const nums = getNumbers(venta).map(n => formatTicketNumber(n)).join(", ");
    const text = `¡Hola ${venta.nombre}! 👋\n\nConfirmamos tu reserva (${nums}) como PAGADA. ¡Gracias por participar! 🍀`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedVentas.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedVentas.map(v => v.id));
    }
  };

  const exportToCSV = () => {
    const headers = ["Boletas", "Participante", "Contacto", "Estado", "Tipo", "Fecha", "Hora"];
    const rows = ventasFiltradas.map(v => {
      const date = v.creadoEn?.toDate();
      return [
        getNumbers(v).map(n => formatTicketNumber(n)).join("-"),
        v.nombre,
        v.contacto,
        v.pago.toUpperCase(),
        v.tipo || "online",
        date?.toLocaleDateString() || "",
        date?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ""
      ];
    });
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `compradores-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const ventasFiltradas = ventas
    .filter((v) => (filtroPago === "todas" ? true : v.pago === filtroPago))
    .filter((v) => (filtroTipo === "todos" ? true : v.tipo === filtroTipo))
    .filter((v) => {
      const search = busqueda.toLowerCase();
      const nums = getNumbers(v).map(n => formatTicketNumber(n)).join(" ");
      return v.nombre.toLowerCase().includes(search) || 
             nums.includes(search) ||
             v.contacto.toLowerCase().includes(search);
    })
    // ORDEN: Por fecha de creación descendente (Las últimas primero)
    .sort((a, b) => (b.creadoEn?.toMillis() || 0) - (a.creadoEn?.toMillis() || 0));

  // Lógica de Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedVentas = ventasFiltradas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(ventasFiltradas.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1); // Resetear a página 1 cuando cambien los filtros o búsqueda
  }, [filtroPago, filtroTipo, busqueda]);

  return (
    <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-zinc-100 overflow-hidden shadow-sm transition-colors">
      {/* Header con Filtros */}
      <div className="p-6 md:p-12 border-b border-zinc-50 bg-zinc-50/30 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight italic">Compradores</h2>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{ventasFiltradas.length} Registros encontrados</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedIds.length > 0 && (
                <>
                  <button onClick={markBulkAsPaid} className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center gap-2 animate-in zoom-in transition-transform active:scale-95 cursor-pointer">
                    <Check size={14} /> Confirmar ({selectedIds.length})
                  </button>
                  <button onClick={removeBulk} className="bg-red-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 flex items-center gap-2 animate-in zoom-in transition-transform active:scale-95 cursor-pointer">
                    <Trash2 size={14} /> Eliminar ({selectedIds.length})
                  </button>
                </>
              )}
              <button onClick={exportToCSV} className="bg-zinc-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-zinc-900/10 cursor-pointer">
                <Download size={14} /> Exportar CSV
              </button>
            </div>
          </div>

          <div className="relative group lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-zinc-900" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, boleta o celular..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
              className="w-full pl-12 pr-6 py-4 bg-white border border-zinc-200 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all text-zinc-900 shadow-sm" 
            />
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-wrap gap-6 items-center pt-2">
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-zinc-100 shadow-sm">
            <div className="px-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 border-r border-zinc-100 mr-1">
              <Filter size={12} /> Pago
            </div>
            {(["todas", "pagado", "pendiente"] as const).map((f) => (
              <button key={f} onClick={() => setFiltroPago(f)} className={cn("px-4 py-2 text-[9px] font-black rounded-xl transition-all uppercase tracking-widest cursor-pointer", filtroPago === f ? "bg-zinc-900 text-white shadow-md" : "text-zinc-400 hover:text-zinc-600")}>
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-zinc-100 shadow-sm">
            <div className="px-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 border-r border-zinc-100 mr-1">
              <Filter size={12} /> Origen
            </div>
            {(["todos", "online", "fisica"] as const).map((f) => (
              <button key={f} onClick={() => setFiltroTipo(f)} className={cn("px-4 py-2 text-[9px] font-black rounded-xl transition-all uppercase tracking-widest cursor-pointer", filtroTipo === f ? "bg-zinc-900 text-white shadow-md" : "text-zinc-400 hover:text-zinc-600")}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="text-zinc-600 text-[10px] uppercase font-black tracking-[0.2em] border-b border-zinc-100 bg-zinc-50/50">
              <th className="px-4 py-6 w-16 text-center">
                <button onClick={toggleSelectAll} className="text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer">
                  {selectedIds.length === paginatedVentas.length && paginatedVentas.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
              </th>
              <th className="px-4 py-6 w-32">Boletas</th>
              <th className="px-4 py-6">Participante</th>
              <th className="px-4 py-6 text-center w-36">Fecha y Hora</th>
              <th className="px-4 py-6 text-center w-28">Estado</th>
              <th className="px-4 py-6 text-right w-40">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {paginatedVentas.length === 0 ? (
              <tr><td colSpan={6} className="px-8 py-32 text-center text-zinc-400 text-xs font-black uppercase tracking-widest">No se encontraron registros</td></tr>
            ) : (
              paginatedVentas.map((venta) => {
                const nums = getNumbers(venta);
                const date = venta.creadoEn?.toDate();
                
                return (
                  <tr key={venta.id} className={cn("hover:bg-zinc-50/50 transition-colors group", selectedIds.includes(venta.id) && "bg-zinc-50")}>
                    <td className="px-4 py-6 text-center">
                      <button onClick={() => toggleSelect(venta.id)} className={cn("transition-colors cursor-pointer", selectedIds.includes(venta.id) ? "text-zinc-900" : "text-zinc-300 hover:text-zinc-500")}>
                        {selectedIds.includes(venta.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex flex-wrap gap-1">
                        {nums.slice(0, 2).map((n) => (
                          <div key={n} className="px-2 py-1 bg-zinc-900 rounded-lg text-white font-black text-[9px] shadow-sm italic">
                            {formatTicketNumber(n)}
                          </div>
                        ))}
                        {nums.length > 2 && <span className="text-[9px] font-black text-zinc-300 self-center">+{nums.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-zinc-900 uppercase leading-none italic">{venta.nombre}</span>
                        <span className="text-[10px] font-bold text-zinc-500 mt-1">{venta.contacto}</span>
                      </div>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[11px] font-black text-zinc-900">{date?.toLocaleDateString() || "--"}</span>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                          <Clock size={10} />
                          {date?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "--"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex justify-center">
                        <div className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm transition-colors", venta.pago === "pagado" ? "bg-emerald-500 text-white border-emerald-400" : "bg-amber-400 text-white border-amber-300")}>
                          {venta.pago}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex justify-end gap-1.5 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => shareWhatsApp(venta)} title="WhatsApp" className="p-2 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-lg transition-all cursor-pointer"><Share2 size={16} /></button>
                        <button onClick={() => setEditingVenta(venta)} title="Editar" className="p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all cursor-pointer"><Edit3 size={16} /></button>
                        {venta.pago === "pendiente" && <button onClick={() => markAsPaid(venta.id)} title="Confirmar" className="p-2 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-lg transition-all cursor-pointer"><Check size={16} /></button>}
                        <button onClick={() => removeVenta(venta.id)} title="Borrar" className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all cursor-pointer"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 py-12 border-t border-zinc-50 bg-zinc-50/10">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="p-4 bg-white border border-zinc-100 rounded-2xl text-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-10 h-10 rounded-xl font-black text-[10px] transition-all cursor-pointer",
                  currentPage === page ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" : "bg-white text-zinc-400 border border-zinc-100 hover:border-zinc-900 hover:text-zinc-900"
                )}
              >
                {page}
              </button>
            ))}
          </div>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="p-4 bg-white border border-zinc-100 rounded-2xl text-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {editingVenta && <EditVentaModal venta={editingVenta} onClose={() => setEditingVenta(null)} />}
    </div>
  );
}
