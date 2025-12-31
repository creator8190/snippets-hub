"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

// --- TYPE DEFINITIONS ---
type Tier = 'FREE' | 'PRO' | 'ELITE';

export default function GlobalAuthorTerminal() {
  const [view, setView] = useState('landing'); 
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  
  // Feature States
  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [content, setContent] = useState('');
  const [listingPrice, setListingPrice] = useState('99.00');

  useEffect(() => {
    const sync = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchCoreData(session.user.id);
      }
      const { data } = await supabase.from('snippets').select('*, profiles(full_name)').eq('status', 'public');
      if (data) setMarketItems(data);
    };
    sync();
  }, []);

  async function fetchCoreData(uid: string) {
    const [p, s] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('snippets').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    ]);
    if (p.data) setProfile(p.data);
    if (s.data) setSnippets(s.data);
  }

  const handlePublish = async () => {
    if (!user) { setShowAuth(true); return; }
    const { data, error } = await supabase.from('snippets').insert([{
      content, user_id: user.id, status: 'public', price: parseFloat(listingPrice),
      preview_text: content.slice(0, 150) + "..."
    }]).select();
    if (data) { setSnippets([data[0], ...snippets]); setView('marketplace'); }
  };

  return (
    <div className="flex min-h-screen bg-[#020202] text-white selection:bg-red-600/50">
      {/* GLOBAL HUD GRADIENT */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-red-600/5 blur-[200px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-white/[0.02] blur-[150px] rounded-full" />
      </div>

      {/* COMMAND SIDEBAR */}
      <aside className="w-24 bg-black/80 backdrop-blur-3xl border-r border-white/5 flex flex-col items-center py-12 gap-12 sticky top-0 h-screen z-50">
        <div onClick={() => setView('landing')} className="text-4xl font-serif font-black text-red-600 cursor-pointer hover:scale-110 transition">S.</div>
        <nav className="flex flex-col gap-10 text-2xl text-zinc-700">
          <button onClick={() => setView('hub')} className={view === 'hub' ? 'text-red-600' : 'hover:text-white'}>🏛️</button>
          <button onClick={() => setView('write')} className={view === 'write' ? 'text-red-600' : 'hover:text-white'}>✍️</button>
          <button onClick={() => setView('marketplace')} className={view === 'marketplace' ? 'text-red-600' : 'hover:text-white'}>🛍️</button>
          <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-red-600' : 'hover:text-white'}>👤</button>
        </nav>
      </aside>

      <main className="flex-1 p-20 relative z-10">
        
        {/* LANDING: THE BIG VISION */}
        {view === 'landing' && (
          <div className="max-w-7xl animate-in fade-in slide-in-from-left-10 duration-1000">
             <div className="flex gap-4 mb-8">
                <span className="bg-red-600/10 text-red-600 px-4 py-1 rounded-full text-[10px] font-black tracking-[0.3em] uppercase border border-red-600/20">System Live</span>
                <span className="bg-white/5 text-zinc-500 px-4 py-1 rounded-full text-[10px] font-black tracking-[0.3em] uppercase border border-white/5">v4.2.0</span>
             </div>
             <h1 className="text-[160px] font-serif font-bold tracking-tighter leading-[0.75] mb-12">
               Write. <br/>Protect. <br/><span className="text-red-600 italic">Sell.</span>
             </h1>
             <p className="text-3xl text-zinc-500 max-w-3xl font-light leading-relaxed mb-16 pl-10 border-l-2 border-red-600">
               Enter the world's most secure ecosystem for intellectual property. Draft with AI, encrypt in the vault, and monetize your brilliance.
             </p>
             <div className="flex gap-10">
               <button onClick={() => setView('write')} className="px-20 py-8 bg-red-600 text-white rounded-2xl font-black text-2xl hover:bg-white hover:text-black hover:translate-y-[-4px] transition-all shadow-[0_20px_50px_rgba(220,38,38,0.3)]">Enter Drafting Room</button>
               {!user && <button onClick={() => setShowAuth(true)} className="px-20 py-8 border border-white/10 rounded-2xl font-bold text-2xl hover:bg-white/5 transition-all">Get Security Clearance</button>}
             </div>
          </div>
        )}

        {/* MARKETPLACE: THE COMMERCE ENGINE */}
        {view === 'marketplace' && (
          <div className="max-w-7xl animate-in fade-in duration-700">
            <header className="flex justify-between items-end border-b border-white/5 pb-10 mb-16">
              <div>
                <h2 className="text-7xl font-serif font-bold italic tracking-tighter">Global Exchange</h2>
                <p className="text-zinc-500 mt-4 text-xl">Acquire premium intellectual property from verified authors.</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-mono font-bold text-white mb-2">{marketItems.length}</div>
                <div className="text-[10px] uppercase font-black text-zinc-600 tracking-widest">Available Assets</div>
              </div>
            </header>
            <div className="grid grid-cols-3 gap-12">
              {marketItems.map((item, i) => (
                <div key={i} className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 p-12 rounded-[50px] hover:border-red-600/40 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex justify-between mb-8">
                    <span className="text-red-600 text-[10px] font-black tracking-widest uppercase italic">IP Block #{item.id.slice(0,5)}</span>
                    <span className="text-2xl font-bold font-mono text-white">${item.price}</span>
                  </div>
                  <p className="text-zinc-300 italic text-xl leading-relaxed mb-12 h-36 overflow-hidden">"{item.preview_text}"</p>
                  <button className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-sm hover:bg-red-600 hover:text-white transition-all shadow-2xl">Purchase Exclusive Rights</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROFILE: THE AUTHOR COMMAND CENTER */}
        {view === 'profile' && (
          <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-10 duration-700">
            <div className="bg-zinc-900/60 backdrop-blur-3xl border border-white/10 p-24 rounded-[80px] relative overflow-hidden shadow-3xl">
              <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-red-600/10 blur-[120px] rounded-full" />
              <div className="flex items-center gap-16 mb-20 relative z-10">
                <div className="w-48 h-48 bg-red-600 rounded-[60px] flex items-center justify-center text-7xl shadow-[0_0_70px_rgba(220,38,38,0.4)] rotate-3">👤</div>
                <div>
                  <h2 className="text-8xl font-serif font-bold italic tracking-tighter">{profile?.full_name || 'Verified Author'}</h2>
                  <div className="flex gap-6 mt-4">
                    <span className="text-zinc-500 font-mono text-lg">{user?.email}</span>
                    <span className="bg-red-600 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter">{profile?.membership_tier || 'FREE'}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-16 border-t border-white/5 pt-20 relative z-10 text-center">
                <div>
                  <p className="text-7xl font-bold mb-2 tracking-tighter">{snippets.length}</p>
                  <p className="text-[10px] uppercase font-black text-zinc-600 tracking-widest">Assets Secured</p>
                </div>
                <div>
                  <p className="text-7xl font-bold mb-2 text-red-600 tracking-tighter">${profile?.total_earned || '0.00'}</p>
                  <p className="text-[10px] uppercase font-black text-zinc-600 tracking-widest">Revenue Generated</p>
                </div>
                <div>
                  <button className="mt-4 px-10 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition">Edit Profile</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AUTH: THE GATEKEEPER */}
        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-6">
            <div className="bg-[#080808] p-24 rounded-[100px] w-full max-w-2xl border border-white/5 text-center relative shadow-[0_0_120px_rgba(0,0,0,1)]">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600" />
              <h2 className="text-7xl font-serif font-bold mb-8 italic tracking-tighter">{isSignUp ? 'Apply' : 'Authorize'}</h2>
              <div className="space-y-6 mb-12">
                <input placeholder="Network ID (Email)" className="w-full p-8 bg-black border border-white/10 rounded-[30px] text-white outline-none focus:border-red-600 transition text-2xl" />
                <input type="password" placeholder="Access Key" className="w-full p-8 bg-black border border-white/10 rounded-[30px] text-white outline-none focus:border-red-600 transition text-2xl" />
              </div>
              <button className="w-full py-8 bg-red-600 rounded-[30px] font-black text-2xl hover:bg-white hover:text-black transition-all duration-500 shadow-2xl">Initialize Connection</button>
              <button onClick={() => setIsSignUp(!isSignUp)} className="mt-12 text-zinc-600 font-black uppercase text-xs tracking-[0.4em] hover:text-red-600 transition">
                {isSignUp ? 'Existing Clearance? Log In' : 'New? Join the Elite Network'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}