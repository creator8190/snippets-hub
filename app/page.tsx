"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function UltimateAuthorApp() {
  // --- NAVIGATION & ROLE ---
  const [view, setView] = useState('landing');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  
  // --- STATE FOR FEATURES ---
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('49.99');
  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('author'); // author | editor_student
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // --- REVENUE & CREDIT LOGIC ---
  const [creditsToEarn, setCreditsToEarn] = useState(3); // For students

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) fetchFullSystemData(session.user.id);
      fetchMarket();
    };
    init();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchFullSystemData(session.user.id);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  async function fetchFullSystemData(uid: string) {
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

  const handleAuth = async () => {
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ 
        email, password, options: { data: { full_name: email.split('@')[0], role: role } } 
      });
      if (error) alert(error.message); else alert("Clearance pending. Check email.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message); else setShowAuth(false);
    }
  };

  const publishSnippet = async () => {
    if (!user) { setShowAuth(true); return; }
    const { data } = await supabase.from('snippets').insert([{
      content, user_id: user.id, status: 'public', price: parseFloat(price),
      preview_text: content.slice(0, 150) + "..."
    }]).select();
    if (data) { setSnippets([data[0], ...snippets]); setView('marketplace'); setContent(''); }
  };

  return (
    <div className="flex min-h-screen bg-[#020202] text-white selection:bg-red-600/50 font-sans overflow-x-hidden">
      
      {/* GLOBAL RED GLOW */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] right-[-10%] w-[1200px] h-[1200px] bg-red-600/5 blur-[250px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-white/[0.01] blur-[150px] rounded-full" />
      </div>

      {/* LEFT EXECUTIVE NAVIGATION */}
      <aside className="w-28 bg-black/80 backdrop-blur-3xl border-r border-white/5 flex flex-col items-center py-14 gap-12 sticky top-0 h-screen z-50">
        <div onClick={() => setView('landing')} className="text-4xl font-serif font-black text-red-600 cursor-pointer hover:scale-110 transition">S.</div>
        <nav className="flex flex-col gap-12 text-3xl text-zinc-800">
          <button onClick={() => setView('hub')} className={view === 'hub' ? 'text-red-600' : 'hover:text-white transition-all'}>🏛️</button>
          <button onClick={() => setView('write')} className={view === 'write' ? 'text-red-600' : 'hover:text-white transition-all'}>✍️</button>
          <button onClick={() => setView('marketplace')} className={view === 'marketplace' ? 'text-red-600' : 'hover:text-white transition-all'}>🛍️</button>
          <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-red-600' : 'hover:text-white transition-all'}>👤</button>
        </nav>
        <div className="mt-auto group relative cursor-help flex flex-col items-center gap-4">
            <span className="text-zinc-800 font-black text-[9px] tracking-[0.5em] vertical-text">ENCRYPTED</span>
            <div className="w-1 h-12 bg-gradient-to-b from-red-600 to-transparent opacity-50" />
        </div>
      </aside>

      <main className="flex-1 p-24 relative z-10 overflow-y-auto h-screen">
        
        {/* LANDING: THE FULL ENTRY GATE */}
        {view === 'landing' && (
          <div className="max-w-7xl animate-in fade-in slide-in-from-left-12 duration-1000">
            <div className="flex items-center gap-6 mb-12">
                <span className="bg-red-600 text-white px-5 py-2 rounded-full text-[10px] font-black tracking-[0.5em] uppercase">Phase 1 Live</span>
                <span className="text-zinc-600 text-[10px] font-black tracking-[0.5em] uppercase italic">Author & Editor Protocol</span>
            </div>
            <h1 className="text-[185px] font-serif font-bold tracking-tighter leading-[0.72] mb-16 drop-shadow-2xl">
              Write. <br/>Protect. <br/><span className="text-red-600 italic">Earn.</span>
            </h1>
            <p className="text-4xl text-zinc-500 max-w-4xl font-light leading-relaxed mb-20 border-l-[6px] border-red-600 pl-16">
              The only terminal where professional authors secure IP and university students earn degree credits through elite editing.
            </p>
            
            <div className="flex gap-12 items-center">
              {!user ? (
                <>
                  <button onClick={() => { setIsSignUp(true); setShowAuth(true); }} className="px-24 py-10 bg-red-600 text-white rounded-[35px] font-black text-3xl shadow-[0_25px_60px_rgba(220,38,38,0.4)] hover:translate-y-[-5px] transition-all duration-500">Join for Free</button>
                  <button onClick={() => { setIsSignUp(false); setShowAuth(true); }} className="text-2xl font-bold border-b-2 border-white/20 pb-2 hover:border-red-600 transition-all">Member Login</button>
                </>
              ) : (
                <button onClick={() => setView('write')} className="px-24 py-10 bg-red-600 text-white rounded-[35px] font-black text-3xl shadow-2xl transition-all">Initialize Dashboard</button>
              )}
            </div>
          </div>
        )}

        {/* MARKETPLACE: THE COMMERCE ENGINE */}
        {view === 'marketplace' && (
          <div className="max-w-7xl animate-in fade-in duration-700">
            <header className="flex justify-between items-end border-b border-white/5 pb-16 mb-24">
              <div>
                <h2 className="text-9xl font-serif font-bold italic tracking-tighter">Exchange</h2>
                <p className="text-zinc-500 mt-6 text-2xl">Acquire verified intellectual property block-by-block.</p>
              </div>
              <div className="text-right">
                <div className="text-6xl font-mono font-bold text-white tracking-tighter">{marketItems.length}</div>
                <div className="text-[11px] uppercase font-black text-zinc-700 tracking-[0.5em]">Live IP Blocks</div>
              </div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {marketItems.map((item, i) => (
                <div key={i} className="bg-zinc-900/30 backdrop-blur-3xl border border-white/5 p-16 rounded-[80px] hover:border-red-600/40 transition-all group relative overflow-hidden">
                  <div className="flex justify-between mb-12">
                    <span className="text-red-600 text-[11px] font-black tracking-widest uppercase italic border border-red-600/20 px-3 py-1 rounded-full">Secure Block</span>
                    <span className="text-4xl font-bold font-mono text-white tracking-tighter">${item.price}</span>
                  </div>
                  <p className="text-zinc-300 italic text-2xl leading-relaxed mb-16 h-56 overflow-hidden">"{item.preview_text || item.content}"</p>
                  <div className="flex flex-col gap-4">
                    <button className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all shadow-xl">Purchase License</button>
                    <span className="text-center text-[9px] text-zinc-600 uppercase font-black tracking-widest">Ownership Transfer Included</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EDITOR: THE DRAFTING & SNIPPET ROOM */}
        {view === 'write' && (
          <div className="max-w-6xl mx-auto animate-in zoom-in-95 duration-500">
            <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/10 p-28 rounded-[110px] shadow-3xl">
              <div className="flex justify-between items-center mb-12">
                <span className="text-red-600 font-black text-xs uppercase tracking-[0.4em]">Drafting Protocol 01</span>
                <div className="flex gap-4">
                  <div className="w-3 h-3 rounded-full bg-red-600" />
                  <div className="w-3 h-3 rounded-full bg-zinc-800" />
                  <div className="w-3 h-3 rounded-full bg-zinc-800" />
                </div>
              </div>
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Initialize manuscript or paste IP block..." 
                className="w-full h-[550px] bg-transparent outline-none text-5xl font-serif leading-relaxed placeholder:text-zinc-900 scrollbar-hide"
              />
              <div className="mt-20 flex justify-between items-center border-t border-white/5 pt-20">
                <button className="text-purple-500 font-black text-xs uppercase tracking-[0.4em] hover:text-white transition">⚡ AI Structural Analysis</button>
                <div className="flex items-center gap-10">
                  <div className="bg-black border border-white/10 px-10 py-6 rounded-3xl flex items-center">
                    <span className="text-zinc-700 font-bold text-xl mr-6">$</span>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-transparent outline-none font-mono text-3xl w-32" />
                  </div>
                  <button onClick={publishSnippet} className="px-24 py-9 bg-red-600 rounded-[40px] font-black text-3xl shadow-[0_20px_50px_rgba(220,38,38,0.3)] hover:scale-105 active:scale-95 transition-all">
                    Publish Snippet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE: THE COMPREHENSIVE DASHBOARD */}
        {view === 'profile' && (
          <div className="max-w-6xl mx-auto space-y-16 animate-in slide-in-from-bottom-12">
            <div className="bg-zinc-900/50 backdrop-blur-3xl border border-white/10 p-24 rounded-[110px] relative shadow-3xl overflow-hidden">
              <div className="absolute top-12 right-12">
                <span className="bg-red-600/10 text-red-600 border border-red-600/20 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest italic">
                  {profile?.role === 'editor' ? 'Elite Editor' : 'Author Pro'}
                </span>
              </div>
              
              <div className="flex items-center gap-20 mb-24">
                <div className="w-56 h-56 bg-red-600 rounded-[75px] flex items-center justify-center text-8xl shadow-2xl rotate-3">👤</div>
                <div>
                  <h2 className="text-9xl font-serif font-bold italic tracking-tighter mb-4">{profile?.full_name || 'Verified Member'}</h2>
                  <p className="text-zinc-600 font-mono text-2xl tracking-[0.3em]">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-24 border-t border-white/5 pt-24 text-center">
                <div>
                  <p className="text-8xl font-bold mb-4 tracking-tighter">{snippets.length}</p>
                  <p className="text-xs uppercase font-black text-zinc-700 tracking-[0.5em]">Inventory</p>
                </div>
                <div>
                  {profile?.role === 'editor' ? (
                    <>
                      <p className="text-8xl font-bold mb-4 text-red-600 tracking-tighter">{profile?.total_earned || '12'}</p>
                      <p className="text-xs uppercase font-black text-zinc-700 tracking-[0.5em]">Degree Credits</p>
                    </>
                  ) : (
                    <>
                      <p className="text-8xl font-bold mb-4 text-red-600 tracking-tighter">${profile?.total_earned || '0.00'}</p>
                      <p className="text-xs uppercase font-black text-zinc-700 tracking-[0.5em]">Net Revenue</p>
                    </>
                  )}
                </div>
                <div className="flex flex-col justify-center gap-6">
                    <button className="py-5 bg-white text-black rounded-3xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition">Edit Profile</button>
                    <button onClick={() => supabase.auth.signOut()} className="text-zinc-800 hover:text-red-600 text-[10px] font-black uppercase tracking-[0.4em] transition">Terminate Session</button>
                </div>
              </div>
            </div>
            
            {/* THE "STAY FOR FREE" / PRO TEASER */}
            <div className="bg-white p-20 rounded-[100px] flex justify-between items-center group shadow-2xl">
              <div>
                <h3 className="text-black text-6xl font-serif font-bold italic mb-4 tracking-tighter">Scale Your Impact.</h3>
                <p className="text-zinc-500 text-2xl font-medium tracking-tight">Unlimited marketplace reach and instant 0-fee payouts.</p>
              </div>
              <button className="px-20 py-10 bg-red-600 text-white rounded-[45px] font-black text-3xl shadow-xl hover:scale-105 transition-all">Go Elite — $29</button>
            </div>
          </div>
        )}

        {/* THE GATE: LOG IN / SIGN UP OVERLAY */}
        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-6">
            <div className="bg-[#080808] p-24 rounded-[120px] w-full max-w-3xl border border-white/5 text-center relative shadow-3xl">
              <div className="absolute top-0 left-0 w-2 h-full bg-red-600 rounded-l-full" />
              <h2 className="text-8xl font-serif font-bold mb-12 italic tracking-tighter">{isSignUp ? 'Apply' : 'Entry'}</h2>
              
              {isSignUp && (