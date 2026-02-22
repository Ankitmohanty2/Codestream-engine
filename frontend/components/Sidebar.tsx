"use client";

import { User } from "@/hooks/useWebSocket";
import { useTheme } from "@/context/ThemeContext";

interface SidebarProps {
  users: User[];
  currentUserId: string;
  roomName: string;
  language: string;
  onRunCode: () => void;
  isRunning?: boolean;
  isConnected?: boolean;
}

export default function Sidebar({
  users,
  currentUserId,
  roomName,
  language,
  onRunCode,
  isRunning = false,
  isConnected = false,
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className="w-60 flex flex-col h-screen select-none text-sm"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        color: 'var(--sidebar-fg)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >
      <div
        className="flex items-center justify-between h-10 px-4 text-xs font-semibold shrink-0"
        style={{ borderBottom: '1px solid var(--sidebar-border)', color: '#999' }}
      >
        <span className="uppercase tracking-widest text-[10px]">Explorer</span>
        <button
          onClick={toggleTheme}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 transition-colors text-xs"
          title={`Switch to ${theme === "dark" ? "light" : "dark"}`}
        >
          {theme === "dark" ? "☀" : "🌙"}
        </button>
      </div>

      <div
        className="flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-wider font-bold shrink-0"
        style={{ color: '#bbb', borderBottom: '1px solid var(--sidebar-border)' }}
      >
        <span>📁</span>
        <span className="truncate">{roomName}</span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-2">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded text-[13px] cursor-default"
            style={{ backgroundColor: 'var(--sidebar-hover)', color: '#fff' }}
          >
            <span style={{ color: language === "python" ? "#4ec9b0" : "#569cd6" }}>
              {language === "python" ? "🐍" : "⚡"}
            </span>
            <span className="font-medium">{language === "python" ? "main.py" : "main.cpp"}</span>
          </div>
        </div>

        <div className="mt-6 px-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#888' }}>
              Collaborators
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#333', color: '#aaa' }}>
              {users.length}
            </span>
          </div>

          <div className="space-y-1">
            {users.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center gap-3 px-2 py-1.5 rounded transition-colors"
                style={{ cursor: 'default' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div className="relative shrink-0">
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border"
                    style={{ backgroundColor: '#4ec9b0', borderColor: 'var(--sidebar-bg)' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium truncate" style={{ color: '#ccc' }}>
                    {user.username}
                    {user.user_id === currentUserId && (
                      <span className="ml-1 text-[9px] font-bold" style={{ color: '#4ec9b0' }}>(you)</span>
                    )}
                  </p>
                  {user.cursor_position && (
                    <p className="text-[10px]" style={{ color: '#666' }}>
                      Ln {user.cursor_position.line}, Col {user.cursor_position.column}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-[11px] italic py-3 text-center" style={{ color: '#555' }}>
                No one else here yet
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 p-3 space-y-2" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <div className="flex items-center gap-2 px-2 py-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: isConnected ? '#4ec9b0' : '#ef4444' }}
          />
          <span className="text-[10px] font-medium" style={{ color: '#888' }}>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <button
          onClick={onRunCode}
          disabled={isRunning || !isConnected}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-bold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            backgroundColor: isRunning ? '#333' : '#4ec9b0',
            color: isRunning ? '#888' : '#1e1e1e',
          }}
        >
          {isRunning ? (
            <>
              <span className="animate-spin">⟳</span>
              <span>Running...</span>
            </>
          ) : (
            <>
              <span>▶</span>
              <span>Run Code</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-1 pt-1">
          <kbd className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: '#333', color: '#888', border: '1px solid #444' }}>Ctrl</kbd>
          <span className="text-[9px]" style={{ color: '#555' }}>+</span>
          <kbd className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: '#333', color: '#888', border: '1px solid #444' }}>Enter</kbd>
          <span className="text-[9px] ml-1" style={{ color: '#555' }}>to run</span>
        </div>
      </div>
    </div>
  );
}
