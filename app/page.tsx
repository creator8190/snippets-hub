"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialization of the database connection
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SnippetsHub() {
  // APP STATE MANAGEMENT
  const [view, setView] = useState('landing'); 
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [snippets, setSnippets] = useState<any[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState<any>(null);

  // LIFECYCLE: Check user status and fetch data
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { 
        setUser(session.user);
        // Automatically move into the app if they are already logged in
        if (view === 'landing' || view === 'auth') {
          setView('hub');
        }
      }
    };
    checkUser();
    fetchSnippets();
  }, [view]);

  const fetchSnippets = async () => {
    const { data, error } = await supabase
      .from('snippets')
      .select('*');
    if (data) {
      setSnippets(data);
    }
  };

  const handleAuth = async (type: 'login' | 'signup') => {
    const { data, error } = type === 'login' 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    
    if (error) {
      alert(error.message);
    } else if (type === 'signup') {
      alert("Verification email sent! Please check your inbox.");
    } else { 
      setUser(data.user); 
      setView('hub'); 
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('landing');
  };

  // ---------------------------------------------------------
  // VIEW 1: PREMIUM LANDING PAGE
  // ---------------------------------------------------------
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col font-sans">
        <nav className="p-8 flex justify-between items-center w-full max-w-7xl mx-auto">
          <span 
            className="text-4xl font-serif font-black text-orange-600 underline decoration-4 underline-offset-8 cursor-pointer"
            onClick={() => setView('landing')}
          >
            S.
          </span>
          <div className="flex items-center gap-8">
            {user ? (
              <>
                <button 
                  onClick={() => setView('hub')} 
                  className="font-bold text-sm uppercase tracking-[0.2em] text-orange-600"
                >
                  Go to Hub
                </button>
                <button 
                  onClick={handleLogout} 
                  className="font-bold text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-red-500 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <button 
                onClick={() => setView('auth')} 
                className="font-bold text-sm uppercase tracking-[0.2em] text-slate-900 border-b-2 border-black pb-1"
              >
                Login / Join
              </button>
            )}
          </div>
        </nav>

        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto">
          <h1 className="text-8xl md:text-9xl font-serif font-bold italic mb-8 tracking-tighter text-slate-900 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Write. Protect. <span className="text-orange-600 underline decoration-8">Earn.</span>
          </h1>
          <p className="text-2xl text-slate-500 max-w-3xl mb-16 leading-relaxed font-medium">
            The world’s first encrypted ecosystem where authors secure their intellectual property and elite editors earn college credits.
          </p>
          <div className="flex flex-col md:flex-row gap-8">
            <button 
              onClick={() => user ? setView('hub') : setView('auth')} 
              className="bg-black text-white px-16 py-6 rounded-full font-bold text-xl shadow-2xl hover:scale-105 transition-transform active:scale-95"
            >
              {user ? "Enter Your Dashboard" : "Join the Hub — Free"}
            </button>
            <button 
              onClick={() => setView('hub')} 
              className="bg-white border-2 border-slate-200 px-16 py-6 rounded-full font-bold text-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              Preview Gallery
            </button>
          </div>
        </main>

        <footer className="p-12 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-slate-100 bg-white">
          <div className="text-center">
            <h4 className="font-black text-orange-600 text-sm uppercase tracking-widest mb-3">IP Protection</h4>
            <p className="text-slate-400 font-medium italic">Dynamic Visual Watermarking</p>
          </div>
          <div className="text-center md:border-x border-slate-100 px-8">
            <h4 className="font-black text-orange-600 text-sm uppercase tracking-widest mb-3">Editorial Credits</h4>
            <p className="text-slate-400 font-medium italic">Accredited Peer Review Chain</p>
          </div>
          <div className="text-center">
            <h4 className="font-black text-orange-600 text-sm uppercase tracking-widest mb-3">Revenue</h4>
            <p className="text-slate-400 font-medium italic">90/10 Direct Author Splits</p>
          </div>
        </footer>
      </div>
    );
  }

  // ---------------------------------------------------------
  // VIEW 2: AUTH GATEWAY
  // ---------------------------------------------------------
  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex items-center justify-center p-6 text-slate-900">
        <div className="bg-white p-16 rounded-[4rem] shadow-2xl max-w-lg w-full border border-slate-200 text-center animate-in zoom-in-95 duration-500">
          <h2 className="text-4xl font-serif font-bold mb-4 italic">Join the Hub</h2>
          <p className="text-slate-400 mb-10 font-medium">Secure access to the manuscript network.</p>
          <div className="space-y-6 text-left">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">Email Address</label>
              <input 
                type="email" 
                placeholder="you@example.com" 
                className="w-full p-5 bg-slate-50 border-none rounded-3xl outline-none focus:ring-2 focus:ring-orange-500 transition-all" 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">Password</label>
              <input 
                type="password" 
                placeholder="••••••••••••" 
                className="w-full p-5 bg-slate-50 border-none rounded-3xl outline-none focus:ring-2 focus:ring-orange-500 transition-all" 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            <button 
              onClick={() => handleAuth('login')} 
              className="w-full bg-black text-white py-5 rounded-3xl font-bold text-lg hover:bg-orange-600 shadow-xl transition-all"
            >
              Login to Workspace
            </button>
            <button 
              onClick={() => handleAuth('signup')} 
              className="w-full border-2 border-black py-5 rounded-3xl font-bold text-lg hover:bg-slate-50 transition-all"
            >
              Create New Account
            </button>
            <button 
              onClick={() => setView('landing')} 
              className="block w-full mt-10 text-slate-400 font-bold text-sm text-center italic hover:text-black transition-colors"
            >
              ← Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // VIEW 3: MAIN APP SHELL (SIDEBAR + HUB/PROFILE/WRITE/SHOP)
  // ---------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F8F5F2] flex text-slate-900 font-sans">
      {/* PERSISTENT SIDEBAR */}
      <aside className="w-28 bg-white border-r border-slate-100 flex flex-col items-center py-12 gap-12 sticky top-0 h-screen z-50 shadow-sm">
        <div 
          className="text-4xl font-serif font-black text-orange-600 underline decoration-2 cursor-pointer hover:scale-110 transition-transform" 
          onClick={() => setView('landing')}
        >
          S.
        </div>
        <div className="flex flex-col gap-10 flex-1">
          <button 
            onClick={() => setView('hub')} 
            title="Manuscript Hub"
            className={`text-3xl p-4 rounded-3xl transition-all ${view === 'hub' ? 'bg-orange-100 text-orange-600 shadow-inner' : 'text-slate-300 hover:text-orange-300'}`}
          >
            🏛️
          </button>
          <button 
            onClick={() => setView('write')} 
            title="Drafting Room"
            className={`text-3xl p-4 rounded-3xl transition-all ${view === 'write' ? 'bg-orange-100 text-orange-600 shadow-inner' : 'text-slate-300 hover:text-orange-300'}`}
          >
            ✍️
          </button>
          <button 
            onClick={() => setView('profile')} 
            title="Your Profile"
            className={`text-3xl p-4 rounded-3xl transition-all ${view === 'profile' ? 'bg-orange-100 text-orange-600 shadow-inner' : 'text-slate-300 hover:text-orange-300'}`}
          >
            👤
          </button>
          <button 
            onClick={() => setView('shop')} 
            title="Pro Membership"
            className={`text-3xl p-4 rounded-3xl transition-all ${view === 'shop' ? 'bg-orange-100 text-orange-600 shadow-inner' : 'text-slate-300 hover:text-orange-300'}`}
          >
            🛍️
          </button>
        </div>
        <button 
          onClick={handleLogout} 
          className="text-slate-300 hover:text-red-500 font-black text-sm uppercase tracking-tighter"
        >
          Exit
        </button>
      </aside>

      {/* DYNAMIC MAIN CONTENT */}
      <main className="flex-1 p-16 max-w-7xl mx-auto w-full">
        
        {/* SUB-VIEW: THE HUB */}
        {view === 'hub' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <header className="flex justify-between items-end mb-20">
              <div>
                <h2 className="text-6xl font-serif font-bold italic tracking-tighter">The Global Hub</h2>
                <div className="flex items-center gap-3 mt-4">
                  <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                  <p className="text-orange-600 font-black text-xs uppercase tracking-[0.3em]">Live Protected Network</p>
                </div>
              </div>
              <button className="bg-black text-white px-10 py-4 rounded-full font-bold text-sm shadow-xl hover:bg-orange-600 transition-colors">
                + New Snippet
              </button>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {snippets.length > 0 ? snippets.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedSnippet(s)} 
                  className="bg-white p-14 rounded-[4rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <p className="text-3xl font-serif italic mb-12 leading-[1.6] text-slate-800">"{s.content}"</p>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-8">
                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Author: {s.author_name || 'Verified Creator'}</span>
                    <span className="text-[11px] font-black text-orange-600 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Launch Review →</span>
                  </div>
                  {/* DYNAMIC WATERMARK ENGINE */}
                  <div className="absolute inset-0 opacity-[0.06] pointer-events-none flex items-center justify-center text-8xl font-black uppercase rotate-[-20deg] select-none text-slate-900">
                    {user?.email?.split('@')[0] || 'SECURITY_TEST'}
                  </div>
                </div>
              )) : (
                <div className="col-span-2 text-center py-40 bg-white rounded-[4rem] border border-dashed border-slate-200">
                  <p className="text-slate-300 italic text-xl font-serif">Awaiting manuscript uploads...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUB-VIEW: USER PROFILE */}
        {view === 'profile' && (
          <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-700">
            <div className="bg-white p-20 rounded-[5rem] shadow-sm border border-slate-100 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-3 bg-orange-600"></div>
              <div className="w-40 h-40 bg-slate-50 rounded-full mx-auto mb-10 flex items-center justify-center text-6xl shadow-inner border-4 border-white">
                👤
              </div>
              <h2 className="text-5xl font-serif font-bold mb-3 tracking-tighter text-slate-900">{user?.email}</h2>
              <p className="text-orange-600 font-black text-sm uppercase tracking-[0.4em] mb-14 italic">Official Network Member</p>
              
              <div className="grid grid-cols-3 gap-12 max-w-3xl mx-auto border-t border-slate-50 pt-16">
                <div className="group">
                  <p className="text-5xl font-bold mb-2 group-hover:text-orange-600 transition-colors">12</p>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Editorial Reviews</p>
                </div>
                <div className="border-x border-slate-100 px-8 group">
                  <p className="text-5xl font-bold mb-2 group-hover:text-orange-600 transition-colors">4.9</p>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Peer Rating</p>
                </div>
                <div className="group">
                  <p className="text-5xl font-bold mb-2 group-hover:text-orange-600 transition-colors">150</p>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Trust Points</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-VIEW: DRAFTING ROOM */}
        {view === 'write' && (
           <div className="max-w-5xl mx-auto animate-in fade-in duration-700">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-5xl font-serif font-bold italic tracking-tighter">Drafting Room</h2>
              <span className="text-slate-300 font-bold text-xs uppercase tracking-widest italic">Autosave Active</span>
            </div>
            <textarea 
              className="w-full h-[65vh] bg-white p-20 rounded-[5rem] shadow-inner text-3xl font-serif leading-[2] outline-none border-none resize-none text-slate-800 placeholder:text-slate-100" 
              placeholder="Begin your legacy..." 
            />
            <div className="flex justify-end mt-12 gap-6">
              <button className="text-slate-400 font-bold px-8">Save Secretly</button>
              <button className="bg-orange-600 text-white px-16 py-5 rounded-full font-bold text-xl shadow-2xl hover:bg-black transition-all">
                Publish Snippet
              </button>
            </div>
           </div>
        )}

        {/* SUB-VIEW: PRO SHOP */}
        {view === 'shop' && (
           <div className="max-w-xl mx-auto py-20 animate-in zoom-in-95 duration-500">
            <div className="bg-white p-16 rounded-[4rem] border-4 border-orange-600 shadow-[0_40px_80px_-15px_rgba(234,88,12,0.15)] text-center">
              <h3 className="text-4xl font-serif font-bold mb-6 italic text-slate-900">Pro Membership</h3>
              <p className="text-slate-400 text-lg mb-12 leading-relaxed px-6 font-medium">
                Unlock advanced IP encryption, unlimited watermarks, and direct priority access to Ivy League editors.
              </p>
              <div className="mb-14">
                <span className="text-8xl font-black text-slate-900 tracking-tighter">$19</span>
                <span className="text-slate-300 font-bold uppercase text-sm ml-3 tracking-[0.3em]">/mo</span>
              </div>
              <button className="w-full bg-orange-600 text-white py-7 rounded-3xl font-bold text-2xl shadow-xl hover:shadow-orange-200 transition-all hover:scale-[1.02]">
                Upgrade with Stripe
              </button>
              <button 
                onClick={() => setView('hub')} 
                className="mt-10 text-xs font-black text-slate-300 uppercase tracking-[0.5em] hover:text-slate-900 transition-colors"
              >
                Return to Network
              </button>
            </div>
           </div>
        )}
      </main>

      {/* MODAL: EDITORIAL DESK (REVIEW SYSTEM) */}
      {selectedSnippet && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl z-[100] flex items-center justify-center p-8">
          <div className="bg-white w-full max-w-4xl rounded-[5rem] p-20 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h3 className="text-4xl font-serif font-bold italic">Editorial Desk</h3>
                <p className="text-orange-600 font-black text-[10px] uppercase tracking-[0.3em] mt-2">Active Manuscript Critique</p>
              </div>
              <button onClick={() => setSelectedSnippet(null)} className="text-slate-200 hover:text-black text-4xl transition-colors">✕</button>
            </div>
            
            <div className="bg-[#F8F5F2] p-12 rounded-[3rem] italic font-serif text-3xl mb-12 leading-relaxed text-slate-700 shadow-inner">
              "{selectedSnippet.content}"
            </div>
            
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Your Professional Analysis</label>
              <textarea 
                className="w-full h-48 p-8 bg-slate-50 border-none rounded-[2.5rem] mb-10 outline-none focus:ring-4 focus:ring-orange-100 transition-all text-xl text-slate-800" 
                placeholder="Analyze tone, structure, and emotional resonance..."
              ></textarea>
            </div>

            <div className="flex justify-end gap-10 items-center">
              <button onClick={() => setSelectedSnippet(null)} className="font-bold text-slate-400 hover:text-black transition-colors">Discard</button>
              <button className="bg-black text-white px-16 py-5 rounded-[2rem] font-bold text-lg shadow-2xl hover:bg-orange-600 transition-colors">
                Submit Formal Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}