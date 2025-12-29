"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function SnippetsApp() {
  // 1. Logic State: Controls the "Join for Free" popup
  const [showSignup, setShowSignup] = useState(false);

  // 2. Navigation Helper: Standardized sidebar icons
  const navItems = [
    { icon: "🏛️", label: "Home", href: "/" },
    { icon: "✍️", label: "Editor", href: "/editor" },
    { icon: "👤", label: "Profile", href: "/profile" },
    { icon: "🛍️", label: "Store", href: "/store" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* SIDEBAR - Condensing your layout into a clean map */}
      <aside className="w-24 bg-white border-r border-slate-100 flex flex-col items-center py-10 gap-10 sticky top-0 h-screen z-50">
        <div className="text-3xl font-serif font-black text-orange-600 underline cursor-pointer hover:scale-110 transition">S.</div>
        
        <div className="flex flex-col gap-8 flex-1">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href}>
              <button className="text-2xl p-3 rounded-2xl transition text-slate-300 hover:text-orange-500 hover:bg-orange-50 active:scale-95" title={item.label}>
                {item.icon}
              </button>
            </Link>
          ))}
        </div>

        <button className="text-slate-400 hover:text-red-500 font-bold text-xs uppercase tracking-tighter transition">Exit</button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-8 md:p-12 lg:p-20 relative">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-6xl font-serif font-black text-slate-900 leading-tight">
            Build your <span className="text-orange-600">snippets</span> library.
          </h1>
          <p className="text-xl text-slate-500 max-w-xl leading-relaxed">
            A beautiful workspace to organize, share, and monetize your code segments effortlessly.
          </p>

          <div className="flex gap-4 pt-4">
            {/* THIS BUTTON NOW TRIGGERS THE MODAL INSTEAD OF A BLANK PAGE */}
            <button 
              onClick={() => setShowSignup(true)}
              className="px-8 py-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-200 transition-all active:scale-95"
            >
              Join for Free
            </button>
            <button className="px-8 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition">
              Explore Library
            </button>
          </div>
        </div>

        {/* 3. SIGNUP MODAL - Fixes the "Blank Screen" issue */}
        {showSignup && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowSignup(false)} />
            
            {/* Signup Form */}
            <div className="relative bg-white w-full max-w-md p-10 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-300">
              <button onClick={() => setShowSignup(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">✕</button>
              
              <h2 className="text-3xl font-serif font-black text-slate-900 mb-2">Get Started</h2>
              <p className="text-slate-500 mb-8">Create your account in seconds.</p>
              
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Email Address</label>
                  <input type="email" placeholder="name@example.com" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Password</label>
                  <input type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition" />
                </div>
                <button className="w-full py-4 bg-orange-600 text-white font-black rounded-xl hover:bg-orange-700 transition shadow-lg shadow-orange-100 mt-4">
                  Create Account
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}