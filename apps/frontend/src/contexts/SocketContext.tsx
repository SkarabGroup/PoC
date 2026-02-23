import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

interface AnalysisUpdate {
  analysisId: string;
  repositoryId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  message?: string;
  report?: any;
  error?: string;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  onAnalysisStarted: (callback: (data: AnalysisUpdate) => void) => void;
  onAnalysisCompleted: (callback: (data: AnalysisUpdate) => void) => void;
  onAnalysisFailed: (callback: (data: AnalysisUpdate) => void) => void;
  offAnalysisStarted: (callback: (data: AnalysisUpdate) => void) => void;
  offAnalysisCompleted: (callback: (data: AnalysisUpdate) => void) => void;
  offAnalysisFailed: (callback: (data: AnalysisUpdate) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(WS_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const onAnalysisStarted = (callback: (data: AnalysisUpdate) => void) => {
    if (socket) {
      socket.on('analysis:started', callback);
    }
  };

  const onAnalysisCompleted = (callback: (data: AnalysisUpdate) => void) => {
    if (socket) {
      socket.on('analysis:completed', callback);
    }
  };

  const onAnalysisFailed = (callback: (data: AnalysisUpdate) => void) => {
    if (socket) {
      socket.on('analysis:failed', callback);
    }
  };

  const offAnalysisStarted = (callback: (data: AnalysisUpdate) => void) => {
    if (socket) {
      socket.off('analysis:started', callback);
    }
  };

  const offAnalysisCompleted = (callback: (data: AnalysisUpdate) => void) => {
    if (socket) {
      socket.off('analysis:completed', callback);
    }
  };

  const offAnalysisFailed = (callback: (data: AnalysisUpdate) => void) => {
    if (socket) {
      socket.off('analysis:failed', callback);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        onAnalysisStarted,
        onAnalysisCompleted,
        onAnalysisFailed,
        offAnalysisStarted,
        offAnalysisCompleted,
        offAnalysisFailed,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
