"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import * as diffMatchPatch from "diff-match-patch";
import { Toaster, toast } from "react-hot-toast";

import CollaborativeEditor from "@/components/Editor";
import Terminal from "@/components/Terminal";
import Sidebar from "@/components/Sidebar";
import { useWebSocket, User } from "@/hooks/useWebSocket";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [userId] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("codestream_user_id");
      if (stored) return stored;
      const newId = uuidv4();
      localStorage.setItem("codestream_user_id", newId);
      return newId;
    }
    return uuidv4();
  });

  const [username] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("codestream_username");
      if (stored) return stored;
      const names = ["Anonymous", "Guest", "Coder", "Developer"];
      const randomName = `${names[Math.floor(Math.random() * names.length)]}_${Math.floor(Math.random() * 1000)}`;
      localStorage.setItem("codestream_username", randomName);
      return randomName;
    }
    return "Anonymous";
  });

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [version, setVersion] = useState(1);
  const [roomName, setRoomName] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [executionTime, setExecutionTime] = useState<number>();
  const [isRunning, setIsRunning] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState<
    Map<string, { line: number; column: number; color: string; username: string }>
  >(new Map());

  const dmpRef = useRef(new diffMatchPatch.diff_match_patch());
  const codeRef = useRef(code);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => { codeRef.current = code; }, [code]);

  const handleSync = useCallback(
    (syncedCode: string, syncedVersion: number, syncedLanguage: string) => {
      setCode(syncedCode);
      setVersion(syncedVersion);
      setLanguage(syncedLanguage);
    }, []
  );

  const handleCodeUpdate = useCallback(
    (diff: string, _userId: string, newVersion: number) => {
      const patches = dmpRef.current.diff_fromPatchList(JSON.parse(diff));
      const [newCode] = dmpRef.current.patch_apply(patches as any, codeRef.current);
      setCode(newCode);
      setVersion(newVersion);
    }, []
  );

  const handleCursorUpdate = useCallback((user: User) => {
    setRemoteCursors((prev) => {
      const newMap = new Map(prev);
      if (user.cursor_position) {
        newMap.set(user.user_id, {
          line: user.cursor_position.line,
          column: user.cursor_position.column,
          color: user.color,
          username: user.username,
        });
      } else {
        newMap.delete(user.user_id);
      }
      return newMap;
    });
  }, []);

  const handleUserJoin = useCallback((user: User) => {
    toast.success(`${user.username} joined the room`, { icon: "👋", duration: 3000 });
  }, []);

  const handleUserLeave = useCallback((userId: string) => {
    setRemoteCursors((prev) => {
      const newMap = new Map(prev);
      newMap.delete(userId);
      return newMap;
    });
  }, []);

  const handleExecutionResult = useCallback(
    (result: { output: string; error: string; execution_time: number }) => {
      setOutput(result.output);
      setError(result.error || "");
      setExecutionTime(result.execution_time);
      setIsRunning(false);
    }, []
  );

  const { isConnected, sendDiff, sendCursor, runCode, users } = useWebSocket({
    roomId, userId, username,
    onSync: handleSync,
    onCodeUpdate: handleCodeUpdate,
    onCursorUpdate: handleCursorUpdate,
    onUserJoin: handleUserJoin,
    onUserLeave: handleUserLeave,
    onExecutionResult: handleExecutionResult,
  });

  const handleCodeChange = useCallback(
    (newCode: string, diff: string, newVersion: number) => {
      setCode(newCode);
      setVersion(newVersion);
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = setTimeout(() => { sendDiff(diff, version); }, 50);
    }, [sendDiff, version]
  );

  const handleCursorChange = useCallback(
    (position: { line: number; column: number }, selection?: any) => {
      sendCursor(position, selection);
    }, [sendCursor]
  );

  const handleRunCode = useCallback(() => {
    setIsRunning(true);
    setOutput("");
    setError("");
    runCode(code, language);
  }, [code, language, runCode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunCode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRunCode]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#1e1e1e' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { backgroundColor: '#333', color: '#fff', borderRadius: '8px', fontSize: '13px' },
        }}
      />

      <Sidebar
        users={users}
        currentUserId={userId}
        roomName={roomName || `Room ${roomId.slice(0, 8)}`}
        language={language}
        onRunCode={handleRunCode}
        isRunning={isRunning}
        isConnected={isConnected}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 min-h-0">
          <CollaborativeEditor
            code={code}
            language={language}
            onChange={handleCodeChange}
            onCursorChange={handleCursorChange}
            remoteCursors={remoteCursors}
          />
        </div>

        <div className="h-56 shrink-0">
          <Terminal
            output={output}
            error={error}
            executionTime={executionTime}
            isRunning={isRunning}
            onClear={() => {
              setOutput("");
              setError("");
              setExecutionTime(undefined);
            }}
          />
        </div>
      </div>
    </div>
  );
}
