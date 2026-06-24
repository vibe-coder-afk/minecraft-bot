import React, { useState, useEffect, useRef } from 'react';
import { Power, Terminal, MessageSquare, Users, Heart, Coffee, Compass, Moon, RotateCw } from 'lucide-react';
import ActionLoopManager from './ActionLoopManager';

function DashboardPage({
  status,
  config,
  botData,
  consoleLogs,
  chatLogs,
  isLoopRunning,
  currentLoopIndex,
  loopSteps,
  onDisconnect,
  onSendChat,
  onStartLoop,
  onStopLoop
}) {
  const [activeConsoleTab, setActiveConsoleTab] = useState('system'); // system, minecraft
  const [chatInput, setChatInput] = useState('');
  
  const consoleLogsContainerRef = useRef(null);

  const [autoScrollSystem, setAutoScrollSystem] = useState(true);
  const [autoScrollChat, setAutoScrollChat] = useState(true);

  const handleSystemScroll = (e) => {
    const container = e.currentTarget;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 50;
    setAutoScrollSystem(isAtBottom);
  };

  const handleChatScroll = (e) => {
    const container = e.currentTarget;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 50;
    setAutoScrollChat(isAtBottom);
  };

  // Auto scroll logs to bottom when new logs arrive (if auto-scroll is enabled)
  useEffect(() => {
    const container = consoleLogsContainerRef.current;
    if (container) {
      if (activeConsoleTab === 'system' && autoScrollSystem) {
        container.scrollTop = container.scrollHeight;
      } else if (activeConsoleTab === 'minecraft' && autoScrollChat) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [consoleLogs, chatLogs, autoScrollSystem, autoScrollChat, activeConsoleTab]);

  // When changing tabs, reset auto-scroll and jump to bottom
  useEffect(() => {
    setAutoScrollSystem(true);
    setAutoScrollChat(true);
    setTimeout(() => {
      if (consoleLogsContainerRef.current) {
        consoleLogsContainerRef.current.scrollTop = consoleLogsContainerRef.current.scrollHeight;
      }
    }, 50);
  }, [activeConsoleTab]);

  const handleSendChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput);
    setChatInput('');
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'spawned':
        return <span className="badge badge-success animate-pulse">Online</span>;
      case 'connecting':
        return <span className="badge badge-warning">Connecting</span>;
      default:
        return <span className="badge badge-danger">Offline</span>;
    }
  };

  const formatCoords = (pos) => {
    if (!pos) return 'X: 0, Y: 0, Z: 0';
    return `X: ${pos.x.toFixed(1)}, Y: ${pos.y.toFixed(1)}, Z: ${pos.z.toFixed(1)}`;
  };



  return (
    <div className="flex-1 flex flex-col min-h-screen p-4 md:p-6" style={{ zIndex: 1 }}>
      {/* Dynamic Background Glows */}
      <div className="absolute top-10 right-10 w-80 h-80 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: 'var(--accent-glow)', opacity: 0.1 }}></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: 'var(--accent-glow)', opacity: 0.1 }}></div>

      {/* Header Panel */}
      <header className="glass-panel p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--accent-color)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-bold shadow-[0_0_15px_var(--accent-glow)]">
            AFK
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-title">BOT CONTROL CENTER</h1>
              {getStatusBadge()}
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Connected to: <span className="text-white font-semibold">{config?.host}:{config?.port}</span> as <span className="text-[var(--accent-color)] font-bold">{config?.username}</span>
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center flex-wrap gap-3">


          <button
            onClick={onDisconnect}
            className="btn btn-danger py-2 px-3 text-xs flex items-center gap-1.5"
          >
            <Power size={14} /> Disconnect
          </button>
        </div>
      </header>

      {/* Grid Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
        {/* Left Side: Stats and Log Consoles */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Bot Metrics Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Health Stat */}
            <div className="glass-panel p-4 flex items-center gap-3">
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                <Heart size={20} fill={status === 'spawned' ? 'currentColor' : 'none'} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Health</span>
                <span className="text-sm font-extrabold text-white">
                  {status === 'spawned' && botData ? `${botData.health.toFixed(0)} / 20` : 'N/A'}
                </span>
                {status === 'spawned' && botData && (
                  <div className="w-20 bg-white/10 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: `${(botData.health / 20) * 100}%` }}></div>
                  </div>
                )}
              </div>
            </div>

            {/* Food Stat */}
            <div className="glass-panel p-4 flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
                <Coffee size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Food / Sat</span>
                <span className="text-sm font-extrabold text-white">
                  {status === 'spawned' && botData ? `${botData.food.toFixed(0)} / 20` : 'N/A'}
                </span>
                {status === 'spawned' && botData && (
                  <div className="w-20 bg-white/10 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(botData.food / 20) * 100}%` }}></div>
                  </div>
                )}
              </div>
            </div>

            {/* Location Coordinates */}
            <div className="glass-panel p-4 flex items-center gap-3 col-span-2">
              <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
                <Compass size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Coordinates</span>
                <span className="text-xs font-mono font-extrabold text-white truncate block mt-0.5">
                  {status === 'spawned' && botData ? formatCoords(botData.position) : 'Waiting for spawn...'}
                </span>
              </div>
            </div>
          </div>

          {/* Consoles Panel */}
          <div className="glass-panel console-panel">
            {/* Console Navigation */}
            <div className="flex border-b border-white/5 bg-black/10">
              <button
                onClick={() => setActiveConsoleTab('system')}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border-b-2 ${
                  activeConsoleTab === 'system'
                    ? 'border-[var(--accent-color)] text-white bg-white/5'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                <Terminal size={14} /> System Terminal
              </button>
              <button
                onClick={() => setActiveConsoleTab('minecraft')}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border-b-2 ${
                  activeConsoleTab === 'minecraft'
                    ? 'border-[var(--accent-color)] text-white bg-white/5'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                <MessageSquare size={14} /> Minecraft Chat
              </button>
            </div>

            {/* Console Log Contents */}
            <div 
              ref={consoleLogsContainerRef}
              className="console-logs-content"
              onScroll={activeConsoleTab === 'system' ? handleSystemScroll : handleChatScroll}
            >
              {activeConsoleTab === 'system' ? (
                <div className="space-y-1.5">
                  {consoleLogs.map((log, idx) => {
                    let color = 'text-[#94a3b8]';
                    if (log.type === 'success') color = 'text-[#10b981]';
                    else if (log.type === 'warning') color = 'text-[#f59e0b]';
                    else if (log.type === 'error') color = 'text-[#ef4444]';
                    else if (log.type === 'chat') color = 'text-[#06b6d4]';
                    
                    return (
                      <div key={idx} className="flex gap-2 items-start leading-relaxed">
                        <span className="text-[#64748b] select-none font-sans">[{log.timestamp}]</span>
                        <span className={color}>{log.message}</span>
                      </div>
                    );
                  })}
                  {consoleLogs.length === 0 && (
                    <div className="text-[var(--text-muted)] text-center mt-8">Console terminal is empty. Waiting for logs...</div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {chatLogs.map((chat, idx) => (
                    <div key={idx} className="flex gap-2 items-start leading-relaxed">
                      <span className="text-[#64748b] select-none font-sans">[{chat.timestamp}]</span>
                      <span className="text-[var(--accent-color)] font-bold font-sans">&lt;{chat.username}&gt;</span>
                      <span className="text-white">{chat.message}</span>
                    </div>
                  ))}
                  {chatLogs.length === 0 && (
                    <div className="text-[var(--text-muted)] text-center mt-8">No in-game messages captured yet.</div>
                  )}
                </div>
              )}
            </div>

            {/* Chat message input bar */}
            {activeConsoleTab === 'minecraft' && (
              <form onSubmit={handleSendChatSubmit} className="p-3 border-t border-white/5 bg-black/20 flex gap-2">
                <input
                  type="text"
                  placeholder={status === 'spawned' ? "Type a message to send to the server chat..." : "Connecting..."}
                  className="input-field flex-1"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={status !== 'spawned'}
                />
                <button
                  type="submit"
                  className="btn btn-primary px-4 py-2"
                  disabled={status !== 'spawned'}
                >
                  Send
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Routine Action Loops and Active Players */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Action Loop panel */}
          <div className="flex-1">
            <ActionLoopManager
              isLoopRunning={isLoopRunning}
              currentLoopIndex={currentLoopIndex}
              loopSteps={loopSteps}
              onStartLoop={onStartLoop}
              onStopLoop={onStopLoop}
            />
          </div>

          {/* Active Online Players List */}
          <div className="glass-panel p-4 flex flex-col max-h-[220px]">
            <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
              <Users size={16} className="text-[var(--accent-color)]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Online Players ({botData?.players?.length || 0})</h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {status === 'spawned' && botData?.players && botData.players.length > 0 ? (
                botData.players.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-white/5 transition-all">
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      {p.name}
                    </span>
                    <span className="text-[var(--text-muted)] font-mono">{p.ping}ms</span>
                  </div>
                ))
              ) : (
                <div className="text-[var(--text-muted)] text-xs text-center py-4">
                  {status === 'spawned' ? 'No other players online.' : 'Waiting for connection...'}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
