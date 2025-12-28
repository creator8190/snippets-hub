"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SnippetsHub() {
  const [view, setView] = useState('landing'); // landing, auth, hub, write, profile, shop
  const [user, setUser] = useState<any>(null);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { setUser(session.user); setView('hub'); }
    };
    checkUser();
    fetchSnippets();
  }, []);

  const fetchSnippets = async () => {
    const { data } = await supabase.from('snippets').select('*');
    if (data) setSnippets(data);
  };

  // --- DESIGN COMPONENT: LANDING PAGE ---
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col">
        <nav className="p-8 flex justify-between items-center">
          <span className="text-3xl font-serif font-black text-orange-600 underline decoration-2 offset-4">S.</span>
          <button onClick={() => setView('auth')} className="font-bold text-sm uppercase tracking-widest">Login</button>
        </nav>
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-8xl font-serif font-bold italic mb-6 tracking-tighter text-slate-900">
            Write. Protect. <span className="text-orange-600 underline">Earn.</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mb-12 leading-relaxed font-medium">
            The world’s first encrypted ecosystem where authors secure their intellectual property and elite editors earn college credits.
          </p>
          <div className="flex gap-6">
            <button onClick={() => setView('auth')} className="bg-black text-white px-12 py-5 rounded-full font-bold shadow-2xl hover:scale-105 transition-transform">
              Join the Hub — Free
            </button>
            <button onClick={() => setView('hub')} className="bg-white border border-slate-200 px-12 py-5 rounded-full font-bold hover:bg-slate-50 transition">
              Preview Gallery
            </button>
          </div>
        </main>
        <footer className="p-12 grid grid-cols-3 gap-8 border-t border-slate-100 bg-white">
            <div className="text-center">
                <p className="font-black text-orange-600 text-xs uppercase mb-2">Security</p>
                <p className="text-sm font-medium text-slate-400">Dynamic User-ID Watermarking</p>
            </div>
            <div className="text-center border-x border-slate-100">
                <p className="font-black text-orange-600 text-xs uppercase mb-2">Education</p>
                <p className="text-sm font-medium text-slate-400">Accredited Peer Review System</p>
            </div>
            <div className="text-center">
                <p className="font-black text-orange-600 text-xs uppercase mb-2">Monetization</p>
                <p className="text-sm font-medium text-slate-400">90/10 Manuscript Sales</p>
            </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5F2] flex">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-24 bg-white border-r border-slate-100 flex flex-col items-center py-10 gap-10 sticky top-0 h-screen z-50">
        <div className="text-3xl font-serif font-black text-orange-600 underline cursor-pointer" onClick={() => setView('landing')}>S.</div>
        <div className="flex flex-col gap-8 flex-1">
            <button onClick={() => setView('hub')} className={`text-2xl p-3 rounded-2xl transition ${view === 'hub' ? 'bg-orange-50 text-orange-600' : 'text-slate-300'}`}>🏛️</button>
            <button onClick={() => setView('write')} className={`text-2xl p-3 rounded-2xl transition ${view === 'write' ? 'bg-orange-50 text-orange-600' : 'text-slate-300'}`}>✍️</button>
            <button onClick={() => setView('profile')} className={`text-2xl p-3 rounded-2xl transition ${view === 'profile' ? 'bg-orange-50 text-orange-600' : 'text-slate-300'}`}>👤</button>
            <button onClick={() => setView('shop')} className={`text-2xl p-3 rounded-2xl transition ${view === 'shop' ? 'bg-orange-50 text-orange-600' : 'text-slate-300'}`}>🛍️</button>
        </div>
        <button onClick={() => {supabase.auth.signOut(); setView('landing');}} className="text-slate-300 hover:text-red-500 font-bold text-xs uppercase tracking-tighter">Exit</button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-12 max-w-6xl mx-auto">
        
        {/* VIEW: HUB */}
        {view === 'hub' && (
          <div className="animate-in fade-in duration-1000">
            <header className="flex justify-between items-end mb-16">
                <div>
                    <h2 className="text-5xl font-serif font-bold italic tracking-tighter">The Global Hub</h2>
                    <p className="text-orange-600 font-black text-[10px] uppercase tracking-[0.2em] mt-2">Verified & Watermarked Manuscripts</p>
                </div>
                <button className="bg-black text-white px-8 py-3 rounded-full font-bold text-sm">+ Post Snippet</button>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {snippets.map(s => (
                <div key={s.id} onClick={() => setSelectedSnippet(s)} className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden">
                  <p className="text-2xl font-serif italic mb-10 leading-relaxed text-slate-800">"{s.content}"</p>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-6">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Auth: {s.author_name || 'Creator'}</span>
                    <span className="text-[10px] font-black text-orange-600 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Open Review →</span>
                  </div>
                  {/* WATERMARK */}
                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none flex items-center justify-center text-7xl font-black uppercase rotate-[-15deg] select-none text-slate-900">
                    {user?.email?.split('@')[0] || 'GUEST_USER'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: PROFILE */}
        {view === 'profile' && (
          <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
            <div className="bg-white p-16 rounded-[4rem] shadow-sm border border-slate-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-orange-600"></div>
                <div className="w-32 h-32 bg-slate-50 rounded-full mx-auto mb-8 flex items-center justify-center text-5xl shadow-inner">👤</div>
                <h2 className="text-4xl font-serif font-bold mb-2">{user?.email}</h2>
                <p className="text-orange-600 font-black text-xs uppercase tracking-[0.3em] mb-10 italic">Elite Student Editor</p>
                
                <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto border-t border-slate-50 pt-10">
                    <div>
                        <p className="text-3xl font-bold">12</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Reviews Left</p>
                    </div>
                    <div className="border-x border-slate-100">
                        <p className="text-3xl font-bold">4.9</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Editor Rating</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold">150</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Trust Points</p>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* VIEW: WRITE */}
        {view === 'write' && (
           <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-serif font-bold italic mb-10">Private Drafting Room</h2>
            <textarea className="w-full h-[65vh] bg-white p-16 rounded-[4rem] shadow-inner text-2xl font-serif leading-[2] outline-none border-none resize-none" placeholder="Begin your legacy..." />
            <div className="flex justify-end mt-8">
                <button className="bg-orange-600 text-white px-12 py-4 rounded-full font-bold shadow-xl hover:bg-black transition-colors">Publish Snippet</button>
            </div>
           </div>
        )}

        {/* VIEW: SHOP */}
        {view === 'shop' && (
           <div className="max-w-md mx-auto py-12">
            <div className="bg-white p-12 rounded-[3.5rem] border-2 border-orange-600 shadow-2xl text-center">
                <h3 className="text-3xl font-serif font-bold mb-4 italic text-slate-900">Pro Membership</h3>
                <p className="text-slate-400 text-sm mb-10 leading-relaxed font-medium px-4">Unlock advanced IP protection, custom watermarks, and direct access to top-rated college editors.</p>
                <div className="mb-10">
                    <span className="text-6xl font-black">$19</span>
                    <span className="text-slate-300 font-bold uppercase text-xs ml-2 tracking-widest">/mo</span>
                </div>
                <button className="w-full bg-orange-600 text-white py-5 rounded-2xl font-bold text-lg shadow-lg hover:shadow-orange-200 transition-all">Upgrade via Stripe</button>
                <button onClick={() => setView('hub')} className="mt-6 text-xs font-bold text-slate-300 uppercase tracking-widest hover:text-slate-900">Maybe Later</button>
            </div>
           </div>
        )}

      </main>

      {/* EDITORIAL DESK MODAL (REVIEW SYSTEM) */}
      {selectedSnippet && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-3xl rounded-[4rem] p-16 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-10">
                <h3 className="text-3xl font-serif font-bold italic">Editorial Desk</h3>
                <button onClick={() => setSelectedSnippet(null)} className="text-slate-300 hover:text-black text-2xl">✕</button>
            </div>
            <div className="bg-[#F8F5F2] p-10 rounded-[2.5rem] italic font-serif text-2xl mb-10 leading-relaxed text-slate-700">
                "{selectedSnippet.content}"
            </div>
            <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] mb-4">Your Professional Critique</h4>
            <textarea className="w-full h-40 p-6 bg-slate-50 border-none rounded-3xl mb-8 outline-none focus:ring-2 focus:ring-orange-600 transition-all text-slate-800" placeholder="Analyze the tone, structure, and impact..."></textarea>
            <div className="flex justify-end gap-6">
                <button onClick={() => setSelectedSnippet(null)} className="font-bold text-slate-400">Discard</button>
                <button className="bg-black text-white px-10 py-4 rounded-2xl font-bold shadow-xl hover:bg-orange-600 transition-colors">Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}