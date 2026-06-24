import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import HomePage from './components/HomePage';
import DashboardPage from './components/DashboardPage';

// Connect socket. Relative path works due to Vite proxy settings
const socket = io('/', {
  autoConnect: true,
  reconnection: true
});

function App() {
  const [status, setStatus] = useState('disconnected');
  const [config, setConfig] = useState(null);
  const [botData, setBotData] = useState(null);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [chatLogs, setChatLogs] = useState([]);
  const [isLoopRunning, setIsLoopRunning] = useState(false);
  const [currentLoopIndex, setCurrentLoopIndex] = useState(-1);
  const [loopSteps, setLoopSteps] = useState([]);


  useEffect(() => {
    // Socket event listeners
    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('initial_data', (data) => {
      setStatus(data.status);
      setConfig(data.config);
      setBotData(data.bot);
      setConsoleLogs(data.consoleLogs);
      setChatLogs(data.chatLogs);
      setIsLoopRunning(data.isLoopRunning);
      setCurrentLoopIndex(data.currentLoopIndex);
      setLoopSteps(data.loopSteps || []);
    });

    socket.on('status_update', (data) => {
      setStatus(data.status);
      setConfig(data.config);
      setBotData(data.bot);
      setIsLoopRunning(data.isLoopRunning);
      setCurrentLoopIndex(data.currentLoopIndex);
      if (data.loopSteps) setLoopSteps(data.loopSteps);
    });

    socket.on('console_log', (log) => {
      setConsoleLogs((prev) => {
        const next = [...prev, log];
        return next.length > 500 ? next.slice(1) : next;
      });
    });

    socket.on('chat_message', (chat) => {
      setChatLogs((prev) => {
        const next = [...prev, chat];
        return next.length > 200 ? next.slice(1) : next;
      });
    });

    return () => {
      socket.off('connect');
      socket.off('initial_data');
      socket.off('status_update');
      socket.off('console_log');
      socket.off('chat_message');
    };
  }, []);

  // UI action handlers
  const handleConnect = async (serverDetails) => {
    try {
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serverDetails)
      });
      const data = await response.json();
      if (!data.success) {
        alert(data.error || 'Failed to start connection sequence.');
      }
    } catch (err) {
      console.error('Error connecting:', err);
      alert('Could not reach backend API.');
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/disconnect', { method: 'POST' });
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  };

  const handleSendChat = async (message) => {
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
    } catch (err) {
      console.error('Error sending chat:', err);
    }
  };

  const handleStartLoop = async (steps) => {
    try {
      const response = await fetch('/api/loop/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps })
      });
      const data = await response.json();
      if (data.success) {
        setLoopSteps(steps);
      }
    } catch (err) {
      console.error('Error starting custom loop:', err);
    }
  };

  const handleStopLoop = async () => {
    try {
      await fetch('/api/loop/stop', { method: 'POST' });
    } catch (err) {
      console.error('Error stopping custom loop:', err);
    }
  };

  return (
    <div className="app-container min-h-screen flex flex-col">
      {status === 'disconnected' ? (
        <HomePage 
          onConnect={handleConnect} 
          lastConfig={config}
        />
      ) : (
        <DashboardPage 
          status={status}
          config={config}
          botData={botData}
          consoleLogs={consoleLogs}
          chatLogs={chatLogs}
          isLoopRunning={isLoopRunning}
          currentLoopIndex={currentLoopIndex}
          loopSteps={loopSteps}
          onDisconnect={handleDisconnect}
          onSendChat={handleSendChat}
          onStartLoop={handleStartLoop}
          onStopLoop={handleStopLoop}
        />
      )}
    </div>
  );
}

export default App;
