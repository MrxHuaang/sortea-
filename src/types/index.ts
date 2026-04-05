import { Timestamp } from "firebase/firestore";

export interface Config {
  totalBoletas: number;
  precioBoleta: number;
  premio: string;
  meta: number;
  fechaSorteo?: string; // Nuevo campo
  ganador?: Ganador | null;
}

export interface Venta {
  id: string;
  numero: number;
  nombre: string;
  contacto: string;
  pago: "pagado" | "pendiente";
  creadoEn: Timestamp;
}

export interface Ganador {
  numero: number;
  nombre: string;
}
