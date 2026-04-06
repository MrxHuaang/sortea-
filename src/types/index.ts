import { Timestamp } from "firebase/firestore";

export interface Config {
  totalBoletas: number;
  precioBoleta: number;
  premio: string;
  meta: number;
  fechaSorteo?: string;
  ganador?: Ganador | null;
  nequiNumero?: string;
  nequiNombre?: string;
  nequiQR?: string;
  loteria?: string;
  cifrasJuego?: number; // 2 o 3
}

export type TicketStatus = "disponible" | "fisica" | "reservada" | "pendiente" | "pagada";

export interface Venta {
  id: string;
  numero?: number; // Para boletas antiguas individuales
  "numeros boletas"?: number[]; // Para boletas nuevas en bloque
  nombre: string;
  contacto: string;
  pago: "pagado" | "pendiente";
  tipo: "fisica" | "online" | "admin";
  hojaId?: string;
  creadoEn: Timestamp;
}

export interface Sheet {
  id: string;
  nombre: string;
  "numeros boletas"?: number[];
  numeros?: number[]; // Por si hay alguna con el nombre anterior
  boletas?: number[]; // Por compatibilidad
  creadoEn: Timestamp;
}

export interface Ganador {
  numero: number;
  nombre: string;
  numeroLoteria?: string; // Número completo de la lotería (4 cifras)
}
