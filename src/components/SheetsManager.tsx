"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, writeBatch, doc, serverTimestamp, getDocs, where } from "firebase/firestore";
import { Sheet, Venta } from "@/types";
import { 
  FileText, 
  Plus, 
  Trash2, 
  Printer, 
  Loader2, 
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SheetsManagerProps {
  totalBoletas: number;
  ventas: Venta[];
}

export default function SheetsManager({ totalBoletas, ventas }: SheetsManagerProps) {
  const [hojas, setHojas] = useState<Sheet[]>([]);
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearch] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
      const q = query(collection(db, "ventas"));
      const snapshot = await getDocs(q);
      const ventasData = snapshot.docs.map(d => d.data());
      
      const numerosVendidos = new Set<number>();
      ventasData.forEach((v: any) => {
        if (v.numero !== undefined) numerosVendidos.add(v.numero);
        if (v["numeros boletas"] && Array.isArray(v["numeros boletas"])) {
          v["numeros boletas"].forEach((n: number) => numerosVendidos.add(n));
        }
      });

      const numerosDisponibles = Array.from({ length: totalBoletas }, (_, i) => i)
        .filter(n => !numerosVendidos.has(n));

      if (numerosDisponibles.length < cantidad) {
        alert(`Solo quedan ${numerosDisponibles.length} números disponibles.`);
        setLoading(false);
        return;
      }

      const seleccionados: number[] = [];
      for (let i = 0; i < cantidad; i++) {
        const randomIndex = Math.floor(Math.random() * numerosDisponibles.length);
        seleccionados.push(numerosDisponibles.splice(randomIndex, 1)[0]);
      }

      const batch = writeBatch(db);
      const sheetRef = doc(collection(db, "hojas"));
      
      // GUARDAR CON EL NOMBRE CORRECTO: "numeros boletas"
      batch.set(sheetRef, {
        nombre,
        "numeros boletas": seleccionados,
        creadoEn: serverTimestamp()
      });

      // Registrar también en la colección ventas para que aparezcan como ocupadas
      const ventaRef = doc(collection(db, "ventas"));
      batch.set(ventaRef, {
        "numeros boletas": seleccionados,
        nombre: `Hoja: ${nombre}`,
        contacto: "Venta Física",
        pago: "pagado",
        tipo: "fisica",
        creadoEn: serverTimestamp()
      });

      await batch.commit();
      setNombre("");
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
      alert("Error al generar la hoja");
    } finally {
      setLoading(false);
    }
  };

  const eliminarHoja = async (id: string, sheet: Sheet) => {
    if (!confirm("¿Eliminar esta hoja? Los números volverán a estar disponibles.")) return;

    const numeros = sheet["numeros boletas"] || sheet.numeros || sheet.boletas || [];

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "hojas", id));

      // Buscar y eliminar el registro de venta asociado
      const q = query(collection(db, "ventas"), where("nombre", "==", `Hoja: ${sheet.nombre}`));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(d => {
        // Verificar que coincidan los números para mayor seguridad
        const vNums = d.data()["numeros boletas"] || [];
        if (JSON.stringify(vNums.sort()) === JSON.stringify(numeros.sort())) {
          batch.delete(d.ref);
        }
      });

      await batch.commit();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar la hoja");
    }
  };

  const filteredHojas = hojas.filter(h => 
    h.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Lógica de Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHojas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHojas.length / itemsPerPage);

  // Helper para obtener los números sin importar el nombre del campo
  const getNumbers = (hoja: Sheet) => {
    return hoja["numeros boletas"] || hoja.numeros || hoja.boletas || [];
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-[1px] w-6 bg-zinc-900"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Distribución Física</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-zinc-900 tracking-tighter uppercase leading-none italic">Hojas</h2>
        </div>
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-zinc-900 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por vendedor..."
            value={searchTerm}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 pl-14 pr-8 py-4 rounded-2xl border-2 border-transparent focus:border-zinc-900 focus:bg-white outline-none transition-all font-bold text-sm"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Formulario */}
        <div className="lg:col-span-1">
          <form onSubmit={generarHoja} className="bg-zinc-50 p-10 rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-100/50 space-y-8 transition-colors">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Nueva Asignación</h3>
              <p className="text-xs font-medium text-zinc-400">Genera un bloque de números al azar para vender en físico.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Nombre del Vendedor</label>
                <input 
                  type="text" 
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-white p-5 rounded-2xl border-2 border-transparent focus:border-zinc-900 outline-none transition-all font-bold"
                  placeholder="Ej: Tío Alberto"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Cantidad de Boletas</label>
                <input 
                  type="number" 
                  min={1}
                  max={totalBoletas}
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-white p-5 rounded-2xl border-2 border-transparent focus:border-zinc-900 outline-none transition-all font-bold"
                  placeholder="Ej: 20"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-zinc-900/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  <Plus size={18} />
                  Generar Hoja
                </>
              )}
            </button>
          </form>
        </div>

        {/* Lista de Hojas */}
        <div className="lg:col-span-2 space-y-6">
          {hojas.length === 0 ? (
            <div className="bg-zinc-50 border-2 border-dashed border-zinc-100 rounded-[3rem] p-20 text-center space-y-4">
              <FileText className="mx-auto text-zinc-200" size={48} />
              <p className="text-zinc-400 text-xs font-black uppercase tracking-widest leading-loose">No hay hojas físicas generadas aún.</p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {currentItems.map((hoja) => {
                  const numeros = getNumbers(hoja);
                  return (
                    <div key={hoja.id} className="group bg-white border border-zinc-100 p-8 rounded-[2.5rem] hover:shadow-2xl hover:shadow-zinc-100 transition-all">
                      <div className="flex items-start justify-between gap-6 mb-8">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-zinc-900/10">
                            <FileText size={24} />
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-zinc-900 uppercase italic">{hoja.nombre}</h4>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">{numeros.length} Boletas Asignadas</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/admin/hoja/${hoja.id}`}
                            target="_blank"
                            className="p-4 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-2xl transition-all cursor-pointer"
                          >
                            <Printer size={20} />
                          </Link>
                          <button 
                            onClick={() => eliminarHoja(hoja.id, hoja)}
                            className="p-4 text-zinc-500 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all cursor-pointer"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {numeros.map((num) => (
                          <div key={num} className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-[10px] font-black text-zinc-600 border border-zinc-100 group-hover:border-zinc-200 group-hover:bg-white transition-all">
                            {num.toString().padStart(3, "0")}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Controles de Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-6 pt-8 pb-12">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="p-4 bg-zinc-50 rounded-2xl text-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                          currentPage === page ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" : "text-zinc-400 hover:text-zinc-900"
                        )}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="p-4 bg-zinc-50 rounded-2xl text-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
