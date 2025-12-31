"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- THE ENGINE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function GlobalAuthorTerminal() {
  // --- CORE SYSTEM STATE ---
  const [view, setView] = useState('landing');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  
  // Form/UI Logic
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('49.99');
  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- PERSISTENCE LOGIC ---
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchCoreData(session.user.id);
      }
      fetchMarket();
    };
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchCoreData(session.user.id);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  async function fetchCoreData(uid: string) {
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
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { full_name: email.split('@')[0] } } 
      });
      if (error) alert(error.message); else alert("Clearance requested. Check email.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message); else setShowAuth(false);
    }
  };

  const handlePublish = async () => {
    if (!user) { setShowAuth(true); return; }
    // Membership Check
    if (profile?.membership_tier === 'free' && snippets.length >= 2) {
      alert("Free Tier Limit Reached. Upgrade to Pro for unlimited sales.");
      setView('profile');
      return;
    }

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

  // --- THE UI RENDER ---
  return (
    <div className="flex min-h-screen bg-[#020202] text-white selection:bg-red-600/50 font-sans">
      
      {/* ATMOSPHERIC BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[1200px] h-[1200px] bg-red-600/10 blur-[250px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-white/[0.02] blur-[180px] rounded-full" />
      </div>

      {/* EXECUTIVE SIDEBAR */}
      <aside className="w-28 bg-black/80 backdrop-blur-3xl border-r border-white/5 flex flex-col items-center py-12 gap-12 sticky top-0 h-screen z-50">
        <div onClick={() => setView('landing')} className="text-4xl font-serif font-black text-red-600 cursor-pointer hover:scale-110 transition">S.</div>
        <nav className="flex flex-col gap-12 text-3xl text-zinc-800">
          <button onClick={() => setView('hub')} className={view === 'hub' ? 'text-red-600' : 'hover:text-white transition-all'}>🏛️</button>
          <button onClick={() => setView('write')} className={view === 'write' ? 'text-red-600' : 'hover:text-white transition-all'}>✍️</button>
          <button onClick={() => setView('marketplace')} className={view === 'marketplace' ? 'text-red-600' : 'hover:text-white transition-all'}>🛍️</button>
          <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-red-600' : 'hover:text-white transition-all'}>👤</button>
        </nav>
        <div className="mt-auto group relative cursor-help">
            <span className="text-zinc-800 font-black text-[10px] tracking-widest vertical-text">SECURE</span>
        </div>
      </aside>

      <main className="flex-1 p-24 relative z-10 overflow-y-auto h-screen">
        
        {/* VIEW: LANDING (The Original Aesthetic) */}
        {view === 'landing' && (
          <div className="max-w-7xl animate-in fade-in slide-in-from-left-12 duration-1000">
            <div className="flex gap-4 mb-10">
                <span className="bg-red-600/10 text-red-600 px-5 py-2 rounded-full text-[10px] font-black tracking-[0.4em] uppercase border border-red-600/20">System Online</span>
                <span className="bg-white/5 text-zinc-500 px-5 py-2 rounded-full text-[10px] font-black tracking-[0.4em] uppercase border border-white/5">Dec 2025 Release</span>
            </div>
            <h1 className="text-[180px] font-serif font-bold tracking-tighter leading-[0.75] mb-14 drop-shadow-2xl">
              Write. <br/>Protect. <br/><span className="text-red-600 italic">Sell.</span>
            </h1>
            <p className="text-4xl text-zinc-500 max-w-4xl font-light leading-relaxed mb-20 border-l-4 border-red-600 pl-14">
              Enter the world's premier terminal for elite intellectual property. Draft with AI, secure in the vault, and dominate the global market.
            </p>
            <div className="flex gap-12">
              <button onClick={() => setView('write')} className="px-24 py-10 bg-red-600 text-white rounded-3xl font-black text-3xl shadow-[0_25px_60px_rgba(220,38,38,0.4)] hover:translate-y-[-5px] transition-all duration-500">Initialize Terminal</button>
              {!user && <button onClick={() => setShowAuth(true)} className="px-20 py-10 border border-white/10 rounded-3xl font-bold text-2xl hover:bg-white/5 transition-all">Secure Entry</button>}
            </div>
          </div>
        )}

        {/* VIEW: MARKETPLACE (Amazon/Elite Storefront) */}
        {view === 'marketplace' && (
          <div className="max-w-7xl animate-in fade-in duration-700">
            <header className="flex justify-between items-end border-b border-white/5 pb-14 mb-20">
              <div>
                <h2 className="text-8xl font-serif font-bold italic tracking-tighter">Global Exchange</h2>
                <p className="text-zinc-500 mt-6 text-2xl">Purchase exclusive rights to premium manuscripts.</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-mono font-bold text-red-600 mb-2 tracking-tighter">{marketItems.length}</div>
                <div className="text-[10px] uppercase font-black text-zinc-600 tracking-[0.4em]">Active IP Blocks</div>
              </div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-14">
              {marketItems.map((item, i) => (
                <div key={i} className="bg-zinc-900/30 backdrop-blur-3xl border border-white/5 p-14 rounded-[70px] hover:border-red-600/40 transition-all group relative overflow-hidden">
                  <div className="flex justify-between mb-10">
                    <span className="text-red-600 text-[10px] font-black tracking-widest uppercase italic">Verified Asset #{item.id.slice(0,5)}</span>
                    <span className="text-4xl font-bold font-mono text-white tracking-tighter">${item.price}</span>
                  </div>
                  <p className="text-zinc-300 italic text-2xl leading-relaxed mb-14 h-48 overflow-hidden">"{item.preview_text || item.content}"</p>
                  <button className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase text-sm hover:bg-red-600 hover:text-white transition-all shadow-xl">Acquire Rights</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: PROFILE (Elite Dashboard) */}
        {view === 'profile' && (
          <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-12 duration-700">
            <div className="bg-zinc-900/50 backdrop-blur-3xl border border-white/10 p-24 rounded-[100px] relative shadow-3xl overflow-hidden">
              <div className="absolute top-12 right-12 flex gap-3">
                <span className="bg-zinc-800 text-zinc-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{profile?.membership_tier || 'FREE'} Tier</span>
              </div>
              
              <div className="flex items-center gap-20 mb-24">
                <div className="w-56 h-56 bg-red-600 rounded-[70px] flex items-center justify-center text-8xl shadow-[0_0_80px_rgba(220,38,38,0.4)] rotate-3">👤</div>
                <div>
                  <h2 className="text-8xl font-serif font-bold italic tracking-tighter mb-4">{profile?.full_name || 'Verified Author'}</h2>
                  <p className="text-zinc-600 font-mono text-2xl tracking-[0.2em]">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-20 border-t border-white/5 pt-24 text-center">
                <div>
                  <p className="text-8xl font-bold mb-4 tracking-tighter">{snippets.length}</p>
                  <p className="text-xs uppercase font-black text-zinc-700 tracking-[0.4em]">Secured IP</p>
                </div>
                <div>
                  <p className="text-8xl font-bold mb-4 text-red-600 tracking-tighter">${profile?.total_earned || '0.00'}</p>
                  <p className="text-xs uppercase font-black text-zinc-700 tracking-[0.4em]">Total Revenue</p>
                </div>
                <div className="flex flex-col justify-center gap-4">
                    <button className="py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition">Manage Payouts</button>
                    <button onClick={() => supabase.auth.signOut()} className="text-red-900 hover:text-red-600 text-[10px] font-black uppercase tracking-widest transition">Terminate Session</button>
                </div>
              </div>
            </div>
            
            {/* UPGRADE TEASER */}
            {profile?.membership_tier !== 'pro' && (
               <div className="mt-14 bg-white p-16 rounded-[80px] flex justify-between items-center group cursor-pointer hover:scale-[1.02] transition-all">
                  <div>
                    <h3 className="text-black text-5xl font-serif font-bold italic mb-4">Go Professional.</h3>
                    <p className="text-zinc-500 text-xl font-medium tracking-tight">Zero marketplace fees, unlimited AI Polish, and priority listed assets.</p>
                  </div>
                  <button className="px-16 py-8 bg-red-600 text-white rounded-[35px] font-black text-2xl shadow-xl">Upgrade — $29/mo</button>
               </div>
            )}
          </div>
        )}

        {/* VIEW: EDITOR */}
        {view === 'write' && (
          <div className="max-w-6xl mx-auto animate-in zoom-in-95 duration-500">
            <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 p-28 rounded-[100px] shadow-3xl">
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Initialize manuscript..." 
                className="w-full h-[500px] bg-transparent outline-none text-5xl font-serif leading-relaxed placeholder:text-zinc-800"
              />
              <div className="mt-20 flex justify-between items-center border-t border-white/5 pt-20">
                <button className="text-purple-500 font-black text-[10px] uppercase tracking-[0.5em] hover:text-white transition">⚡ Analyze & Polish (PRO)</button>
                <div className="flex items-center gap-10">
                  <div className="bg-black border border-white/10 px-8 py-5 rounded-3xl flex items-center">
                    <span className="text-zinc-700 font-bold text-lg mr-4">$</span>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-transparent outline-none font-mono text-3xl w-32" />
                  </div>
                  <button onClick={handlePublish} className="px-20 py-8 bg-red-600 rounded-[35px] font-black text-3xl shadow-[0_20px_50px_rgba(220,38,38,0.3)] hover:scale-105 active:scale-95 transition-all">
                    {isSaving ? 'Encrypting...' : 'List for Sale'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AUTH OVERLAY */}
        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-6">
            <div className="bg-[#080808] p-24 rounded-[110px] w-full max-w-2xl border border-white/5 text-center relative shadow-[0_0_150px_rgba(220,38,38,0.15)]">
              <div className="absolute top-0 left-0 w-2 h-full bg-red-600" />
              <h2 className="text-8xl font-serif font-bold mb-10 italic tracking-tighter">{isSignUp ? 'Apply' : 'Authorize'}</h2>
              <div className="space-y-6 mb-14">
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Identity (Email)" className="w-full p-9 bg-black border border-white/10 rounded-[45px] text-white outline-none focus:border-red-600 text-3xl transition-all" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Access Key" className="w-full p-9 bg-black border border-white/10 rounded-[45px] text-white outline-none focus:border-red-600 text-3xl transition-all" />
              </div>
              <button onClick={handleAuth} className="w-full py-10 bg-red-600 rounded-[45px] font-black text-3xl hover:bg-white hover:text-black transition-all duration-700 shadow-2xl">Initialize Connection</button>
              <button onClick={() => setIsSignUp(!isSignUp)} className="mt-14 text-zinc-600 font-black uppercase text-xs tracking-[0.5em] hover:text-red-600 transition block mx-auto tracking-widest">
                {isSignUp ? 'Back to Author Entry' : 'New Author? Request Clearance'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}