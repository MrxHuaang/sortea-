"use client";

import React, { useState } from "react";
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import { verifyPassword } from "@/app/actions";

interface PasswordModalProps {
  onSuccess: () => void;
}

export default function PasswordModal({ onSuccess }: PasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const isValid = await verifyPassword(password);
      if (isValid) {
        onSuccess();
      } else {
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
    } catch (err) {
      console.error("Error al verificar contraseña:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-[100] p-4 transition-colors">
      <div className="w-full max-w-sm p-10 text-center space-y-12">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-zinc-900 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-zinc-200">
            <Lock size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <h1 className="text-sm font-black text-zinc-900 tracking-[0.4em] uppercase">SORTEA</h1>
            <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest leading-relaxed">
              Protected Administrative Access
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña Maestra"
              disabled={loading}
              autoFocus
              className={`w-full px-6 py-5 rounded-3xl bg-zinc-50 border-2 transition-all outline-none font-black text-center tracking-[0.3em] disabled:opacity-50 text-sm text-zinc-900 ${
                error ? "border-red-500 animate-shake" : "border-transparent focus:border-zinc-900 focus:bg-white"
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-zinc-900 text-white font-black py-5 rounded-3xl shadow-2xl shadow-zinc-200 flex items-center justify-center gap-4 transition-all active:scale-[0.98] disabled:opacity-50 disabled:bg-zinc-100 group uppercase text-[10px] tracking-[0.2em]"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                Ingresar Sistema 
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
        
        {error && (
          <p className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-bounce">
            Credenciales Incorrectas
          </p>
        )}
      </div>
    </div>
  );
}
