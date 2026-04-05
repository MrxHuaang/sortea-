"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Sheet, Config } from "@/types";
import { use } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { Printer, ChevronLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

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
  const sortedTickets = [...hoja.boletas].sort((a, b) => a - b);
  const chunks: number[][] = [];
  
  for (let i = 0; i < sortedTickets.length; i += itemsPerPage) {
    chunks.push(sortedTickets.slice(i, i + itemsPerPage));
  }

  return (
    <div className="min-h-screen bg-zinc-100 transition-colors print:bg-white p-0 sm:p-12">
      {/* Panel de Control (No se imprime) */}
      <div className="max-w-5xl mx-auto flex items-center justify-between mb-8 px-6 sm:px-0 print:hidden">
        <Link href="/admin" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">
          <ChevronLeft size={14} /> Volver al Panel
        </Link>
        <div className="flex items-center gap-4">
          <p className="text-[10px] font-bold text-zinc-400 italic">Optimizado: 20 boletas por página Carta</p>
          <button onClick={() => window.print()} className="bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all active:scale-95 flex items-center gap-3">
            <Printer size={18} /> Imprimir
          </button>
        </div>
      </div>

      {/* Área de Impresión */}
      <div className="mx-auto print:m-0 flex flex-col items-center">
        {chunks.map((pageTickets, index) => {
          const isLast = index === chunks.length - 1;
          return (
            <div 
              key={index} 
              className={cn(
                "bg-white text-black overflow-hidden relative shadow-2xl print:shadow-none",
                !isLast && "print:page-break"
              )} 
              style={{ 
                width: '215.9mm', 
                height: '279mm', // Altura carta con margen de seguridad
                padding: '10mm',
                boxSizing: 'border-box',
                backgroundColor: 'white'
              }}
            >
              
              {/* Header Compacto (Altura ~12mm) */}
              <header className="flex justify-between items-center mb-4 border-b-2 border-black pb-2" style={{ height: '12mm' }}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-black rounded flex items-center justify-center">
                    <span className="text-white font-black text-sm italic">S</span>
                  </div>
                  <div>
                    <h1 className="text-sm font-black uppercase tracking-tighter leading-none italic">{config.premio}</h1>
                    <p className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-400">Premium System Oficial</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black uppercase">Hoja de {hoja.nombre}</p>
                  <p className="text-[8px] font-bold opacity-70">{formatCurrency(config.precioBoleta)} • {config.nequiNumero}</p>
                </div>
              </header>

              {/* Grid de Boletas (2 columnas x 10 filas) */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {pageTickets.map((num) => (
                  <div key={num} className="flex border border-black rounded overflow-hidden shadow-sm" style={{ height: '23mm' }}>
                    {/* Número (30%) */}
                    <div className="w-[30%] bg-zinc-900 flex flex-col items-center justify-center text-white border-r border-black relative">
                      <span className="text-[6px] font-black uppercase tracking-widest opacity-30 absolute top-1">No.</span>
                      <span className="text-xl font-black italic">{String(num).padStart(3, '0')}</span>
                      <ShieldCheck size={8} className="opacity-20 absolute bottom-1" />
                    </div>
                    
                    {/* Datos (70%) */}
                    <div className="w-[70%] p-1.5 flex flex-col justify-center space-y-1.5">
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

              {/* Footer Compacto (Altura ~8mm) */}
              <footer className="absolute bottom-[10mm] left-[10mm] right-[10mm] border-t border-zinc-100 flex justify-between items-center opacity-30" style={{ height: '8mm' }}>
                <p className="text-[6px] font-black uppercase tracking-[0.2em]">Página {index + 1} de {chunks.length} • Control Interno</p>
                <p className="text-[6px] font-bold uppercase tracking-widest italic">Sortea Certified</p>
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
