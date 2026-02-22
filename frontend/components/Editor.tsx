"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as diffMatchPatch from "diff-match-patch";
import { useTheme } from "@/context/ThemeContext";

interface EditorProps {
  code: string;
  language: string;
  onChange: (code: string, diff: string, version: number) => void;
  onCursorChange: (position: { line: number; column: number }, selection?: any) => void;
  remoteCursors: Map<string, { line: number; column: number; color: string; username: string }>;
  readOnly?: boolean;
}

export default function CollaborativeEditor({
  code,
  language,
  onChange,
  onCursorChange,
  remoteCursors,
  readOnly = false,
}: EditorProps) {
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const dmpRef = useRef<any>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    dmpRef.current = new diffMatchPatch.diff_match_patch();
  }, []);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);

    editor.onDidChangeCursorPosition((e: any) => {
      onCursorChange({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });
  };

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (!value || !dmpRef.current || !editorRef.current) return;
      const oldCode = code;
      const newCode = value;
      const diff = dmpRef.current.diff_main(oldCode, newCode);
      dmpRef.current.diff_cleanupSemantic(diff);
      const diffText = dmpRef.current.diff_toPatch(diff);
      onChange(newCode, diffText, 1);
    },
    [code, onChange]
  );

  useEffect(() => {
    if (!isEditorReady || !monacoRef.current || !editorRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const decorations = editor.getModel()?.getAllDecorations() || [];
    const decorationIds = decorations
      .filter((d: any) => d.options.className?.startsWith("remote-cursor"))
      .map((d: any) => d.id);
    editor.deltaDecorations(decorationIds, []);
    const newDecorations: any[] = [];
    remoteCursors.forEach((cursor) => {
      newDecorations.push({
        range: new monaco.Range(cursor.line, cursor.column, cursor.line, cursor.column + 1),
        options: {
          className: `remote-cursor`,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });
      newDecorations.push({
        range: new monaco.Range(cursor.line, cursor.column, cursor.line, cursor.column),
        options: {
          before: {
            content: cursor.username,
            backgroundColor: cursor.color,
            color: "#fff",
            inlineClassName: "remote-cursor-label",
          },
        },
      });
    });
    editor.deltaDecorations([], newDecorations);
  }, [remoteCursors, isEditorReady]);

  const getLang = (l: string) => (l === "python" ? "python" : l === "cpp" ? "cpp" : "plaintext");

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center h-9 shrink-0 text-[12px]"
        style={{ backgroundColor: '#2d2d2d', borderBottom: '1px solid #404040' }}
      >
        <div
          className="flex items-center gap-2 px-4 h-full font-medium"
          style={{ backgroundColor: '#1e1e1e', color: '#fff', borderRight: '1px solid #404040' }}
        >
          <span style={{ color: language === "python" ? "#4ec9b0" : "#569cd6", fontSize: '11px' }}>
            {language === "python" ? "🐍" : "⚡"}
          </span>
          <span>{language === "python" ? "script.py" : "main.cpp"}</span>
          <span className="ml-2 text-[10px]" style={{ color: '#666' }}>×</span>
        </div>
        <div className="flex items-center px-3 h-full" style={{ color: '#777' }}>+</div>
      </div>

      <div
        className="flex items-center gap-1.5 px-4 h-7 shrink-0 text-[11px]"
        style={{ backgroundColor: '#1e1e1e', borderBottom: '1px solid #333', color: '#888' }}
      >
        <span>📁 workspace</span>
        <span style={{ color: '#555' }}>›</span>
        <span style={{ color: '#ccc' }}>{language === "python" ? "script.py" : "main.cpp"}</span>
      </div>

      <div className="flex-1" style={{ backgroundColor: '#1e1e1e' }}>
        <Editor
          height="100%"
          language={getLang(language)}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
            lineNumbers: "on",
            lineNumbersMinChars: 4,
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 8,
            renderLineHighlight: "all",
            scrollbar: {
              vertical: "visible",
              horizontal: "visible",
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: "off",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
            fontLigatures: true,
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true, indentation: true },
          }}
        />
      </div>
    </div>
  );
}
