import React, { useState, useEffect } from 'react';
import { Bot, Server, Shield, User, Settings } from 'lucide-react';

function HomePage({ onConnect, lastConfig }) {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('25565');
  const [username, setUsername] = useState('AFK_Bot');
  const [versionOption, setVersionOption] = useState('1.20.2');
  const [customVersion, setCustomVersion] = useState('');
  const [auth, setAuth] = useState('offline');
  const [owner, setOwner] = useState('');

  // Pre-fill with last config if available
  useEffect(() => {
    if (lastConfig) {
      if (lastConfig.host) setHost(lastConfig.host);
      if (lastConfig.port) setPort(lastConfig.port.toString());
      if (lastConfig.username) setUsername(lastConfig.username);
      if (lastConfig.auth) setAuth(lastConfig.auth);
      if (lastConfig.owner) setOwner(lastConfig.owner);
      
      if (lastConfig.version !== undefined) {
        const standardVersions = ['', '1.21.1', '1.21', '1.20.6', '1.20.4', '1.20.2', '1.20.1', '1.19.4', '1.19.2', '1.18.2'];
        if (standardVersions.includes(lastConfig.version)) {
          setVersionOption(lastConfig.version);
        } else {
          setVersionOption('custom');
          setCustomVersion(lastConfig.version);
        }
      }
    }
  }, [lastConfig]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!host.trim()) {
      alert('Please enter a server IP / host.');
      return;
    }
    if (!username.trim()) {
      alert('Please enter a bot username.');
      return;
    }
    const finalVersion = versionOption === 'custom' ? customVersion.trim() : versionOption;
    onConnect({ host, port, username, version: finalVersion, auth, owner });
  };



  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-screen" style={{ zIndex: 1 }}>
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: 'var(--accent-glow)', opacity: 0.15, transform: 'translate(-50%, -50%)' }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: 'var(--accent-glow)', opacity: 0.15, transform: 'translate(50%, 50%)' }}></div>

      <div className="w-full max-w-lg glass-panel p-8 pulsing-glow relative overflow-hidden">
        {/* Title Header */}
        <div className="flex flex-col items-center text-center mb-8 relative">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-4 animate-bounce-slow">
            <Bot size={40} className="text-white" style={{ color: 'var(--accent-color)', filter: 'drop-shadow(0 0 8px var(--accent-color))' }} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 font-title">
            <span className="text-gradient">MINECRAFT AFK PORTAL</span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Deploy persistent bots to keep your Aternos chunks loaded 24/7.
          </p>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Server IP */}
            <div className="flex flex-col space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Server size={14} /> Server IP / Host
              </label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="e.g. myserver.aternos.me"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                required
              />
            </div>

            {/* Server Port */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Settings size={14} /> Port
              </label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="25565"
                value={port}
                onChange={(e) => setPort(e.target.value)}
              />
            </div>

            {/* Minecraft Version */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Settings size={14} /> MC Version
              </label>
              <select
                className="input-field w-full"
                value={versionOption}
                onChange={(e) => setVersionOption(e.target.value)}
              >
                <option value="">Auto-detect version (Recommended)</option>
                <option value="1.21.1">1.21.1</option>
                <option value="1.21">1.21</option>
                <option value="1.20.6">1.20.6</option>
                <option value="1.20.4">1.20.4</option>
                <option value="1.20.2">1.20.2</option>
                <option value="1.20.1">1.20.1</option>
                <option value="1.19.4">1.19.4</option>
                <option value="1.19.2">1.19.2</option>
                <option value="1.18.2">1.18.2</option>
                <option value="custom">Custom version...</option>
              </select>
              {versionOption === 'custom' && (
                <input
                  type="text"
                  className="input-field w-full mt-2"
                  placeholder="e.g. 1.20.2"
                  value={customVersion}
                  onChange={(e) => setCustomVersion(e.target.value)}
                  required
                />
              )}
            </div>

            {/* Bot Name */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <User size={14} /> Bot Username
              </label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="AFK_Bot"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Auth Mode */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Shield size={14} /> Auth Mode
              </label>
              <select
                className="input-field w-full"
                style={{ backgroundColor: '#13112b' }}
                value={auth}
                onChange={(e) => setAuth(e.target.value)}
              >
                <option value="offline">Offline (Cracked)</option>
                <option value="microsoft">Microsoft (Premium)</option>
              </select>
            </div>

            {/* Bot Owner command trigger (optional) */}
            <div className="flex flex-col space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <User size={14} /> Owner Username (Optional)
              </label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="Your Minecraft username to control bot in-game"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
              />
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Let's you run in-game commands like #come and #jump</span>
            </div>
          </div>

          {/* Connect Button */}
          <button type="submit" className="btn btn-primary w-full py-3.5 mt-4 text-base tracking-wide uppercase">
            Deploy Bot to Server
          </button>
        </form>


      </div>
    </div>
  );
}

export default HomePage;
