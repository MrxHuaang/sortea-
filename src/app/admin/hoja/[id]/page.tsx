"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where,
  writeBatch, 
  serverTimestamp, 
  arrayRemove
} from "firebase/firestore";
import { Sheet, Config, Venta } from "@/types";
import { use } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  Printer, 
  ChevronLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2,
  Check,
  Ticket,
  Zap,
  Unlock,
  XCircle,
  Search,
  User
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function SheetManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [hoja, setHoja] = useState<Sheet | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [ventasRelacionadas, setVentasRelacionadas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Escuchamos el documento de la hoja
    const unsubHoja = onSnapshot(doc(db, "hojas", id), (docSnap) => {
      if (docSnap.exists()) {
        setHoja({ id: docSnap.id, ...docSnap.data() } as Sheet);
      }
    });

    const unsubConfig = onSnapshot(doc(db, "config", "actual"), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as Config);
      }
    });

    // SOLUCIÓN AL BUG: Escuchamos las ventas relacionadas por hojaId en tiempo real.
    // Al filtrar por hojaId, garantizamos que cualquier cambio (creación o eliminación)
    // en la colección 'ventas' se refleje inmediatamente en esta vista.
    const q = query(collection(db, "ventas"), where("hojaId", "==", id));
    const unsubVentas = onSnapshot(q, (snapshot) => {
      const vData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Venta));
      setVentasRelacionadas(vData);
      setLoading(false);
    });

    return () => {
      unsubHoja();
      unsubConfig();
      unsubVentas();
    };
  }, [id]);

  if (loading || !hoja || !config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
      </div>
    );
  }

  const allNumbers = hoja["numeros boletas"] || hoja.numeros || hoja.boletas || [];
  
  /**
   * ESTADO REAL DESDE VENTAS:
   * El estado de cada boleta se determina exclusivamente por su presencia en la colección 'ventas'.
   * Si no existe un registro en 'ventas', la boleta vuelve a su estado natural de "física" (en calle).
   */
  const getStatus = (num: number) => {
    const venta = ventasRelacionadas.find(v => 
      (v["numeros boletas"] || []).includes(num) || v.numero === num
    );
    
    // Si no hay venta vinculada, por defecto es física (en calle/disponible para venta)
    if (!venta) return "fisica";
    
    if (venta.tipo === "fisica") return "fisica";
    if (venta.pago === "pagado") return "pagada";
    return "pendiente";
  };

  const toggleSelection = (num: number) => {
    if (getStatus(num) !== "fisica") return;
    setSelectedNumbers(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const processSaleAction = async (numbers: number[], isBatch: boolean = false) => {
    const validNumbers = numbers.filter(n => getStatus(n) === "fisica");
    if (validNumbers.length === 0) {
      if (!isBatch) alert("Error: Estas boletas ya no están disponibles para venta física.");
      return;
    }

    if (isBatch) setBatchLoading(true);
    try {
      const batch = writeBatch(db);
      
      // Actualizamos el contenedor físico (pago pendiente) quitando los números que se van a marcar como pagados
      const contenedor = ventasRelacionadas.find(v => 
        v.tipo === "fisica" && (v["numeros boletas"] || []).some(n => validNumbers.includes(n))
      );
      
      if (contenedor) {
        batch.update(doc(db, "ventas", contenedor.id), {
          "numeros boletas": arrayRemove(...validNumbers)
        });
      }

      // Creamos el registro de venta final (pago confirmado)
      const nuevaVentaRef = doc(collection(db, "ventas"));
      batch.set(nuevaVentaRef, {
        nombre: `Venta Física: ${hoja.nombre}`,
        contacto: "Confirmado por Admin",
        "numeros boletas": validNumbers,
        pago: "pagado",
        tipo: "admin",
        hojaId: id,
        creadoEn: serverTimestamp()
      });

      await batch.commit();
      if (isBatch) setSelectedNumbers([]);
    } catch (error) {
      console.error("Error en transacción:", error);
      alert("Error crítico al guardar. Inténtalo de nuevo.");
    } finally {
      if (isBatch) setBatchLoading(false);
      setActionLoading(null);
    }
  };

  const releaseAction = async (numbers: number[], isBatch: boolean = false) => {
    const validNumbers = numbers.filter(n => getStatus(n) === "fisica" || getStatus(n) === "pagada");
    if (validNumbers.length === 0) return;

    if (isBatch) setBatchLoading(true);
    try {
      const batch = writeBatch(db);
      
      // Quitar de la hoja maestra
      batch.update(doc(db, "hojas", id), {
        "numeros boletas": arrayRemove(...validNumbers)
      });

      // Limpiar de cualquier registro de venta asociado
      ventasRelacionadas.forEach(v => {
        const intersection = (v["numeros boletas"] || []).filter(n => validNumbers.includes(n));
        if (intersection.length > 0) {
          const remaining = (v["numeros boletas"] || []).filter(n => !validNumbers.includes(n));
          if (remaining.length === 0) {
            batch.delete(doc(db, "ventas", v.id));
          } else {
            batch.update(doc(db, "ventas", v.id), { "numeros boletas": remaining });
          }
        }
      });

      await batch.commit();
      if (isBatch) setSelectedNumbers([]);
    } catch (error) {
      console.error(error);
      alert("Error al liberar boletas.");
    } finally {
      if (isBatch) setBatchLoading(false);
      setActionLoading(null);
    }
  };

  const finalizeSheetAction = async () => {
    const fisicas = allNumbers.filter(n => getStatus(n) === "fisica");
    const noSeleccionadas = fisicas.filter(n => !selectedNumbers.includes(n));
    
    if (!confirm(`ACCION FINAL:\n- Confirmar ${selectedNumbers.length} como VENDIDAS.\n- LIBERAR ${noSeleccionadas.length} restantes.\n\nEsta hoja quedará limpia. ¿Proceder?`)) return;
    
    setBatchLoading(true);
    try {
      const batch = writeBatch(db);
      
      if (selectedNumbers.length > 0) {
        const nuevaVentaRef = doc(collection(db, "ventas"));
        batch.set(nuevaVentaRef, {
          nombre: `Cierre Hoja: ${hoja.nombre}`,
          contacto: "Admin",
          "numeros boletas": selectedNumbers,
          pago: "pagado",
          tipo: "admin",
          hojaId: id,
          creadoEn: serverTimestamp()
        });
      }

      ventasRelacionadas.forEach(v => {
        const intersection = (v["numeros boletas"] || []).filter(n => fisicas.includes(n));
        if (intersection.length > 0) {
          const remaining = (v["numeros boletas"] || []).filter(n => !fisicas.includes(n));
          if (remaining.length === 0) batch.delete(doc(db, "ventas", v.id));
          else batch.update(doc(db, "ventas", v.id), { "numeros boletas": remaining });
        }
      });

      if (noSeleccionadas.length > 0) {
        batch.update(doc(db, "hojas", id), { "numeros boletas": arrayRemove(...noSeleccionadas) });
      }
      
      await batch.commit();
      setSelectedNumbers([]);
    } catch (error) {
      console.error(error);
      alert("Error al finalizar hoja.");
    } finally {
      setBatchLoading(false);
    }
  };

  const vendidasCount = allNumbers.filter(n => getStatus(n) === "pagada").length;
  const pendientesCount = allNumbers.filter(n => getStatus(n) === "fisica").length;

  const filteredNumbers = allNumbers
    .sort((a, b) => a - b)
    .filter(n => n.toString().includes(searchTerm));

  const chunks: number[][] = [];
  for (let i = 0; i < allNumbers.length; i += 20) {
    chunks.push(allNumbers.slice(i, i + 20));
  }

  return (
    <div className="min-h-screen bg-white p-6 md:p-12 lg:p-16 pb-64">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
          <div className="space-y-4">
            <Link href="/admin" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all cursor-pointer">
              <ChevronLeft size={14} /> Panel Administrativo
            </Link>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tighter uppercase italic leading-none">{hoja.nombre}</h1>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-black uppercase text-zinc-500">
                <User size={12} /> Responsable: Familia
              </div>
            </div>
          </div>
          <button onClick={() => window.print()} className="bg-zinc-900 text-white px-6 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2 cursor-pointer active:scale-95">
            <Printer size={16} /> Imprimir Hoja
          </button>
        </header>

        {/* Buscador y Stats */}
        <div className="flex flex-col md:flex-row gap-6 print:hidden">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar número en la hoja..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-[2rem] py-6 pl-16 pr-8 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
            />
          </div>
          <div className="flex gap-4">
            <div className="bg-emerald-50 px-8 py-6 rounded-[2rem] border border-emerald-100 text-center">
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Pagadas</p>
              <p className="text-2xl font-black text-emerald-700 leading-none">{vendidasCount}</p>
            </div>
            <div className="bg-amber-50 px-8 py-6 rounded-[2rem] border border-amber-100 text-center">
              <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">En calle</p>
              <p className="text-2xl font-black text-amber-700 leading-none">{pendientesCount}</p>
            </div>
          </div>
        </div>

        {/* Grid de Boletas */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 print:hidden">
          {filteredNumbers.map((num) => {
            const status = getStatus(num);
            const isSelected = selectedNumbers.includes(num);
            const isActing = actionLoading === num;
            
            return (
              <div key={num} className="relative group h-20">
                <div 
                  onClick={() => toggleSelection(num)}
                  className={cn(
                    "w-full h-full rounded-[1.5rem] border-2 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden",
                    status === "fisica" ? "bg-white border-zinc-100 hover:border-zinc-300" : "bg-zinc-50 border-transparent cursor-default opacity-60",
                    isSelected && "bg-zinc-900 border-zinc-900 text-white shadow-xl scale-95",
                    status === "pagada" && "bg-emerald-500 border-emerald-500 text-white opacity-100"
                  )}
                >
                  <span className="text-xl font-black italic tracking-tighter leading-none">
                    {num.toString().padStart(config.cifrasJuego || 3, '0')}
                  </span>
                  {status === "fisica" && !isSelected && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2" />}
                  {status === "pagada" && <Check size={14} className="mt-1 opacity-50" />}
                </div>

                {status === "fisica" && !isSelected && !isActing && (
                  <div className="absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1 rounded-[1.5rem] z-10 p-2 shadow-xl border border-zinc-100">
                    <button onClick={(e) => { e.stopPropagation(); setActionLoading(num); processSaleAction([num]); }} className="flex-1 h-full bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 cursor-pointer transition-colors active:scale-95"><Check size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setActionLoading(num); releaseAction([num]); }} className="flex-1 h-full bg-zinc-100 text-zinc-500 rounded-xl flex items-center justify-center hover:bg-zinc-200 cursor-pointer transition-colors active:scale-95"><XCircle size={16} /></button>
                  </div>
                )}
                
                {isActing && (
                  <div className="absolute inset-0 bg-white/80 rounded-[1.5rem] flex items-center justify-center z-10">
                    <Loader2 size={20} className="animate-spin text-zinc-900" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Barra de Acciones Flotante */}
        {selectedNumbers.length > 0 && (
          <div className="fixed bottom-8 left-0 right-0 z-[100] px-4 animate-in slide-in-from-bottom-10 duration-500">
            <div className="max-w-4xl mx-auto bg-zinc-900 text-white p-6 md:p-8 rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.5)] border border-white/10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                    <Ticket className="text-white" size={28} />
                  </div>
                  <div>
                    <p className="text-2xl font-black italic leading-none">{selectedNumbers.length} Marcadas</p>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1">Total: {formatCurrency(selectedNumbers.length * config.precioBoleta)}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
                  <button onClick={() => processSaleAction(selectedNumbers, true)} disabled={batchLoading} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer active:scale-95 flex items-center gap-2">
                    {batchLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Vender
                  </button>
                  <button onClick={() => releaseAction(selectedNumbers, true)} disabled={batchLoading} className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer active:scale-95">
                    Liberar
                  </button>
                  <button onClick={() => setSelectedNumbers([])} className="text-[10px] font-black uppercase text-zinc-500 px-4 hover:text-white transition-colors cursor-pointer">
                    Cancelar
                  </button>
                  <button onClick={finalizeSheetAction} disabled={batchLoading} className="bg-white text-zinc-900 hover:bg-zinc-100 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95">
                    <Zap size={14} fill="currentColor" /> Cerrar Hoja
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Área de Impresión (Contraste Máximo y Precisión Carta) */}
        <div className="hidden print:block mx-auto print:m-0">
          {chunks.map((pageTickets, index) => (
            <div key={index} className={cn("bg-white text-black overflow-hidden relative flex flex-col", index < chunks.length - 1 && "print:page-break")} style={{ width: '215.9mm', height: '279.4mm', padding: '10mm 12mm', boxSizing: 'border-box', backgroundColor: 'white' }}>
              <header className="flex justify-between items-center mb-2 border-b-4 border-black pb-2" style={{ height: '16mm' }}>
                <div className="flex items-center gap-3 w-1/3">
                  <Image src="/logo.png" alt="Logo" width={32} height={28} className="object-contain" />
                  <div>
                    <h1 className="text-[11px] font-black uppercase tracking-tighter leading-none italic">{config.premio}</h1>
                    <p className="text-[6px] font-black uppercase tracking-[0.2em] text-black/60">Premium System</p>
                  </div>
                </div>
                <div className="w-1/3 text-center border-x-2 border-black px-2 flex flex-col justify-center">
                  <p className="text-[8px] font-black italic text-black leading-tight uppercase">Juega con la {config.loteria}</p>
                </div>
                <div className="text-right w-1/3 flex flex-col justify-center">
                  <p className="text-[10px] font-black uppercase leading-none">{hoja.nombre}</p>
                  <p className="text-[9px] font-bold text-black mt-1">{formatCurrency(config.precioBoleta)} • {config.nequiNumero || 'Nequi'}</p>
                </div>
              </header>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {pageTickets.map((num) => (
                  <div key={num} className="flex border-2 border-black rounded-xl overflow-hidden shadow-sm" style={{ height: '19.5mm' }}>
                    <div className="w-[30%] bg-zinc-900 flex flex-col items-center justify-center text-white border-r-2 border-black relative">
                      <span className="text-[7px] font-black uppercase tracking-widest absolute top-1">No.</span>
                      <span className="text-2xl font-black italic tracking-tighter">{String(num).padStart(config.cifrasJuego || 3, '0')}</span>
                      <ShieldCheck size={10} className="opacity-50 absolute bottom-1" />
                    </div>
                    <div className="w-[70%] p-2 flex flex-col justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase text-black leading-none">Comprador:</span>
                        <div className="h-[1px] w-full bg-black mt-2"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase text-black leading-none">Ciudad:</span>
                          <div className="h-[1px] w-full bg-black mt-2"></div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase text-black leading-none">Celular:</span>
                          <div className="h-[1px] w-full bg-black mt-2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-4 border-t-4 border-black grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <h4 className="text-[9px] font-black uppercase tracking-widest border-b border-black inline-block">Propósito de la Iniciativa</h4>
                  <p className="text-[8px] font-bold text-black leading-tight italic">
                    &quot;Tu participación contribuye al cumplimiento de metas académicas en Ingeniería y al desarrollo de este proyecto profesional. ¡Gracias por tu apoyo!&quot;
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-[9px] font-black uppercase tracking-widest border-b border-black inline-block">Aviso Informativo</h4>
                  <p className="text-[8px] font-bold text-black leading-tight">
                    &quot;Al completarse la venta total de la boletería, se procederá a fijar la fecha definitiva del sorteo, la cual se regirá por los resultados de la Lotería de Bogotá.&quot;
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: letter portrait; margin: 0 !important; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .min-h-screen { background: white !important; padding: 0 !important; }
          .print\:page-break { display: block !important; page-break-after: always !important; break-after: page !important; }
        }
      `}</style>
    </div>
  );
}
