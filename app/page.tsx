"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SnippetsApp() {
  const [view, setView] = useState('landing'); 
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [snippets, setSnippets] = useState<any[]>([]);
  const [myDraft, setMyDraft] = useState("");
  const [selectedSnippet, setSelectedSnippet] = useState<any>(null);

  useEffect(() => {
    checkUser();
    fetchSnippets();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      setView('hub');
    }
  };

  const fetchSnippets = async () => {
    const { data } = await supabase.from('snippets').select('*, reviews(*)').order('created_at', { ascending: false });
    if (data) setSnippets(data);
  };

  const handleAuth = async (type: 'login' | 'signup') => {
    const { data, error } = type === 'login' 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    
    if (error) alert(error.message);
    else if (type === 'signup') alert("Check email for link!");
    else { setUser(data.user); setView('hub'); }
  };

  // LANDING PAGE VIEW
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-6xl font-serif font-bold italic mb-6 underline decoration-orange-500">SNIPPETS</h1>
        <p className="text-slate-500 max-w-md mb-10 text-lg">The secure ecosystem for writers to protect drafts and students to earn editorial credits.</p>
        <div className="flex gap-4">
          <button onClick={() => setView('auth')} className="bg-black text-white px-12 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition">Enter the Hub</button>
        </div>
      </div>
    );
  }

  // AUTH VIEW
  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl max-w-md w-full border border-slate-200">
          <h2 className="text-3xl font-serif font-bold mb-8 italic text-center">Join the Hub</h2>
          <input type="email" placeholder="Email" className="w-full p-4 mb-4 border rounded-2xl outline-none focus:ring-2 focus:ring-orange-500" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full p-4 mb-8 border rounded-2xl outline-none focus:ring-2 focus:ring-orange-500" onChange={(e) => setPassword(e.target.value)} />
          <button onClick={() => handleAuth('login')} className="w-full bg-black text-white py-4 rounded-2xl font-bold mb-4">Login</button>
          <button onClick={() => handleAuth('signup')} className="w-full border-2 border-black py-4 rounded-2xl font-bold">Create Account</button>
          <button onClick={() => setView('landing')} className="block w-full mt-6 text-slate-400 text-sm font-bold">← Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5F2]">
      {/* SIDEBAR NAVIGATION */}
      <nav className="fixed left-0 top-0 h-full w-24 bg-white border-r flex flex-col items-center py-10 gap-12 shadow-sm z-50">
        <div className="text-3xl font-serif font-black text-orange-600 underline cursor-pointer" onClick={() => setView('hub')}>S.</div>
        <button onClick={() => setView('hub')} title="Global Hub" className={`text-2xl ${view === 'hub' ? 'text-orange-600' : 'text-slate-300'}`}>🏛️</button>
        <button onClick={() => setView('write')} title="Drafting Room" className={`text-2xl ${view === 'write' ? 'text-orange-600' : 'text-slate-300'}`}>✍️</button>
        <button onClick={() => setView('shop')} title="Pro Shop" className={`text-2xl ${view === 'shop' ? 'text-orange-600' : 'text-slate-300'}`}>🛍️</button>
        <button onClick={() => {supabase.auth.signOut(); setView('landing');}} className="mt-auto text-xl text-slate-300 hover:text-red-500">✕</button>
      </nav>

      <main className="pl-32 pr-8 py-12 max-w-6xl mx-auto">
        {/* VIEW: HUB */}
        {view === 'hub' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl font-serif font-bold italic mb-2">The Global Hub</h2>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-12">Protected Manuscripts</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {snippets.map(s => (
                <div key={s.id} onClick={() => setSelectedSnippet(s)} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative group overflow-hidden cursor-pointer">
                  <p className="text-2xl font-serif italic mb-8 leading-relaxed">"{s.content}"</p>
                  <p className="text-[10px] font-black text-slate-300 uppercase">By {s.author_name || 'Anonymous'}</p>
                  <div className="absolute inset-0 opacity-[0.04] pointer-events-none flex items-center justify-center text-6xl font-black uppercase rotate-[-15deg] select-none">
                    {user?.email?.split('@')[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: DRAFTING ROOM */}
        {view === 'write' && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-serif font-bold italic mb-8">Drafting Room</h2>
            <textarea 
              className="w-full h-[60vh] bg-white p-12 rounded-[3rem] shadow-inner text-xl font-serif leading-loose outline-none border-none"
              placeholder="Start your manuscript here..."
              value={myDraft}
              onChange={(e) => setMyDraft(e.target.value)}
            />
            <button className="mt-8 bg-black text-white px-10 py-4 rounded-2xl font-bold shadow-xl float-right">Push Snippet to Hub</button>
          </div>
        )}

        {/* VIEW: SHOP */}
        {view === 'shop' && (
          <div className="max-w-md mx-auto text-center py-10">
            <div className="bg-white p-12 rounded-[3rem] border-2 border-orange-500 shadow-xl">
              <h2 className="text-3xl font-serif font-bold italic mb-4">Pro Membership</h2>
              <p className="text-slate-500 mb-8">Unlimited snippets, custom watermarking, and early access to college editors.</p>
              <p className="text-6xl font-bold mb-10">$19<span className="text-xl text-slate-300">/mo</span></p>
              <a href="https://buy.stripe.com/8x214ndXr0Xb92y9Dr5Ne00" className="block w-full bg-orange-600 text-white py-5 rounded-2xl font-bold shadow-lg">Upgrade with Stripe</a>
            </div>
          </div>
        )}
      </main>

      {/* REVIEW MODAL */}
      {selectedSnippet && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-12">
            <h3 className="text-2xl font-serif font-bold mb-8">Editor's Desk</h3>
            <div className="bg-slate-50 p-8 rounded-2xl italic font-serif text-xl mb-8">"{selectedSnippet.content}"</div>
            <textarea className="w-full h-32 p-4 border rounded-2xl mb-6 outline-none focus:ring-2 focus:ring-orange-500" placeholder="Leave your professional review..."></textarea>
            <div className="flex justify-end gap-6">
              <button onClick={() => setSelectedSnippet(null)} className="font-bold text-slate-300">Cancel</button>
              <button className="bg-black text-white px-8 py-3 rounded-xl font-bold shadow-lg">Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}