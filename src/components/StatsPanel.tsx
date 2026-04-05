import React from "react";
import { formatCurrency } from "@/lib/utils";
import { Ticket, DollarSign, Target, CheckCircle } from "lucide-react";

interface StatsPanelProps {
  total: number;
  vendidas: number;
  recaudado: number;
  meta: number;
}

export default function StatsPanel({ total, vendidas, recaudado, meta }: StatsPanelProps) {
  const disponibles = total - vendidas;
  const porcentaje = Math.min((recaudado / meta) * 100, 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
          <Ticket size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Boletas</p>
          <p className="text-2xl font-bold">{vendidas} / {total}</p>
          <p className="text-xs text-gray-400">{disponibles} disponibles</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
          <DollarSign size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Recaudado</p>
          <p className="text-2xl font-bold">{formatCurrency(recaudado)}</p>
          <p className="text-xs text-gray-400">Solo pagos confirmados</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
          <Target size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Meta</p>
          <p className="text-2xl font-bold">{formatCurrency(meta)}</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
        <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
          <CheckCircle size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Progreso</p>
          <p className="text-2xl font-bold">{porcentaje.toFixed(1)}%</p>
          <p className="text-xs text-gray-400">hacia el objetivo</p>
        </div>
      </div>
    </div>
  );
}
