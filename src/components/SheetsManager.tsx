"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, writeBatch, doc, serverTimestamp, getDocs, where } from "firebase/firestore";
import { Sheet, Venta } from "@/types";
import { FilePlus2, Printer, Trash2, User, Hash, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SheetsManagerProps {
  totalBoletas: number;
  ventas: Venta[];
}

export default function SheetsManager({ totalBoletas, ventas }: SheetsManagerProps) {
  const [hojas, setHojas] = useState<Sheet[]>([]);
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "hojas"), orderBy("creadoEn", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setHojas(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Sheet)));
    });
    return unsub;
  }, []);

  const generarHoja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || cantidad <= 0) return;
    setLoading(true);

    try {
      const ocupados = new Set(ventas.map(v => v.numero));
      const disponibles: number[] = [];
      for (let i = 1; i <= totalBoletas; i++) {
        if (!ocupados.has(i)) disponibles.push(i);
      }

      if (disponibles.length < cantidad) {
        alert(`Solo quedan ${disponibles.length} boletas disponibles.`);
        setLoading(false);
        return;
      }

      const seleccionadas: number[] = [];
      const disponiblesCopy = [...disponibles];
      for (let i = 0; i < cantidad; i++) {
        const randomIndex = Math.floor(Math.random() * disponiblesCopy.length);
        seleccionadas.push(disponiblesCopy.splice(randomIndex, 1)[0]);
      }

      const batch = writeBatch(db);
      
      const hojaRef = await addDoc(collection(db, "hojas"), {
        nombre,
        boletas: seleccionadas,
        creadoEn: serverTimestamp()
      });

      seleccionadas.forEach(num => {
        const ventaRef = doc(collection(db, "ventas"));
        batch.set(ventaRef, {
          numero: num,
          nombre: `Hoja: ${nombre}`,
          contacto: "Físico",
          pago: "pendiente",
          tipo: "fisica",
          hojaId: hojaRef.id,
          creadoEn: serverTimestamp()
        });
      });

      await batch.commit();
      setNombre("");
      setCantidad(10);
    } catch (error) {
      console.error("Error al generar hoja:", error);
      alert("Error al generar la hoja física");
    } finally {
      setLoading(false);
    }
  };

  const eliminarHoja = async (hoja: Sheet) => {
    if (!confirm(`¿Estás seguro de eliminar la hoja de "${hoja.nombre}"? Las boletas se liberarán.`)) return;
    
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "hojas", hoja.id));
      const q = query(collection(db, "ventas"), where("hojaId", "==", hoja.id));
      const snapshot = await getDocs(q);
      snapshot.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (error) {
      console.error("Error al eliminar hoja:", error);
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-[1px] w-6 bg-zinc-900"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Distribución Física</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Hojas de Venta</h2>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1">
          <form onSubmit={generarHoja} className="bg-zinc-50 p-10 rounded-[2.5rem] border border-zinc-100 space-y-8 sticky top-8 transition-colors">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Nueva Asignación</h3>
              <p className="text-xs font-medium text-zinc-400">Genera un bloque de números al azar para vender en físico.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-2">Responsable</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Tía Martha"
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-zinc-200 outline-none focus:border-zinc-900 transition-all font-bold text-sm text-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-2">Cantidad de Boletas</label>
                <div className="relative">
                  <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                  <input
                    type="number"
                    required
                    min={1}
                    max={totalBoletas}
                    value={cantidad || ""}
                    onChange={(e) => setCantidad(e.target.value === "" ? 0 : parseInt(e.target.value))}
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-zinc-200 outline-none focus:border-zinc-900 transition-all font-bold text-sm text-zinc-900"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl shadow-zinc-200 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <FilePlus2 size={20} />
                  GENERAR BLOQUE
                </>
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {hojas.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-zinc-100 rounded-[3rem] p-24 text-center transition-colors">
              <Info className="mx-auto text-zinc-200 mb-6" size={48} />
              <p className="text-zinc-400 font-black uppercase tracking-widest text-xs">No hay hojas generadas aún</p>
            </div>
          ) : (
            hojas.map((hoja) => {
              const ventasHoja = ventas.filter(v => v.hojaId === hoja.id);
              const pagadasCount = ventasHoja.filter(v => v.pago === "pagado").length;
              const progreso = (pagadasCount / hoja.boletas.length) * 100;

              return (
                <div key={hoja.id} className="group bg-white border border-zinc-100 p-8 md:p-10 rounded-[2.5rem] hover:shadow-2xl hover:shadow-zinc-100 transition-all duration-500">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Responsable</span>
                        <div className="h-px w-4 bg-zinc-100"></div>
                      </div>
                      <h4 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">{hoja.nombre}</h4>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/admin/hoja/${hoja.id}`}
                        target="_blank"
                        className="p-4 bg-zinc-50 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-2xl transition-all"
                      >
                        <Printer size={20} />
                      </Link>
                      <button
                        onClick={() => eliminarHoja(hoja)}
                        className="p-4 bg-zinc-50 text-zinc-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Total Boletas</p>
                      <p className="text-xl font-black text-zinc-900">{hoja.boletas.length}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Confirmadas</p>
                      <p className="text-xl font-black text-emerald-500">{pagadasCount}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Pendientes</p>
                      <p className="text-xl font-black text-amber-500">{hoja.boletas.length - pagadasCount}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Progreso</p>
                      <p className="text-xl font-black text-zinc-900">{progreso.toFixed(0)}%</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {hoja.boletas.sort((a,b) => a-b).map(num => {
                      const v = ventasHoja.find(vh => vh.numero === num);
                      return (
                        <div 
                          key={num}
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all",
                            v?.pago === "pagado" 
                              ? "bg-emerald-500 border-emerald-400 text-white" 
                              : "bg-zinc-50 border-zinc-100 text-zinc-400"
                          )}
                        >
                          {num.toString().padStart(2, "0")}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
