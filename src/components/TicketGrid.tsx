"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Venta } from "@/types";

interface TicketGridProps {
  total: number;
  ventas: Venta[];
  onSelectTicket: (numero: number) => void;
  cifrasJuego?: number;
}

export default function TicketGrid({ total, ventas, onSelectTicket, cifrasJuego = 3 }: TicketGridProps) {
  const getTicketStatus = (numero: number) => {
    const venta = ventas.find((v) => 
      v.numero === numero || 
      (v["numeros boletas"] && Array.isArray(v["numeros boletas"]) && v["numeros boletas"].includes(numero))
    );
    if (!venta) return "disponible";
    
    if (venta.tipo === "fisica") return "fisica";
    return venta.pago === "pagado" ? "pagado" : "pendiente";
  };

  const formatNumber = (num: number) => {
    return String(num).padStart(cifrasJuego, '0');
  };

  return (
    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 gap-2 md:gap-3 mb-12">
      {/* El rango es de 0 hasta total-1 (ej: 000 a 999) */}
      {Array.from({ length: total }, (_, i) => i).map((numero) => {
        const status = getTicketStatus(numero);
        return (
          <button
            key={numero}
            onClick={() => status === "disponible" && onSelectTicket(numero)}
            disabled={status !== "disponible"}
            className={cn(
              "aspect-square flex flex-col items-center justify-center rounded-xl md:rounded-2xl transition-all duration-300 border relative group overflow-hidden",
              status === "disponible" && "bg-gray-50 border-zinc-200 hover:border-zinc-900 cursor-pointer shadow-sm active:scale-95",
              status === "pendiente" && "bg-amber-400 border-amber-300 text-white cursor-not-allowed opacity-90",
              status === "pagado" && "bg-zinc-900 border-zinc-900 text-white cursor-not-allowed shadow-inner",
              status === "fisica" && "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed"
            )}
          >
            <span className={cn(
              "text-xs md:text-sm font-black leading-none tracking-tighter",
              status === "disponible" ? "text-gray-900" : "text-current"
            )}>
              {formatNumber(numero)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
