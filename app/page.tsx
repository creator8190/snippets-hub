"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- ENGINE INITIALIZATION ---
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
  
  // --- UI & INTERACTION STATE ---
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('49.99');
  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('author'); // author | editor_student
  const [activeTab, setActiveTab] = useState('inventory');
  const [isProcessing, setIsProcessing] = useState(false);

  // --- LIFECYCLE: DATA PERSISTENCE ---
  useEffect(() => {
    const syncSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        await loadAuthenticatedData(session.user.id);
      }
      await loadGlobalMarket();
    };
    syncSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadAuthenticatedData(session.user.id);
    });

    return () => {
      if (authListener) authListener.subscription.unsubscribe();
    };
  }, []);

  async function loadAuthenticatedData(uid: string) {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', uid).single();
    const { data: s } = await supabase.from('snippets').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (p) setProfile(p);
    if (s) setSnippets(s);
  }

  async function loadGlobalMarket() {
    const { data } = await supabase.from('snippets').select('*, profiles(full_name)').eq('status', 'public');
    if (data) setMarketItems(data);
  }

  // --- ACTION HANDLERS ---
  const executeAuth = async () => {
    setIsProcessing(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { full_name: email.split('@')[0], user_role: role, credits_earned: 0, total_earned: 0 } } 
      });
      if (error) alert(error.message); else alert("Identity Created. Check Email for Verification.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message); else setShowAuth(false);
    }
    setIsProcessing(false);
  };

  const commitToMarket = async () => {
    if (!user) { setShowAuth(true); return; }
    setIsProcessing(true);
    
    const snippetData = {
      content,
      title: title || 'Untitled Manuscript',
      user_id: user.id,
      status: 'public',
      price: parseFloat(price),
      preview_text: content.slice(0, 200) + "..."
    };

    const { data, error } = await supabase.from('snippets').insert([snippetData]).select();
    
    if (data) {
      setSnippets([data[0], ...snippets]);
      await loadGlobalMarket();
      setView('marketplace');
      setContent('');
      setTitle('');
    } else {
      alert("Encryption Error: " + error.message);
    }
    setIsProcessing(false);
  };

  // --- RENDER LOGIC ---
  return (
    <div className="flex min-h-screen bg-[#020202] text-white selection:bg-red-600/50 font-sans tracking-tight">
      
      {/* ATMOSPHERIC GRADIENTS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[1400px] h-[1400px] bg-red-600/[0.04] blur-[280px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[900px] h-[900px] bg-white/[0.01] blur-[200px] rounded-full" />
      </div>

      {/* EXECUTIVE NAVIGATION SIDEBAR */}
      <aside className="w-32 bg-black/95 border-r border-white/5 flex flex-col items-center py-16 gap-16 sticky top-0 h-screen z-50">
        <div onClick={() => setView('landing')} className="text-5xl font-serif font-black text-red-600 cursor-pointer hover:scale-110 transition-transform duration-500">S.</div>
        <nav className="flex flex-col gap-14 text-4xl text-zinc-800">
          <button onClick={() => setView('hub')} title="Executive Hub" className={view === 'hub' ? 'text-red-600 scale-125' : 'hover:text-white transition-all'}>🏛️</button>
          <button onClick={() => setView('write')} title="Drafting Terminal" className={view === 'write' ? 'text-red-600 scale-125' : 'hover:text-white transition-all'}>✍️</button>
          <button onClick={() => setView('marketplace')} title="Global Exchange" className={view === 'marketplace' ? 'text-red-600 scale-125' : 'hover:text-white transition-all'}>🛍️</button>
          <button onClick={() => setView('profile')} title="Author Identity" className={view === 'profile' ? 'text-red-600 scale-125' : 'hover:text-white transition-all'}>👤</button>
        </nav>
        <div className="mt-auto group relative cursor-help flex flex-col items-center gap-6">
            <div className="w-[1px] h-32 bg-gradient-to-b from-transparent via-red-600/50 to-transparent" />
            <span className="text-zinc-800 font-black text-[10px] tracking-[0.6em] vertical-text uppercase">Verified Terminal</span>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 p-24 relative z-10 overflow-y-auto h-screen scrollbar-hide">
        
        {/* LANDING VIEW */}
        {view === 'landing' && (
          <div className="max-w-7xl animate-in fade-in slide-in-from-left-12 duration-1000">
            <header className="flex items-center gap-8 mb-16">
                <div className="flex items-center gap-3 bg-red-600 text-white px-6 py-2 rounded-full shadow-[0_0_40px_rgba(220,38,38,0.3)]">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-[11px] font-black tracking-[0.5em] uppercase">System Live</span>
                </div>
                <span className="text-zinc-600 text-[11px] font-black tracking-[0.5em] uppercase italic">Encrypted IP Exchange</span>
            </header>

            <h1 className="text-[195px] font-serif font-bold tracking-[ -0.06em] leading-[0.7] mb-20 drop-shadow-3xl">
              Write. <br/>Protect. <br/><span className="text-red-600 italic">Earn.</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-32 items-start">
                <p className="text-5xl text-zinc-500 font-light leading-snug border-l-[10px] border-red-600 pl-20 py-4">
                  The definitive terminal where <span className="text-white font-medium">elite authors</span> secure intellectual property and <span className="text-white font-medium">student editors</span> gain professional degree credits.
                </p>
                <div className="flex flex-col gap-10 pt-4">
                    <div className="bg-zinc-900/40 p-10 rounded-[50px] border border-white/5 backdrop-blur-xl">
                        <h4 className="text-red-600 font-black uppercase tracking-[0.3em] text-xs mb-4">Total Ecosystem Revenue</h4>
                        <p className="text-6xl font-serif font-bold">$1.42M+</p>
                    </div>
                    <div className="bg-zinc-900/40 p-10 rounded-[50px] border border-white/5 backdrop-blur-xl">
                        <h4 className="text-zinc-600 font-black uppercase tracking-[0.3em] text-xs mb-4">Verified Authors</h4>
                        <p className="text-6xl font-serif font-bold">8,402</p>
                    </div>
                </div>
            </div>
            
            <div className="flex gap-16 items-center">
              {!user ? (
                <>
                  <button onClick={() => { setIsSignUp(true); setShowAuth(true); }} className="px-32 py-12 bg-red-600 text-white rounded-[45px] font-black text-4xl shadow-[0_35px_80px_rgba(220,38,38,0.4)] hover:translate-y-[-10px] transition-all duration-700 active:scale-95">Join for Free</button>
                  <button onClick={() => { setIsSignUp(false); setShowAuth(true); }} className="text-3xl font-bold border-b-4 border-white/10 pb-4 hover:border-red-600 transition-all duration-500 hover:text-red-600">Secure Member Entry</button>
                </>
              ) : (
                <button onClick={() => setView('write')} className="px-32 py-12 bg-red-600 text-white rounded-[45px] font-black text-4xl shadow-2xl hover:scale-105 transition-all">Initialize Terminal</button>
              )}
            </div>
          </div>
        )}

        {/* MARKETPLACE VIEW */}
        {view === 'marketplace' && (
          <div className="max-w-7xl animate-in fade-in duration-700">
            <header className="flex justify-between items-end border-b-2 border-white/5 pb-20 mb-32">
              <div>
                <h2 className="text-[150px] font-serif font-bold italic tracking-tighter leading-none mb-6">Exchange</h2>
                <p className="text-zinc-500 text-3xl font-light">Acquire and license exclusive intellectual property blocks directly from the source.</p>
              </div>
              <div className="text-right">
                <div className="text-9xl font-mono font-bold text-white tracking-tighter mb-2">{marketItems.length}</div>
                <div className="text-[12px] uppercase font-black text-zinc-700 tracking-[0.6em]">IP Blocks in Escrow</div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
              {marketItems.map((item, i) => (
                <div key={i} className="bg-zinc-900/30 backdrop-blur-3xl border border-white/10 p-16 rounded-[100px] hover:border-red-600/50 transition-all duration-700 group relative">
                  <div className="absolute top-10 right-10">
                    <span className="text-4xl font-bold font-mono text-white tracking-tighter">${item.price}</span>
                  </div>
                  <div className="mb-14">
                    <span className="text-red-600 text-[12px] font-black tracking-widest uppercase italic border border-red-600/30 px-6 py-2 rounded-full bg-red-600/5">Verified Asset</span>
                  </div>
                  <h3 className="text-4xl font-serif font-bold mb-6 text-zinc-200">"{item.title || 'Untitled Protocol'}"</h3>
                  <p className="text-zinc-400 italic text-2xl leading-relaxed mb-20 h-64 overflow-hidden border-t border-white/5 pt-8">
                    {item.preview_text || item.content}
                  </p>
                  <div className="flex flex-col gap-6">
                    <button className="w-full py-8 bg-white text-black rounded-[45px] font-black uppercase text-sm hover:bg-red-600 hover:text-white transition-all shadow-2xl active:scale-95">Acquire Rights</button>
                    <div className="flex justify-between px-6 text-[10px] font-black text-zinc-700 uppercase tracking-widest">
                        <span>By {item.profiles?.full_name || 'Anonymous Author'}</span>
                        <span>Full Rights Incl.</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROFILE VIEW */}
        {view === 'profile' && (
          <div className="max-w-7xl mx-auto space-y-24 animate-in slide-in-from-bottom-20 duration-1000">
            {/* MAIN PROFILE CARD */}
            <div className="bg-zinc-900/50 backdrop-blur-3xl border border-white/10 p-32 rounded-[130px] relative shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="absolute top-16 right-16">
                <span className="bg-red-600 text-white px-10 py-3 rounded-full text-[13px] font-black uppercase tracking-[0.5em] italic shadow-2xl">
                  {profile?.user_role === 'editor' ? 'Elite Student Editor' : 'Professional Author'}
                </span>
              </div>
              
              <div className="flex items-center gap-28 mb-32">
                <div className="w-72 h-72 bg-red-600 rounded-[95px] flex items-center justify-center text-[120px] shadow-[0_0_120px_rgba(220,38,38,0.4)] rotate-3">👤</div>
                <div>
                  <h2 className="text-[130px] font-serif font-bold italic tracking-tighter mb-4 leading-none">{profile?.full_name || 'Verified Member'}</h2>
                  <p className="text-zinc-600 font-mono text-3xl tracking-[0.4em] uppercase">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-32 border-t border-white/10 pt-32 text-center">
                <div className="group cursor-default">
                  <p className="text-[120px] font-bold mb-6 tracking-tighter group-hover:text-red-600 transition-colors">{snippets.length}</p>
                  <p className="text-xs uppercase font-black text-zinc-700 tracking-[0.6em]">IP Inventory</p>
                </div>
                <div>
                  {profile?.user_role === 'editor' ? (
                    <div className="group cursor-default">
                      <p className="text-[120px] font-bold mb-6 text-red-600 tracking-tighter">{profile?.credits_earned || '12'}</p>
                      <p className="text-xs uppercase font-black text-zinc-700 tracking-[0.6em]">Degree Credits Earned</p>
                    </div>
                  ) : (
                    <div className="group cursor-default">
                      <p className="text-[120px] font-bold mb-6 text-red-600 tracking-tighter">${profile?.total_earned || '0.00'}</p>
                      <p className="text-xs uppercase font-black text-zinc-700 tracking-[0.6em]">Net Royalties</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center gap-10">
                    <button className="py-7 bg-white text-black rounded-[40px] text-[13px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95">Executive Settings</button>
                    <button onClick={() => supabase.auth.signOut()} className="text-zinc-800 hover:text-red-600 text-xs font-black uppercase tracking-[0.6em] transition-all">Terminate Session</button>
                </div>
              </div>
            </div>

            {/* TABBED INVENTORY SECTION */}
            <div className="space-y-16 pb-32">
                <div className="flex gap-16 border-b border-white/5 pb-8">
                    <button onClick={() => setActiveTab('inventory')} className={`text-4xl font-serif font-bold italic transition-all ${activeTab === 'inventory' ? 'text-white border-b-4 border-red-600 pb-4' : 'text-zinc-700'}`}>Private Vault</button>
                    <button onClick={() => setActiveTab('sales')} className={`text-4xl font-serif font-bold italic transition-all ${activeTab === 'sales' ? 'text-white border-b-4 border-red-600 pb-4' : 'text-zinc-700'}`}>Sales History</button>
                </div>
                
                {activeTab === 'inventory' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        {snippets.length > 0 ? snippets.map((s, i) => (
                            <div key={i} className="bg-zinc-900/20 border border-white/5 p-16 rounded-[80px] flex justify-between items-center group hover:bg-zinc-900/40 transition-all">
                                <div>
                                    <h5 className="text-3xl font-serif font-bold mb-4">{s.title || 'Untitled Manuscript'}</h5>
                                    <p className="text-zinc-600 text-sm font-mono uppercase tracking-widest">{new Date(s.created_at).toLocaleDateString()}</p>
                                </div>
                                <button className="px-10 py-5 bg-zinc-800 text-white rounded-full font-black text-xs hover:bg-red-600 transition-all">Manage</button>
                            </div>
                        )) : (
                            <div className="col-span-2 text-center py-32 border-2 border-dashed border-white/5 rounded-[80px]">
                                <p className="text-zinc-700 text-3xl font-serif italic">The vault is currently empty.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
          </div>
        )}

        {/* WRITE VIEW */}
        {view === 'write' && (
          <div className="max-w-7xl mx-auto animate-in zoom-in-95 duration-700">
            <div className="bg-zinc-900/30 backdrop-blur-3xl border border-white/10 p-32 rounded-[130px] shadow-3xl">
              <header className="flex justify-between items-center mb-16">
                <div className="flex items-center gap-6">
                    <h3 className="text-zinc-600 font-black text-sm uppercase tracking-[0.7em]">Drafting Protocol 7.4</h3>
                    <div className="w-[1px] h-8 bg-white/10" />
                    <input 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      placeholder="Protocol Title..." 
                      className="bg-transparent outline-none text-2xl font-serif italic text-white placeholder:text-zinc-800 w-96" 
                    />
                </div>
                <div className="flex gap-8 items-center">
                  <span className="text-purple-600 font-black text-[11px] uppercase tracking-widest animate-pulse">Neural Link Active</span>
                  <div className="w-5 h-5 rounded-full bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)]" />
                </div>
              </header>

              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Initialize manuscript... lock your intellectual property... prepare for the global stage." 
                className="w-full h-[650px] bg-transparent outline-none text-6xl font-serif leading-[1.4] placeholder:text-zinc-900 scrollbar-hide resize-none"
              />

              <footer className="mt-28 flex justify-between items-center border-t border-white/10 pt-24">
                <div className="flex gap-20">
                    <div className="flex flex-col">
                        <span className="text-zinc-700 font-black text-xs uppercase tracking-[0.5em] mb-4">Structural Density</span>
                        <span className="text-white font-mono text-4xl font-bold">{content ? content.split(' ').length : 0} <span className="text-zinc-800 text-lg">Words</span></span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-zinc-700 font-black text-xs uppercase tracking-[0.5em] mb-4">AI Sentiment</span>
                        <span className="text-white font-mono text-4xl font-bold text-green-500">EXECUTIVE</span>
                    </div>
                </div>

                <div className="flex items-center gap-16">
                  <div className="bg-black/60 border border-white/10 px-14 py-8 rounded-[40px] flex items-center shadow-inner">
                    <span className="text-zinc-700 font-bold text-4xl mr-10">$</span>
                    <input 
                      type="number" 
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)} 
                      className="bg-transparent outline-none font-mono text-5xl w-44 text-white" 
                    />
                  </div>
                  <button 
                    onClick={commitToMarket} 
                    disabled={isProcessing}
                    className="px-32 py-12 bg-red-600 text-white rounded-[50px] font-black text-4xl shadow-[0_30px_70px_rgba(220,38,38,0.4)] hover:scale-105 active:scale-95 transition-all duration-500 disabled:opacity-50"
                  >
                    {isProcessing ? 'ENCRYPTING...' : 'LIST FOR SALE'}
                  </button>
                </div>
              </footer>
            </div>
          </div>
        )}

        {/* AUTHENTICATION OVERLAY */}
        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-[50px] p-8">
            <div className="bg-[#080808] p-32 rounded-[140px] w-full max-w-4xl border border-white/5 text-center relative shadow-[0_0_200px_rgba(220,38,38,0.15)] overflow-hidden">
              <div className="absolute top-0 left-0 w-3 h-full bg-red-600 rounded-l-full" />
              <h2 className="text-[100px] font-serif font-bold mb-16 italic tracking-tighter leading-none">{isSignUp ? 'Apply' : 'Entry'}</h2>
              
              {isSignUp && (
                <div className="flex gap-8 mb-16 justify-center">
                  <button onClick={() => setRole('author')} className={`px-12 py-4 rounded-full text-[13px] font-black uppercase tracking-widest border transition-all ${role === 'author' ? 'bg-red-600 border-red-600 shadow-[0_0_40px_rgba(220,38,38,0.3)]' : 'border-white/10 text-zinc-700 hover:text-white'}`}>Professional Author</button>
                  <button onClick={() => setRole('editor')} className={`px-12 py-4 rounded-full text-[13px] font-black uppercase tracking-widest border transition-all ${role === 'editor' ? 'bg-red-600 border-red-600 shadow-[0_0_40px_rgba(220,38,38,0.3)]' : 'border-white/10 text-zinc-700 hover:text-white'}`}>Student Editor</button>
                </div>
              )}

              <div className="space-y-8 mb-20 max-w-2xl mx-auto">
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Identity" className="w-full p-12 bg-black border border-white/10 rounded-[55px] text-white outline-none focus:border-red-600 text-4xl transition-all" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Access Key" className="w-full p-12 bg-black border border-white/10 rounded-[55px] text-white outline-none focus:border-red-600 text-4xl transition-all" />
              </div>

              <button 
                onClick={executeAuth} 
                disabled={isProcessing}
                className="w-full max-w-2xl py-12 bg-red-600 rounded-[60px] font-black text-5xl shadow-[0_30px_70px_rgba(220,38,38,0.3)] hover:bg-white hover:text-black transition-all duration-700 disabled:opacity-50"
              >
                {isProcessing ? 'PROCESSING...' : 'EXECUTE'}
              </button>
              
              <button onClick={() => setShowAuth(false)} className="mt-16 text-zinc-800 hover:text-zinc-500 font-black text-sm uppercase tracking-[0.6em] block mx-auto transition-all">Abort Protocol</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}