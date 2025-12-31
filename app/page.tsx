"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- DIRECT CLIENT (Prevents Import Errors) ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function UltimateProductionApp() {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState('landing');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  
  // UI & Form States
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('49.99');
  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- DATA LIFECYCLE ---
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchUserData(session.user.id);
      }
      fetchMarket();
    };
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserData(session.user.id);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  async function fetchUserData(uid: string) {
    const [p, s] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('snippets').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    ]);
    if (p.data) setProfile(p.data);
    if (s.data) setSnippets(s.data);
  }

  async function fetchMarket() {
    const { data } = await supabase.from('snippets').select('*, profiles(full_name)').eq('status', 'public');
    if (data) setMarketItems(data);
  }

  // --- ACTIONS ---
  const handleAuth = async () => {
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message); else alert("Check email!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message); else setShowAuth(false);
    }
  };

  const handlePublish = async () => {
    if (!user) { setShowAuth(true); return; }
    setIsSaving(true);
    const { data, error } = await supabase.from('snippets').insert([{
      content, user_id: user.id, status: 'public', price: parseFloat(price),
      preview_text: content.slice(0, 150) + "..."
    }]).select();
    if (data) {
      setSnippets([data[0], ...snippets]);
      fetchMarket();
      setView('marketplace');
      setContent('');
    }
    setIsSaving(false);
  };

  // --- UI COMPONENTS ---
  return (
    <div className="flex min-h-screen bg-[#030303] text-white selection:bg-red-600/40 overflow-hidden font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-24 bg-black border-r border-white/5 flex flex-col items-center py-12 gap-10 sticky top-0 h-screen z-50">
        <div onClick={() => setView('landing')} className="text-4xl font-serif font-black text-red-600 cursor-pointer hover:scale-110 transition">S.</div>
        <nav className="flex flex-col gap-10 text-2xl text-zinc-700">
          <button onClick={() => setView('hub')} className={view === 'hub' ? 'text-red-600' : 'hover:text-white transition'}>🏛️</button>
          <button onClick={() => setView('write')} className={view === 'write' ? 'text-red-600' : 'hover:text-white transition'}>✍️</button>
          <button onClick={() => setView('marketplace')} className={view === 'marketplace' ? 'text-red-600' : 'hover:text-white transition'}>🛍️</button>
          <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-red-600' : 'hover:text-white transition'}>👤</button>
        </nav>
      </aside>

      <main className="flex-1 p-20 relative overflow-y-auto h-screen">
        <div className="fixed top-[-10%] right-[-10%] w-[1000px] h-[1000px] bg-red-600/5 blur-[200px] -z-10 rounded-full" />

        {/* VIEW: LANDING */}
        {view === 'landing' && (
          <div className="max-w-7xl animate-in fade-in slide-in-from-left-10 duration-1000">
            <h1 className="text-[170px] font-serif font-bold tracking-tighter leading-[0.75] mb-12">
              Write. <br/>Protect. <br/><span className="text-red-600 italic">Earn.</span>
            </h1>
            <p className="text-4xl text-zinc-500 max-w-3xl font-light mb-16 border-l-4 border-red-600 pl-10">
              The premier marketplace for intellectual property.
            </p>
            <div className="flex gap-10">
              <button onClick={() => setView('write')} className="px-24 py-10 bg-red-600 text-white rounded-3xl font-black text-3xl shadow-2xl hover:scale-105 transition-all">Open Terminal</button>
            </div>
          </div>
        )}

        {/* VIEW: MARKETPLACE (AMAZON STYLE) */}
        {view === 'marketplace' && (
          <div className="max-w-7xl animate-in fade-in duration-700">
            <div className="flex justify-between items-end border-b border-white/5 pb-12 mb-16">
              <h2 className="text-8xl font-serif font-bold italic tracking-tighter">Global Exchange</h2>
              <div className="text-right">
                <p className="text-4xl font-mono font-bold">{marketItems.length}</p>
                <p className="text-[10px] uppercase font-black text-zinc-600 tracking-widest">Live Listings</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {marketItems.map((item, i) => (
                <div key={i} className="bg-zinc-900/40 border border-white/5 p-12 rounded-[60px] hover:border-red-600/50 transition-all group">
                  <div className="flex justify-between mb-8">
                    <span className="text-red-600 text-[10px] font-black tracking-widest uppercase italic">Asset #{item.id.slice(0,5)}</span>
                    <span className="text-3xl font-bold font-mono">${item.price}</span>
                  </div>
                  <p className="text-zinc-300 italic text-xl leading-relaxed mb-12 h-40 overflow-hidden">"{item.preview_text || item.content}"</p>
                  <button className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase text-sm hover:bg-red-600 hover:text-white transition-all shadow-xl">Acquire License</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: DRAFTING ROOM */}
        {view === 'write' && (
          <div className="max-w-6xl animate-in zoom-in-95 duration-500">
            <div className="bg-zinc-900/60 p-24 rounded-[80px] border border-white/10 shadow-3xl">
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Initialize manuscript..." 
                className="w-full h-[450px] bg-transparent outline-none text-5xl font-serif leading-relaxed"
              />
              <div className="mt-16 flex justify-between items-center border-t border-white/5 pt-16">
                <button className="text-purple-500 font-black text-xs uppercase tracking-[0.3em]">⚡ AI Polish (PRO)</button>
                <div className="flex items-center gap-8">
                  <div className="bg-black border border-white/10 px-6 py-4 rounded-2xl flex items-center">
                    <span className="text-zinc-600 font-bold mr-3">$</span>
                    <input value={price} onChange={(e) => setPrice(e.target.value)} className="bg-transparent outline-none font-mono text-2xl w-24" />
                  </div>
                  <button onClick={handlePublish} className="px-16 py-7 bg-red-600 rounded-3xl font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all">
                    {isSaving ? 'Encrypting...' : 'Publish & Sell'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: PROFILE (AMAZON SELLER DASHBOARD) */}
        {view === 'profile' && (
          <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in">
            <div className="bg-gradient-to-br from-zinc-900 to-black p-24 rounded-[100px] border border-white/10 shadow-3xl relative overflow-hidden">
               <div className="absolute top-10 right-10 bg-red-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">Live Dashboard</div>
               <div className="flex items-center gap-16 mb-24">
                 <div className="w-48 h-48 bg-red-600 rounded-[60px] flex items-center justify-center text-8xl shadow-2xl rotate-3">👤</div>
                 <div>
                   <h2 className="text-8xl font-serif font-bold italic tracking-tighter">{profile?.full_name || 'Verified Author'}</h2>
                   <p className="text-zinc-500 font-mono text-xl mt-4 tracking-widest">{user?.email}</p>
                 </div>
               </div>
               <div className="grid grid-cols-3 gap-16 text-center border-t border-white/5 pt-20">
                 <div><p className="text-7xl font-bold mb-4">{snippets.length}</p><p className="text-xs uppercase font-black text-zinc-600 tracking-[0.4em]">Total Assets</p></div>
                 <div><p className="text-7xl font-bold mb-4 text-red-600">${profile?.total_earned || '0.00'}</p><p className="text-xs uppercase font-black text-zinc-600 tracking-[0.4em]">Revenue</p></div>
                 <div><button onClick={() => supabase.auth.signOut()} className="mt-8 text-zinc-800 hover:text-red-600 font-black text-xs uppercase tracking-widest transition">Sign Out</button></div>
               </div>
            </div>
          </div>
        )}

        {/* AUTH OVERLAY */}
        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-6">
            <div className="bg-[#080808] p-24 rounded-[100px] w-full max-w-2xl border border-white/5 text-center shadow-2xl">
              <h2 className="text-7xl font-serif font-bold mb-10 italic tracking-tighter">{isSignUp ? 'Apply' : 'Authorize'}</h2>
              <div className="space-y-6 mb-12">
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full p-8 bg-black border border-white/10 rounded-[40px] text-white outline-none focus:border-red-600 text-2xl" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full p-8 bg-black border border-white/10 rounded-[40px] text-white outline-none focus:border-red-600 text-2xl" />
              </div>
              <button onClick={handleAuth} className="w-full py-8 bg-red-600 rounded-[40px] font-black text-2xl hover:bg-white hover:text-black transition-all">Enter Terminal</button>
              <button onClick={() => setIsSignUp(!isSignUp)} className="mt-12 text-zinc-600 font-black uppercase text-xs tracking-widest block mx-auto">{isSignUp ? 'Back to Login' : 'New? Join Elite'}</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}