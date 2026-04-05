"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingCart, Search, Crown, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/comprar", label: "Comprar", icon: ShoppingCart },
    { href: "/estado", label: "Mi Estado", icon: Search },
    { href: "/ganador", label: "Ganador", icon: Crown },
  ];

  const handleSupportClick = () => {
    const text = "Hola, tengo una pregunta sobre la rifa 🎟️";
    window.open(`https://wa.me/573213873880?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-lg border-b border-zinc-100 transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95">
            <span className="text-white font-black text-lg">S</span>
          </div>
          <span className="text-sm font-black text-gray-900 uppercase tracking-[0.4em] hidden sm:block italic">SORTEA</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="h-4 w-px bg-zinc-100 mx-2" />
          <button 
            onClick={handleSupportClick}
            className="p-2 transition-transform hover:scale-110 active:scale-90"
            title="Soporte WhatsApp"
          >
            <svg viewBox="0 0 24 24" fill="#25D366" width="28" height="28">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.17 1.535 5.943L.057 23.486a.75.75 0 00.917.942l5.762-1.51A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.705 9.705 0 01-4.953-1.355l-.355-.211-3.68.964.981-3.584-.232-.369A9.718 9.718 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
            </svg>
          </button>
        </div>

        {/* Mobile Toggle */}
        <div className="flex md:hidden items-center gap-4">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2.5 rounded-xl bg-zinc-100 text-zinc-900 transition-all"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div className={cn(
        "fixed inset-0 top-20 bg-white z-40 md:hidden transition-all duration-300 transform",
        isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}>
        <div className="p-8 flex flex-col gap-4">
          {links.map((link) => (
            <Link 
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-4 p-6 rounded-[2rem] bg-zinc-50 border border-zinc-100 text-zinc-900"
            >
              <link.icon size={20} className="text-zinc-400" />
              <span className="text-sm font-black uppercase tracking-widest">{link.label}</span>
            </Link>
          ))}
          <button 
            onClick={() => { handleSupportClick(); setIsOpen(false); }}
            className="flex items-center gap-4 p-6 rounded-[2rem] bg-zinc-50 border border-zinc-100 text-zinc-900 mt-4"
          >
            <svg viewBox="0 0 24 24" fill="#25D366" width="20" height="20">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.17 1.535 5.943L.057 23.486a.75.75 0 00.917.942l5.762-1.51A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.705 9.705 0 01-4.953-1.355l-.355-.211-3.68.964.981-3.584-.232-.369A9.718 9.718 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
            </svg>
            <span className="text-sm font-black uppercase tracking-widest">Soporte</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
