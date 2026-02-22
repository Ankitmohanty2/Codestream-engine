"use client";

import { useTheme } from "@/context/ThemeContext";

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--fg)' }}>
      <nav className="flex items-center justify-between px-8 lg:px-16 h-16 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
            ✦ CodeStream
          </span>
          <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: 'var(--fg-muted)' }}>
            <a href="#features" className="hover:opacity-70 transition-opacity">About</a>
            <a href="#how" className="hover:opacity-70 transition-opacity">How it works</a>
            <a href="#" className="hover:opacity-70 transition-opacity">Docs</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-colors"
            style={{ border: '1px solid var(--border)' }}
            title="Toggle theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <a href="/login" className="btn-primary text-sm hidden sm:inline-flex">Log in</a>
        </div>
      </nav>

      <section className="pt-20 pb-10 md:pt-32 md:pb-16 px-8 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className="text-5xl md:text-7xl leading-[1.1] mb-6 animate-fade-up"
            style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400 }}
          >
            Great code comes<br />
            from <span className="inline-flex items-center">
              <span className="inline-block w-10 h-10 md:w-14 md:h-14 rounded-lg mx-2 align-middle" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', verticalAlign: 'middle' }} />
            </span> teamwork.
          </h1>
          <p
            className="text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed animate-fade-up delay-100"
            style={{ color: 'var(--fg-muted)', opacity: 0 }}
          >
            Work together to write clean, efficient, and reliable code.
            Solve challenges faster and smarter through collaboration.
          </p>
          <div className="flex items-center justify-center gap-4 animate-fade-up delay-200" style={{ opacity: 0 }}>
            <a href="/login" className="btn-outline">Start free trial</a>
            <a href="/login" className="btn-primary">Get a demo</a>
          </div>
        </div>
      </section>

      <section className="px-8 lg:px-16 pb-20 md:pb-32">
        <div
          className="max-w-4xl mx-auto rounded-xl overflow-hidden animate-fade-up delay-300"
          style={{ border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', opacity: 0 }}
        >
          <div className="flex items-center gap-0 px-4 h-10" style={{ backgroundColor: '#2d2d2d', borderBottom: '1px solid #404040' }}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-t text-xs font-medium" style={{ backgroundColor: '#1e1e1e', color: '#fff' }}>
              <span style={{ color: '#6a9955' }}>📄</span> index.js
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs" style={{ color: '#999' }}>
              <span>📋</span> README.md
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs" style={{ color: '#999' }}>
              <span>📋</span> .gitignore
            </div>
          </div>
          <div className="p-6 font-mono text-sm leading-7" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }}>
            <div className="flex">
              <div className="select-none pr-6 text-right" style={{ color: '#858585', minWidth: '3ch' }}>
                1<br />2<br />3<br />4<br />5<br />6<br />7<br />8<br />9<br />10<br />11<br />12
              </div>
              <div>
                <span style={{ color: '#6a9955' }}>{"// Imports"}</span><br />
                <span style={{ color: '#c586c0' }}>import</span> <span style={{ color: '#9cdcfe' }}>mongoose</span>, {"{"} <span style={{ color: '#4ec9b0' }}>Schema</span> {"}"} <span style={{ color: '#c586c0' }}>from</span> <span style={{ color: '#ce9178' }}>&apos;mongoose&apos;</span><br />
                <br />
                <span style={{ color: '#6a9955' }}>{"// Collection name"}</span><br />
                <span style={{ color: '#c586c0' }}>export</span> <span style={{ color: '#569cd6' }}>const</span> <span style={{ color: '#9cdcfe' }}>collection</span> = <span style={{ color: '#ce9178' }}>&apos;Product&apos;</span><span style={{ color: '#d4d4d4' }}>|</span><br />
                <br />
                <span style={{ color: '#6a9955' }}>{"// Schema"}</span><br />
                <span style={{ color: '#569cd6' }}>const</span> <span style={{ color: '#9cdcfe' }}>schema</span> = <span style={{ color: '#569cd6' }}>new</span> <span style={{ color: '#4ec9b0' }}>Schema</span>({"{"}<br />
                {"    "}<span style={{ color: '#9cdcfe' }}>name</span>: {"{"}<br />
                {"        "}<span style={{ color: '#9cdcfe' }}>type</span>: <span style={{ color: '#4ec9b0' }}>String</span>,<br />
                {"        "}<span style={{ color: '#9cdcfe' }}>required</span>: <span style={{ color: '#569cd6' }}>true</span><br />
                {"    "}{"}"}<br />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-8 lg:px-16 py-8 border-t text-center text-xs" style={{ borderColor: 'var(--border)', color: 'var(--fg-faint)' }}>
        <p>© 2026 CodeStream Engine. Built for developers who ship.</p>
      </footer>
    </div>
  );
}
