"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SnippetsApp() {
  const [view, setView] = useState('landing'); 
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Check for an active session on load
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        setView('hub');
      }
    };
    checkUser();
  }, []);

  // REAL SIGN UP LOGIC
  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email for a verification link!");
  };

  // REAL LOGIN LOGIC
  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else {
      setUser(data.user);
      setView('hub');
    }
  };

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-6xl font-serif font-bold italic mb-4 underline decoration-orange-500">SNIPPETS</h1>
        <p className="text-slate-500 max-w-md mb-10 font-medium">The most secure environment for writers and editors. Protect your IP with every click.</p>
        <div className="flex gap-4">
          <button onClick={() => setView('auth')} className="bg-black text-white px-10 py-4 rounded-full font-bold shadow-xl">Get Started</button>
        </div>
      </div>
    );
  }

  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl max-w-md w-full border border-slate-200">
          <h2 className="text-3xl font-serif font-bold mb-8 italic">Join the Hub</h2>
          <input type="email" placeholder="Email" className="w-full p-4 mb-4 border rounded-2xl" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full p-4 mb-8 border rounded-2xl" onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleLogin} className="w-full bg-black text-white py-4 rounded-2xl font-bold mb-4">Login</button>
          <button onClick={handleSignUp} className="w-full border-2 border-black py-4 rounded-2xl font-bold">Create Account</button>
          <button onClick={() => setView('landing')} className="block w-full mt-6 text-slate-400 text-sm font-bold">← Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5F2] p-8">
      <nav className="flex justify-between items-center mb-12">
        <h1 className="text-2xl font-serif font-black italic underline decoration-orange-500">S.</h1>
        <div className="flex gap-6 items-center">
          <button onClick={() => setView('upgrade')} className="bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-xs font-black uppercase">Upgrade Plan</button>
          <button onClick={() => {supabase.auth.signOut(); setView('landing');}} className="font-bold text-slate-400 text-sm">Logout</button>
        </div>
      </nav>

      {view === 'upgrade' ? (
        <div className="max-w-md mx-auto bg-white p-12 rounded-[3rem] shadow-sm text-center border-2 border-orange-500">
          <h2 className="text-3xl font-serif font-bold mb-4 italic">Pro Membership</h2>
          <p className="text-slate-500 mb-8">Unlimited snippets, advanced watermarking, and zero platform fees on manuscript sales.</p>
          <p className="text-5xl font-bold mb-10">$19<span className="text-xl text-slate-400">/mo</span></p>
          {/* STRIPE BUTTON */}
          <a href="https://buy.stripe.com/8x214ndXr0Xb92y9Dr5Ne00" className="block w-full bg-orange-600 text-white py-5 rounded-2xl font-bold shadow-lg hover:bg-orange-700 transition">Upgrade with Stripe</a>
          <button onClick={() => setView('hub')} className="mt-6 text-sm font-bold text-slate-400">Not now, take me back</button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-serif font-bold italic mb-12">Welcome back, {user?.email}</h2>
          <div className="bg-white p-20 rounded-[4rem] text-center border border-slate-100 shadow-sm">
             <p className="text-slate-400 italic">Your secure feed is loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}