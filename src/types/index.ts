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
  numero: number;
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
  boletas: number[];
  creadoEn: Timestamp;
}

export interface Ganador {
  numero: number;
  nombre: string;
  numeroLoteria?: string; // Número completo de la lotería (4 cifras)
}
