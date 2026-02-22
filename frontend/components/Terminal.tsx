"use client";

import { useEffect, useRef } from "react";

interface TerminalProps {
  output: string;
  error?: string;
  executionTime?: number;
  isRunning?: boolean;
  onClear?: () => void;
}

export default function Terminal({
  output,
  error,
  executionTime,
  isRunning = false,
  onClear,
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output, error]);

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: 'var(--terminal-bg)', borderTop: '1px solid var(--sidebar-border)' }}
    >
      <div
        className="flex items-center justify-between h-9 px-4 shrink-0"
        style={{ borderBottom: '1px solid #333', backgroundColor: '#252526' }}
      >
        <div className="flex items-center gap-0 h-full">
          <button className="px-3 h-full text-[11px] font-semibold" style={{ color: '#fff', borderBottom: '2px solid #4ec9b0' }}>
            TERMINAL
          </button>
          <button className="px-3 h-full text-[11px] font-medium" style={{ color: '#888' }}>
            OUTPUT
          </button>
          <button className="px-3 h-full text-[11px] font-medium" style={{ color: '#888' }}>
            PROBLEMS
          </button>
        </div>

        <div className="flex items-center gap-3">
          {executionTime !== undefined && (
            <span className="text-[10px] font-mono" style={{ color: '#4ec9b0' }}>
              {executionTime.toFixed(3)}s
            </span>
          )}
          {isRunning && (
            <span className="text-[10px] flex items-center gap-1.5" style={{ color: '#dcdcaa' }}>
              <span className="animate-spin">⟳</span> Running
            </span>
          )}
          {onClear && (
            <button
              onClick={onClear}
              className="text-[10px] font-medium hover:opacity-100 transition-opacity"
              style={{ color: '#888' }}
            >
              Clear
            </button>
          )}
          <button className="text-xs" style={{ color: '#888' }}>×</button>
        </div>
      </div>

      <div
        ref={terminalRef}
        className="flex-1 p-4 overflow-auto font-mono text-[13px] leading-6"
        style={{ color: 'var(--terminal-fg)' }}
      >
        {isRunning && !output && !error && (
          <div style={{ color: '#888' }}>
            <span className="animate-pulse">▌</span> Executing...
          </div>
        )}

        {output && (
          <pre className="whitespace-pre-wrap" style={{ color: '#d4d4d4' }}>{output}</pre>
        )}

        {error && (
          <pre className="whitespace-pre-wrap" style={{ color: '#f14c4c' }}>{error}</pre>
        )}

        {!output && !error && !isRunning && (
          <div style={{ color: '#555' }}>
            <span style={{ color: '#4ec9b0' }}>$</span> Ready for execution
            <span className="animate-pulse ml-0.5">▌</span>
          </div>
        )}
      </div>
    </div>
  );
}
