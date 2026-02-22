"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setIsLoading(true);

        // Store username from email prefix for now
        const username = email.split("@")[0] || email;
        localStorage.setItem("codestream_username", username);

        // Simulate a brief auth delay
        setTimeout(() => {
            setIsLoading(false);
            router.push("/");
        }, 800);
    };

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg)', color: 'var(--fg)' }}>
            {/* Left Panel — Branding */}
            <div
                className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
                style={{ backgroundColor: '#111', color: '#fff' }}
            >
                <div>
                    <Link href="/" className="text-xl font-bold tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
                        ✦ CodeStream
                    </Link>
                </div>

                <div className="max-w-md">
                    <h1
                        className="text-4xl xl:text-5xl leading-[1.15] mb-6"
                        style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400 }}
                    >
                        Write code together,<br />
                        ship faster.
                    </h1>
                    <p className="text-base leading-relaxed" style={{ color: '#999' }}>
                        Real-time collaboration with syntax highlighting, live cursors,
                        and instant code execution. Built for developers who ship.
                    </p>
                </div>

                {/* Code snippet decoration */}
                <div
                    className="rounded-lg p-5 font-mono text-sm leading-7 max-w-sm"
                    style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', color: '#d4d4d4' }}
                >
                    <div><span style={{ color: '#c586c0' }}>const</span> <span style={{ color: '#9cdcfe' }}>team</span> = <span style={{ color: '#ce9178' }}>&apos;awesome&apos;</span>;</div>
                    <div><span style={{ color: '#c586c0' }}>const</span> <span style={{ color: '#9cdcfe' }}>code</span> = <span style={{ color: '#dcdcaa' }}>collaborate</span>();</div>
                    <div><span style={{ color: '#6a9955' }}>{"// Ship it 🚀"}</span></div>
                </div>
            </div>

            {/* Right Panel — Auth Form */}
            <div className="flex-1 flex flex-col">
                {/* Top bar */}
                <div className="flex items-center justify-between px-8 h-16">
                    <Link href="/" className="lg:hidden text-xl font-bold tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
                        ✦ CodeStream
                    </Link>
                    <div className="flex items-center gap-3 ml-auto">
                        <button
                            onClick={toggleTheme}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-colors"
                            style={{ border: '1px solid var(--border)' }}
                        >
                            {theme === "dark" ? "☀️" : "🌙"}
                        </button>
                    </div>
                </div>

                {/* Form */}
                <div className="flex-1 flex items-center justify-center px-8 pb-16">
                    <div className="w-full max-w-sm">
                        {/* Tabs */}
                        <div className="flex gap-0 mb-8 border-b" style={{ borderColor: 'var(--border)' }}>
                            <button
                                onClick={() => setActiveTab("login")}
                                className="pb-3 px-1 mr-6 text-sm font-semibold transition-colors relative"
                                style={{
                                    color: activeTab === "login" ? 'var(--fg)' : 'var(--fg-faint)',
                                    borderBottom: activeTab === "login" ? '2px solid var(--fg)' : '2px solid transparent',
                                }}
                            >
                                Log in
                            </button>
                            <button
                                onClick={() => setActiveTab("signup")}
                                className="pb-3 px-1 text-sm font-semibold transition-colors relative"
                                style={{
                                    color: activeTab === "signup" ? 'var(--fg)' : 'var(--fg-faint)',
                                    borderBottom: activeTab === "signup" ? '2px solid var(--fg)' : '2px solid transparent',
                                }}
                            >
                                Sign up
                            </button>
                        </div>

                        <h2
                            className="text-2xl mb-2"
                            style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400 }}
                        >
                            {activeTab === "login" ? "Welcome back" : "Create an account"}
                        </h2>
                        <p className="text-sm mb-8" style={{ color: 'var(--fg-muted)' }}>
                            {activeTab === "login"
                                ? "Enter your credentials to access your workspace."
                                : "Start collaborating with your team in minutes."}
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {activeTab === "signup" && (
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--fg-muted)' }}>
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Your name"
                                        className="input-field"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--fg-muted)' }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div>
                                <label className="flex items-center justify-between text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--fg-muted)' }}>
                                    <span>Password</span>
                                    {activeTab === "login" && (
                                        <a href="#" className="normal-case tracking-normal font-medium" style={{ color: 'var(--fg-faint)', fontSize: '12px' }}>
                                            Forgot password?
                                        </a>
                                    )}
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="input-field"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !email.trim()}
                                className="btn-primary w-full mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="animate-spin">⟳</span>
                                        {activeTab === "login" ? "Signing in..." : "Creating account..."}
                                    </span>
                                ) : (
                                    activeTab === "login" ? "Sign in" : "Create account"
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-6">
                            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                            <span className="text-xs" style={{ color: 'var(--fg-faint)' }}>or continue with</span>
                            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                        </div>

                        {/* Social Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button className="btn-outline text-sm flex items-center justify-center gap-2 py-2.5">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                Google
                            </button>
                            <button className="btn-outline text-sm flex items-center justify-center gap-2 py-2.5">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                                GitHub
                            </button>
                        </div>

                        <p className="text-center text-xs mt-8" style={{ color: 'var(--fg-faint)' }}>
                            {activeTab === "login" ? (
                                <>Don&apos;t have an account? <button onClick={() => setActiveTab("signup")} className="font-semibold underline" style={{ color: 'var(--fg-muted)' }}>Sign up</button></>
                            ) : (
                                <>Already have an account? <button onClick={() => setActiveTab("login")} className="font-semibold underline" style={{ color: 'var(--fg-muted)' }}>Log in</button></>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
