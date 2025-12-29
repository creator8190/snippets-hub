"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (This uses the keys you'll add to Vercel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function SnippetsApp() {
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle the actual Signup logic
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
        alert(error.message);
    } else {
        alert("Check your email for the confirmation link!");
        setShowSignup(false);
    }
    setLoading(false);
  };

  const navItems = [
    { icon: "🏛️", label: "Home", href: "/" },
    { icon: "✍️", label: "Editor", href: "/editor" },
    { icon: "👤", label: "Profile", href: "/profile" },
    { icon: "🛍️", label: "Store", href: "/store" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <aside className="w-24 bg-white border-r border-slate-100 flex flex-col items-center py-10 gap-10 sticky top-0 h-screen z-50">
        <div className="text-3xl font-serif font-black text-orange-600 underline cursor-pointer">S.</div>
        <div className="flex flex-col gap-8 flex-1">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href}>
              <button className="text-2xl p-3 rounded-2xl transition text-slate-300 hover:text-orange-500 hover:bg-orange-50">{item.icon}</button>
            </Link>
          ))}
        </div>
        <button className="text-slate-400 hover:text-red-500 font-bold text-xs uppercase tracking-tighter">Exit</button>
      </aside>

      <main className="flex-1 p-8 md:p-12 lg:p-20 relative">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-6xl font-serif font-black text-slate-900 leading-tight">
            Build your <span className="text-orange-600">snippets</span> library.
          </h1>
          <div className="flex gap-4 pt-4">
            <button 
              onClick={() => setShowSignup(true)}
              className="px-8 py-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 transition"
            >
              Join for Free
            </button>
          </div>
        </div>

        {showSignup && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowSignup(false)} />
            <div className="relative bg-white w-full max-w-md p-10 rounded-3xl shadow-2xl">
              <h2 className="text-3xl font-serif font-black text-slate-900 mb-6">Create Account</h2>
              <form className="space-y-4" onSubmit={handleSignUp}>
                <input 
                  type="email" 
                  placeholder="Email" 
                  className="w-full p-4 bg-slate-50 border rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  className="w-full p-4 bg-slate-50 border rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  disabled={loading}
                  className="w-full py-4 bg-orange-600 text-white font-black rounded-xl hover:bg-orange-700 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Create Account'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}