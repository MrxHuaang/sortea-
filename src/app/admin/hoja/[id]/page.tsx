"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Sheet, Config } from "@/types";
import { use } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { Printer, ChevronLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function SheetPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [hoja, setHoja] = useState<Sheet | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const hSnap = await getDoc(doc(db, "hojas", id));
      const cSnap = await getDoc(doc(db, "config", "actual"));
      
      if (hSnap.exists()) setHoja({ id: hSnap.id, ...hSnap.data() } as Sheet);
      if (cSnap.exists()) setConfig(cSnap.data() as Config);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading || !hoja || !config) return null;

  const itemsPerPage = 20;
  const sortedTickets = [...(hoja.boletas || hoja.numeros || hoja["numeros boletas"] || [])].sort((a, b) => a - b);
  const chunks: number[][] = [];
  
  for (let i = 0; i < sortedTickets.length; i += itemsPerPage) {
    chunks.push(sortedTickets.slice(i, i + itemsPerPage));
  }

  return (
    <div className="min-h-screen bg-zinc-100 transition-colors print:bg-white p-0 sm:p-12">
      {/* Panel de Control (No se imprime) */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between mb-8 px-6 sm:px-0 print:hidden gap-4">
        <Link href="/admin" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">
          <ChevronLeft size={14} /> Volver al Panel
        </Link>
        <button onClick={() => window.print()} className="bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all active:scale-95 flex items-center gap-3">
          <Printer size={18} /> Imprimir Hoja
        </button>
      </div>

      {/* Área de Impresión */}
      <div className="mx-auto print:m-0 flex flex-col items-center">
        {chunks.map((pageTickets, index) => {
          const isLast = index === chunks.length - 1;
          return (
            <div 
              key={index} 
              className={cn(
                "bg-white text-black overflow-hidden relative shadow-2xl print:shadow-none flex flex-col",
                !isLast && "print:page-break"
              )} 
              style={{ 
                width: '215.9mm', 
                height: '279mm', 
                padding: '10mm 12mm', 
                boxSizing: 'border-box',
                backgroundColor: 'white'
              }}
            >
              <div>
                {/* Header Triple Optimizado */}
                <header className="flex justify-between items-center mb-3 border-b-2 border-black pb-2" style={{ height: '15mm' }}>
                  {/* Logo y Nombre */}
                  <div className="flex items-center gap-2 w-1/3">
                    <Image src="/logo.png" alt="Logo" width={28} height={28} className="object-contain" />
                    <div>
                      <h1 className="text-[11px] font-black uppercase tracking-tighter leading-none italic">{config.premio}</h1>
                      <p className="text-[6px] font-black uppercase tracking-[0.2em] text-zinc-400">Premium System</p>
                    </div>
                  </div>

                  {/* Reglas y Aviso de Seguridad (Centro) */}
                  <div className="w-1/3 flex flex-col items-center border-x border-zinc-100 px-2 text-center">
                    <p className="text-[7px] font-medium leading-[1.1] italic text-zinc-600 mb-1">
                      Juega con la <span className="text-zinc-900 font-black">Lotería de Bogotá</span> (últimos 3 dígitos)
                    </p>
                    <span className="text-[6px] font-black uppercase tracking-widest text-zinc-400 border-t border-zinc-100 pt-1">
                      Conserva tu boleta para reclamar
                    </span>
                  </div>

                  {/* Datos Vendedor y Paginación */}
                  <div className="text-right w-1/3">
                    <div className="flex flex-col items-end">
                      <span className="text-[6px] font-black text-zinc-300 uppercase mb-0.5">Página {index + 1} de {chunks.length}</span>
                      <p className="text-[9px] font-black uppercase">{hoja.nombre}</p>
                      <p className="text-[8px] font-bold opacity-70">{formatCurrency(config.precioBoleta)} • {config.nequiNumero}</p>
                    </div>
                  </div>
                </header>

                {/* Grid de Boletas (2 columnas x 10 filas) */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {pageTickets.map((num) => (
                    <div key={num} className="flex border border-black rounded overflow-hidden shadow-sm" style={{ height: '21mm' }}>
                      {/* Número (30%) */}
                      <div className="w-[30%] bg-zinc-900 flex flex-col items-center justify-center text-white border-r border-black relative">
                        <span className="text-[6px] font-black uppercase tracking-widest opacity-30 absolute top-1">No.</span>
                        <span className="text-xl font-black italic">{String(num).padStart(3, '0')}</span>
                        <ShieldCheck size={8} className="opacity-20 absolute bottom-1" />
                      </div>
                      
                      {/* Datos (70%) */}
                      <div className="w-[70%] p-1.5 flex flex-col justify-center space-y-1">
                        <div className="flex flex-col">
                          <div className="flex justify-between items-end">
                            <span className="text-[7px] font-black uppercase text-zinc-400">Comprador</span>
                            <span className="text-[5px] font-bold text-zinc-200 uppercase">Original</span>
                          </div>
                          <div className="h-[8px] border-b-[0.5px] border-zinc-200"></div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[7px] font-black uppercase text-zinc-400">Ciudad</span>
                            <div className="h-[8px] border-b-[0.5px] border-zinc-200"></div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] font-black uppercase text-zinc-400">Celular</span>
                            <div className="h-[8px] border-b-[0.5px] border-zinc-200"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Informativo */}
              <footer className="mt-auto border-t border-zinc-200 pt-3 flex flex-col items-center opacity-90">
                <div className="flex flex-col items-center mb-3">
                  <p className="text-[7px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-1">Propósito de la Iniciativa</p>
                  <p className="text-[8px] font-medium italic text-center max-w-[85%] text-zinc-600 leading-tight">
                    &quot;Tu participación contribuye al cumplimiento de metas académicas en Ingeniería y al desarrollo de este proyecto profesional. ¡Gracias por tu apoyo!&quot;
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="text-[7px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-0.5">Aviso Informativo</p>
                  <p className="text-[9px] font-bold italic text-center max-w-[90%] text-zinc-900 leading-tight">
                    &quot;Al completarse la venta total de la boletería, se procederá a fijar la fecha definitiva del sorteo, la cual se regirá por los resultados de la Lotería de Bogotá.&quot;
                  </p>
                </div>
              </footer>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @media print {
          @page { 
            size: letter portrait; 
            margin: 0 !important; 
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .min-h-screen { 
            background: white !important; 
            padding: 0 !important;
            height: auto !important;
          }
          .print\:page-break { 
            display: block !important;
            page-break-after: always !important; 
            break-after: page !important;
            border: none !important; 
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
