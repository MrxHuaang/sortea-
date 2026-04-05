"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { Config, Venta } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import { Check, Loader2, ArrowRight, User, Phone, MapPin, MessageCircle, Clock, X, ChevronLeft, ShoppingCart, Copy, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function PurchasePage() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<Config | null>(null);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Paso 2: Datos
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [reserving, setReserving] = useState(false);
  
  // Paso 3: Pago & Confirmación
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isFinalConfirmation, setIsFinalConfirmation] = useState(false);

  useEffect(() => {
    // Recuperar boletas del Home
    const saved = sessionStorage.getItem("preSelectedTickets");
    if (saved) {
      const tickets = JSON.parse(saved);
      if (tickets.length > 0) {
        setSelectedNumbers(tickets);
        setStep(2); 
        sessionStorage.removeItem("preSelectedTickets");
      }
    }

    const unsubConfig = onSnapshot(doc(db, "config", "actual"), (docSnap) => {
      if (docSnap.exists()) setConfig(docSnap.data() as Config);
      setLoading(false);
    });

    const unsubVentas = onSnapshot(collection(db, "ventas"), (snapshot) => {
      setVentas(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Venta)));
    });

    return () => {
      unsubConfig();
      unsubVentas();
    };
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSelect = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(prev => prev.filter(n => n !== num));
    } else {
      setSelectedNumbers(prev => [...prev, num]);
    }
  };

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    setReserving(true);
    try {
      const batch = writeBatch(db);
      selectedNumbers.forEach(num => {
        const ventaRef = doc(collection(db, "ventas"));
        batch.set(ventaRef, {
          numero: num,
          nombre,
          contacto: `${celular} / ${ciudad}`,
          pago: "pendiente",
          tipo: "online",
          creadoEn: serverTimestamp()
        });
      });
      await batch.commit();
      setStep(3);
    } catch (error) {
      console.error("Error al reservar:", error);
      alert("Error al procesar tu solicitud.");
    } finally {
      setReserving(false);
    }
  };

  const handleApartarClick = () => {
    setIsFinalConfirmation(true);
  };

  const handleWhatsAppFinal = () => {
    const text = `Hola, acabo de apartar mis boletas y adjunto mi comprobante de pago 🎟️`;
    window.open(`https://wa.me/573213873880?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading || !config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-10 h-10 border-2 border-zinc-100 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  const getTicketStatus = (numero: number) => {
    const v = ventas.find(v => v.numero === numero);
    if (!v) return "disponible";
    return "bloqueada";
  };

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-32 bg-white min-h-screen">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4 mb-12">
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Selección</h1>
              <p className="text-gray-400 font-medium max-w-sm leading-relaxed">Toca los números que deseas comprar. Puedes elegir varios.</p>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2 mb-40">
              {Array.from({ length: config.totalBoletas }, (_, i) => i).map((num) => {
                const status = getTicketStatus(num);
                const isSelected = selectedNumbers.includes(num);
                const isAvailable = status === "disponible";

                return (
                  <button
                    key={num}
                    onClick={() => isAvailable && handleSelect(num)}
                    className={cn(
                      "aspect-square rounded-xl flex items-center justify-center text-xs font-black border-2 transition-all active:scale-90 relative overflow-hidden group",
                      isAvailable && !isSelected && "bg-gray-50 border-zinc-100 text-gray-400 hover:border-zinc-900 hover:text-zinc-900 cursor-pointer",
                      isAvailable && isSelected && "bg-white border-zinc-900 text-zinc-900 shadow-xl shadow-zinc-100 cursor-pointer",
                      !isAvailable && "bg-zinc-50 border-transparent text-zinc-200 cursor-not-allowed"
                    )}
                  >
                    {String(num).padStart(config.cifrasJuego || 3, '0')}
                    {isSelected && (
                      <div className="absolute top-1 right-1">
                        <Check size={10} strokeWidth={4} className="text-zinc-900" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Carrito Flotante */}
            <div className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-[150] transition-all duration-500 ease-out transform",
              selectedNumbers.length > 0 ? "translate-y-0 opacity-100 scale-100" : "translate-y-24 opacity-0 scale-90"
            )}>
              <div className="bg-zinc-900 text-white px-8 py-5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-8 whitespace-nowrap border border-white/10">
                <div className="flex items-center gap-4 border-r border-white/10 pr-8">
                  <div className="relative">
                    <ShoppingCart size={20} />
                    <span className="absolute -top-3 -right-3 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-black text-white">{selectedNumbers.length}</span>
                  </div>
                  <p className="text-sm font-black tracking-tight">{formatCurrency(selectedNumbers.length * config.precioBoleta)} COP</p>
                </div>
                <button 
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:gap-4 transition-all"
                >
                  Ver resumen
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <button 
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-zinc-900 mb-12 transition-colors"
            >
              <ChevronLeft size={14} />
              Volver a la selección
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
              <div className="space-y-12">
                <div className="space-y-4">
                  <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Resumen</h1>
                  <p className="text-gray-400 font-medium">Revisa tu selección y completa tus datos.</p>
                </div>

                <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-zinc-100 space-y-8">
                  <div className="flex flex-wrap gap-3">
                    {selectedNumbers.sort((a,b) => a-b).map(num => (
                      <div key={num} className="group relative">
                        <div className="px-5 py-3 bg-white rounded-2xl text-sm font-black text-gray-900 border border-zinc-100 shadow-sm transition-all">
                          {String(num).padStart(config.cifrasJuego || 3, '0')}
                        </div>
                        <button 
                          onClick={() => handleSelect(num)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center transition-all scale-75 hover:scale-100 shadow-lg"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="pt-8 border-t border-zinc-200 flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inversión Total</p>
                      <p className="text-4xl font-black text-gray-900">{formatCurrency(selectedNumbers.length * config.precioBoleta)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleReserve} className="space-y-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      className="w-full px-8 py-5 rounded-[1.5rem] bg-gray-50 border-2 border-transparent focus:border-zinc-900 focus:bg-white outline-none transition-all font-bold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Celular / WhatsApp</label>
                    <input
                      type="tel"
                      required
                      value={celular}
                      onChange={(e) => setCelular(e.target.value.replace(/\D/g, ""))}
                      placeholder="Ej: 3101234567"
                      maxLength={10}
                      className="w-full px-8 py-5 rounded-[1.5rem] bg-gray-50 border-2 border-transparent focus:border-zinc-900 focus:bg-white outline-none transition-all font-bold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Ciudad</label>
                    <input
                      type="text"
                      required
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      placeholder="Ej: Pasto, Nariño"
                      className="w-full px-8 py-5 rounded-[1.5rem] bg-gray-50 border-2 border-transparent focus:border-zinc-900 focus:bg-white outline-none transition-all font-bold text-gray-900"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={reserving || selectedNumbers.length === 0}
                  className="w-full bg-zinc-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  {reserving ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      Confirmar Reserva
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in zoom-in duration-500 max-w-2xl mx-auto">
            {isFinalConfirmation ? (
              <div className="text-center space-y-12 py-10 animate-in zoom-in">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                  <CheckCircle2 size={64} />
                </div>
                <div className="space-y-4">
                  <h2 className="text-5xl font-black text-gray-900 tracking-tighter uppercase italic">¡Todo listo! 🎉</h2>
                  <p className="text-gray-500 font-medium max-w-sm mx-auto leading-relaxed">Tus números están apartados. Recuerda enviar tu comprobante de pago para confirmarlos.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 text-left max-w-md mx-auto">
                  <div className="bg-gray-50 p-6 rounded-3xl border border-zinc-100 flex items-center justify-between group cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => copyToClipboard("3138648345")}>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Nequi • Hiliana Ordoñez</p>
                      <p className="text-xl font-black text-gray-900">3138648345</p>
                    </div>
                    <Copy size={18} className="text-zinc-300 group-hover:text-zinc-900" />
                    {copiedText === "3138648345" && <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-zinc-900 text-white text-[10px] font-black px-3 py-1 rounded-lg">¡COPIADO!</div>}
                  </div>
                  <div className="bg-gray-50 p-6 rounded-3xl border border-zinc-100 flex items-center justify-between group cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => copyToClipboard("3213873880")}>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Nequi • Juan Pantoja</p>
                      <p className="text-xl font-black text-gray-900">3213873880</p>
                    </div>
                    <Copy size={18} className="text-zinc-300 group-hover:text-zinc-900" />
                    {copiedText === "3213873880" && <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-zinc-900 text-white text-[10px] font-black px-3 py-1 rounded-lg">¡COPIADO!</div>}
                  </div>
                </div>

                <div className="space-y-6">
                  <button 
                    onClick={handleWhatsAppFinal}
                    className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-4 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 uppercase tracking-widest text-sm"
                  >
                    <MessageCircle size={24} />
                    Enviar comprobante por WhatsApp
                  </button>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-xs mx-auto">Una vez verifiquemos tu pago, tus boletas quedarán confirmadas. Puedes revisar tu estado en &apos;Mi Estado&apos;.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-12">
                <div className="text-center space-y-6">
                  <h1 className="text-6xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Pagar Ahora</h1>
                  <p className="text-gray-400 font-medium max-w-sm mx-auto">Realiza la transferencia a cualquiera de estas cuentas.</p>
                </div>

                <div className="bg-white border-2 border-zinc-900 p-6 md:p-12 rounded-[3.5rem] space-y-10 shadow-2xl relative overflow-hidden transition-all">
                  {/* Nequi */}
                  <div className="space-y-8">
                    <div className="flex flex-col items-center gap-6">
                      <img src="/nequi.png" alt="Nequi" width={100} height={35} className="object-contain" />
                      
                      <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
                        <div 
                          onClick={() => copyToClipboard("3138648345")}
                          className="group relative cursor-pointer bg-zinc-50 hover:bg-zinc-100 p-6 rounded-[2rem] border border-zinc-100 transition-all active:scale-95 flex flex-col items-center gap-1"
                        >
                          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Hiliana Ordoñez Lasso</p>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-gray-900">3138648345</span>
                            <Copy size={16} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                          </div>
                          {copiedText === "3138648345" && <div className="absolute -top-10 bg-zinc-900 text-white text-[10px] font-black px-4 py-2 rounded-lg">¡COPIADO!</div>}
                        </div>

                        <div 
                          onClick={() => copyToClipboard("3213873880")}
                          className="group relative cursor-pointer bg-zinc-50 hover:bg-zinc-100 p-6 rounded-[2rem] border border-zinc-100 transition-all active:scale-95 flex flex-col items-center gap-1"
                        >
                          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Juan Pantoja</p>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-gray-900">3213873880</span>
                            <Copy size={16} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                          </div>
                          {copiedText === "3213873880" && <div className="absolute -top-10 bg-zinc-900 text-white text-[10px] font-black px-4 py-2 rounded-lg">¡COPIADO!</div>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bre-b */}
                  <div className="pt-10 border-t border-zinc-100 space-y-8">
                    <div className="flex flex-col items-center gap-4">
                      <img src="/bre-b.png" alt="Bre-b" width={100} height={35} className="object-contain" />
                      <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">También disponible en Bre-b</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div onClick={() => copyToClipboard("3213873880")} className="group relative cursor-pointer bg-gray-50 hover:bg-zinc-100 p-5 rounded-2xl border border-zinc-100 transition-all active:scale-95 flex flex-col items-center gap-1">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Número</p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-gray-900">3213873880</span>
                          <Copy size={14} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                        </div>
                        {copiedText === "3213873880" && <div className="absolute -top-10 bg-zinc-900 text-white text-[10px] font-black px-4 py-2 rounded-lg">¡COPIADO!</div>}
                      </div>

                      <div onClick={() => copyToClipboard("@jupaor")} className="group relative cursor-pointer bg-gray-50 hover:bg-zinc-100 p-5 rounded-2xl border border-zinc-100 transition-all active:scale-95 flex flex-col items-center gap-1">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Llave</p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-gray-900">@jupaor</span>
                          <Copy size={14} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                        </div>
                        {copiedText === "@jupaor" && <div className="absolute -top-10 bg-zinc-900 text-white text-[10px] font-black px-4 py-2 rounded-lg">¡COPIADO!</div>}
                      </div>
                    </div>
                  </div>

                  {/* Apartar Boletas - Botón Verde */}
                  <div className="pt-6">
                    <button 
                      onClick={handleApartarClick}
                      className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-4 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 uppercase tracking-widest text-sm"
                    >
                      <MessageCircle size={24} />
                      Apartar mis boletas
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 pt-8 opacity-60">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center leading-relaxed max-w-xs">
                    Al hacer clic, tus números quedarán reservados y pasarás a la confirmación final.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
