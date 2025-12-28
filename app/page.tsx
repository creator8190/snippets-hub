"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SnippetsApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "", role: "writer", hasAcceptedToS: false });
  const [snippets, setSnippets] = useState<any[]>([]);
  const [newSnippet, setNewSnippet] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // FETCH SNIPPETS FROM DATABASE
  useEffect(() => {
    const fetchSnippets = async () => {
      const { data } = await supabase.from('snippets').select('*').order('created_at', { ascending: false });
      if (data) setSnippets(data);
    };
    fetchSnippets();
  }, []);

  const handlePost = async () => {
    if (newSnippet.length > 5) {
      const { error } = await supabase.from('snippets').insert([
        { content: newSnippet, author_name: user.name, role: user.role }
      ]);
      
      if (!error) {
        window.location.reload(); // Refresh to show new post
      }
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex items-center justify-center p-6 text-center">
        <div className="bg-white p-12 rounded-3xl shadow-xl max-w-md w-full border border-slate-200">
          <h1 className="text-4xl font-serif font-bold mb-6 italic underline decoration-orange-500">SNIPPETS</h1>
          <button onClick={() => {setUser({name: "Writer_"+Math.floor(Math.random()*100), role: "writer", hasAcceptedToS: false}); setIsLoggedIn(true)}} 
            className="w-full bg-black text-white py-4 rounded-xl font-bold mb-4">Enter as Writer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFAF7] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
           <h2 className="text-4xl font-serif font-bold italic">The Hub</h2>
           <button onClick={() => setIsModalOpen(true)} className="bg-orange-600 text-white px-8 py-3 rounded-full font-bold">+ New Post</button>
        </div>

        <div className="space-y-6">
          {snippets.map((s) => (
            <div key={s.id} className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm relative">
              <p className="text-2xl font-serif italic select-none">"{s.content}"</p>
              <p className="mt-6 text-sm font-bold text-slate-400">By {s.author_name}</p>
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center text-6xl font-black uppercase rotate-[-10deg]">
                {user.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-2xl">
            <textarea 
              className="w-full h-64 p-6 border-2 border-slate-100 rounded-2xl outline-none text-xl font-serif"
              placeholder="Paste your snippet..."
              value={newSnippet}
              onChange={(e) => setNewSnippet(e.target.value)}
            />
            <div className="flex justify-end mt-6 gap-4">
              <button onClick={() => setIsModalOpen(false)} className="font-bold text-slate-400">Cancel</button>
              <button onClick={handlePost} className="bg-black text-white px-8 py-3 rounded-xl font-bold">Submit to Database</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}