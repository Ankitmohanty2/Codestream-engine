"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface User {
  user_id: string;
  username: string;
  color: string;
  cursor_position?: { line: number; column: number };
  selection?: { startLine: number; startColumn: number; endLine: number; endColumn: number };
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

export interface UseWebSocketOptions {
  roomId: string;
  userId: string;
  username: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onUserJoin?: (user: User) => void;
  onUserLeave?: (userId: string) => void;
  onCursorUpdate?: (user: User) => void;
  onCodeUpdate?: (diff: string, userId: string, version: number) => void;
  onSync?: (code: string, version: number, language: string) => void;
  onExecutionResult?: (result: { output: string; error: string; execution_time: number }) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (type: string, payload: any) => void;
  sendDiff: (diff: string, version: number) => void;
  sendCursor: (position: { line: number; column: number }, selection?: any) => void;
  runCode: (code: string, language: string, input?: string) => void;
  users: User[];
  currentVersion: number;
}

export function useWebSocket({
  roomId,
  userId,
  username,
  onMessage,
  onConnect,
  onDisconnect,
  onUserJoin,
  onUserLeave,
  onCursorUpdate,
  onCodeUpdate,
  onSync,
  onExecutionResult,
  reconnectInterval = 3000,
  maxReconnectAttempts = 10,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentVersion, setCurrentVersion] = useState(1);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"}/ws/${roomId}?user_id=${userId}&username=${encodeURIComponent(username)}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      reconnectAttempts.current = 0;
      onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case "room_state":
          case "sync":
            const payload = message.payload;
            if (payload.code !== undefined) {
              setCurrentVersion(payload.version || 1);
              onSync?.(payload.code, payload.version || 1, payload.language || "python");
            }
            if (payload.users) {
              setUsers(payload.users);
            }
            break;

          case "users_update":
            setUsers(message.payload.users);
            break;

          case "user_joined":
            onUserJoin?.(message.payload);
            break;

          case "user_left":
            onUserLeave?.(message.payload.user_id);
            break;

          case "cursor":
            onCursorUpdate?.(message.payload);
            break;

          case "diff":
            onCodeUpdate?.(message.payload.diff, message.payload.user_id, message.payload.version);
            break;

          case "execution_result":
            onExecutionResult?.(message.payload);
            break;

          case "ack":
            setCurrentVersion(message.payload.version);
            break;
        }

        onMessage?.(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      onDisconnect?.();

      // Attempt reconnection
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current += 1;
        console.log(`Reconnecting... Attempt ${reconnectAttempts.current}`);
        reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }, [roomId, userId, username, onMessage, onConnect, onDisconnect, onUserJoin, onUserLeave, onCursorUpdate, onCodeUpdate, onSync, onExecutionResult, reconnectInterval, maxReconnectAttempts]);

  const sendMessage = useCallback((type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const sendDiff = useCallback((diff: string, version: number) => {
    sendMessage("diff", { diff, version });
  }, [sendMessage]);

  const sendCursor = useCallback((position: { line: number; column: number }, selection?: any) => {
    sendMessage("cursor", { position, selection });
  }, [sendMessage]);

  const runCode = useCallback((code: string, language: string, input?: string) => {
    sendMessage("run", { code, language, input: input || "" });
  }, [sendMessage]);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    sendMessage,
    sendDiff,
    sendCursor,
    runCode,
    users,
    currentVersion,
  };
}
