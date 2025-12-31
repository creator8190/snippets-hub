"use client";
import React from 'react';

export function MarketplaceView({ items }: { items: any[] }) {
  return (
    <div className="max-w-7xl mx-auto py-10 animate-in fade-in duration-700">
      <header className="flex justify-between items-end border-b border-white/5 pb-10 mb-16">
        <div>
          <h2 className="text-7xl font-serif font-bold italic tracking-tighter">Global Exchange</h2>
          <p className="text-zinc-500 mt-4 text-xl">Acquire premium intellectual property from verified authors.</p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {items.map((item, i) => (
          <div key={i} className="bg-zinc-900/40 border border-white/5 p-12 rounded-[50px] hover:border-red-600/40 transition-all group">
             <div className="flex justify-between mb-8">
                <span className="text-red-600 text-[10px] font-black tracking-widest uppercase italic">IP Block #{item.id?.slice(0,5)}</span>
                <span className="text-2xl font-bold font-mono text-white">${item.price}</span>
             </div>
             <p className="text-zinc-400 italic text-lg leading-relaxed h-32 overflow-hidden mb-12">"{item.preview_text || item.content}"</p>
             <button className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-sm hover:bg-red-600 hover:text-white transition">Acquire Asset</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileView({ profile, snippets, user, onSignOut }: any) {
  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-bottom-10">
      <div className="bg-zinc-900/60 border border-white/10 p-24 rounded-[80px] shadow-3xl">
        <div className="flex items-center gap-16 mb-20">
          <div className="w-40 h-40 bg-red-600 rounded-[50px] flex items-center justify-center text-7xl shadow-2xl rotate-3">👤</div>
          <div>
            <h2 className="text-7xl font-serif font-bold italic tracking-tighter">{profile?.full_name || 'Author'}</h2>
            <p className="text-zinc-500 font-mono text-lg">{user?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-16 text-center border-t border-white/5 pt-20">
           <div><p className="text-6xl font-bold mb-2">{snippets.length}</p><p className="text-[10px] uppercase font-black text-zinc-600 tracking-widest">Assets</p></div>
           <div><p className="text-6xl font-bold mb-2 text-red-600">${profile?.total_earned || '0.00'}</p><p className="text-[10px] uppercase font-black text-zinc-600 tracking-widest">Revenue</p></div>
           <div><button onClick={onSignOut} className="mt-6 text-zinc-700 hover:text-red-600 font-black text-[10px] uppercase tracking-widest">Terminate Session</button></div>
        </div>
      </div>
    </div>
  );
}