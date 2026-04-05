"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Venta } from "@/types";

interface TicketGridProps {
  total: number;
  ventas: Venta[];
  onSelectTicket: (numero: number) => void;
}

export default function TicketGrid({ total, ventas, onSelectTicket }: TicketGridProps) {
  const getTicketStatus = (numero: number) => {
    const venta = ventas.find((v) => v.numero === numero);
    if (!venta) return "disponible";
    return venta.pago === "pagado" ? "pagado" : "pendiente";
  };

  return (
    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-15 xl:grid-cols-20 gap-1.5 mb-12">
      {Array.from({ length: total }, (_, i) => i + 1).map((numero) => {
        const status = getTicketStatus(numero);
        return (
          <button
            key={numero}
            onClick={() => status === "disponible" && onSelectTicket(numero)}
            disabled={status !== "disponible"}
            className={cn(
              "aspect-square flex flex-col items-center justify-center rounded-lg transition-all duration-200 border relative group overflow-hidden",
              status === "disponible" && "bg-white border-zinc-200 hover:border-zinc-900 cursor-pointer shadow-sm active:scale-95",
              status === "pendiente" && "bg-amber-400 border-amber-300 text-white cursor-not-allowed opacity-90",
              status === "pagado" && "bg-emerald-500 border-emerald-400 text-white cursor-not-allowed shadow-inner"
            )}
          >
            <span className={cn(
              "text-xs font-bold leading-none tracking-tight",
              status === "disponible" ? "text-zinc-500 group-hover:text-zinc-900" : "text-white"
            )}>
              {numero.toString().padStart(2, "0")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
