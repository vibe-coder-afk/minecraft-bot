import React, { useState } from 'react';
import { Play, Square, Plus, Trash2, ArrowUp, ArrowDown, Sparkles, HelpCircle } from 'lucide-react';

const PRESETS = {
  jiggle: [
    { type: 'move', direction: 'forward', duration: 300, delay: 1000 },
    { type: 'move', direction: 'back', duration: 300, delay: 1000 },
    { type: 'jump', delay: 1000 },
    { type: 'look', yaw: 1.57, pitch: 0, delay: 1500 },
    { type: 'look', yaw: 0, pitch: 0, delay: 1000 }
  ],
  squarePatrol: [
    { type: 'look', yaw: 0, pitch: 0, delay: 500 },
    { type: 'move', direction: 'forward', duration: 1000, delay: 500 },
    { type: 'look', yaw: 1.57, pitch: 0, delay: 500 },
    { type: 'move', direction: 'forward', duration: 1000, delay: 500 },
    { type: 'look', yaw: 3.14, pitch: 0, delay: 500 },
    { type: 'move', direction: 'forward', duration: 1000, delay: 500 },
    { type: 'look', yaw: 4.71, pitch: 0, delay: 500 },
    { type: 'move', direction: 'forward', duration: 1000, delay: 500 }
  ],
  chatPing: [
    { type: 'chat', message: 'Bot active keeping chunk loaded!', delay: 2000 },
    { type: 'wait', duration: 15000, delay: 1000 }
  ],
  combinedRoutine: [
    { type: 'combined' }
  ]
};

function ActionLoopManager({ isLoopRunning, currentLoopIndex, loopSteps, onStartLoop, onStopLoop }) {
  const [steps, setSteps] = useState(loopSteps.length > 0 ? loopSteps : PRESETS.jiggle);
  const [showHelp, setShowHelp] = useState(false);

  const addStep = (type) => {
    let newStep = { type, delay: 1000 };
    if (type === 'move') {
      newStep.direction = 'forward';
      newStep.duration = 1000;
    } else if (type === 'look') {
      newStep.yaw = 0;
      newStep.pitch = 0;
    } else if (type === 'chat') {
      newStep.message = 'Bot is active';
    } else if (type === 'wait') {
      newStep.duration = 2000;
    }
    setSteps([...steps, newStep]);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index, field, value) => {
    const updated = steps.map((step, i) => {
      if (i === index) {
        return { ...step, [field]: value };
      }
      return step;
    });
    setSteps(updated);
  };

  const moveStep = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;
    setSteps(newSteps);
  };

  const loadPreset = (presetName) => {
    if (PRESETS[presetName]) {
      setSteps(PRESETS[presetName]);
    }
  };

  const handleToggle = () => {
    if (isLoopRunning) {
      onStopLoop();
    } else {
      if (steps.length === 0) {
        alert('Please add at least one step to the loop.');
        return;
      }
      onStartLoop(steps);
    }
  };

  return (
    <div className="glass-panel p-6 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--accent-color)]" />
            Custom Action Loop
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Design automation scripts to prevent AFK kicks and mimic human actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 text-[var(--text-secondary)]"
            title="Help instructions"
          >
            <HelpCircle size={16} />
          </button>
          <button
            onClick={handleToggle}
            className={`btn ${isLoopRunning ? 'btn-danger' : 'btn-primary'} py-2 px-4`}
          >
            {isLoopRunning ? (
              <>
                <Square size={16} fill="white" /> Stop Routine
              </>
            ) : (
              <>
                <Play size={16} fill="white" /> Run Routine
              </>
            )}
          </button>
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="mb-4 p-4 rounded-lg bg-white/5 border border-white/10 text-xs space-y-2">
          <p className="font-bold text-white">How the action loop works:</p>
          <ul className="list-disc pl-4 space-y-1" style={{ color: 'var(--text-secondary)' }}>
            <li>The bot executes the steps sequentially from top to bottom.</li>
            <li>When the last step finishes, it automatically loops back to the first step.</li>
            <li><strong>Duration</strong> determines how long the action (like walking) is held.</li>
            <li><strong>Delay</strong> is the rest period *after* completing the action before starting the next step.</li>
          </ul>
        </div>
      )}

      {/* Presets Row */}
      <div className="mb-4 flex flex-wrap items-center gap-2 p-2 bg-black/20 rounded-lg border border-white/5">
        <span className="text-xs font-bold uppercase tracking-wider pl-1" style={{ color: 'var(--text-muted)' }}>Presets:</span>
        <button
          disabled={isLoopRunning}
          onClick={() => loadPreset('jiggle')}
          className="px-2.5 py-1 text-xs bg-white/5 border border-white/5 hover:bg-white/10 rounded text-white disabled:opacity-50"
        >
          Anti-AFK Jiggle
        </button>
        <button
          disabled={isLoopRunning}
          onClick={() => loadPreset('squarePatrol')}
          className="px-2.5 py-1 text-xs bg-white/5 border border-white/5 hover:bg-white/10 rounded text-white disabled:opacity-50"
        >
          Square Patrol
        </button>
        <button
          disabled={isLoopRunning}
          onClick={() => loadPreset('chatPing')}
          className="px-2.5 py-1 text-xs bg-white/5 border border-white/5 hover:bg-white/10 rounded text-white disabled:opacity-50"
        >
          Chat Pinger
        </button>
        <button
          disabled={isLoopRunning}
          onClick={() => loadPreset('combinedRoutine')}
          className="px-2.5 py-1 text-xs bg-white/5 border border-white/5 hover:bg-white/10 rounded text-white disabled:opacity-50"
        >
          Guard & Sleep (Combined)
        </button>
      </div>

      {/* Step List Container */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4" style={{ minHeight: '200px' }}>
        {steps.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-xl bg-black/10">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No steps added to the routine.</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Click one of the action buttons below to begin builder.</p>
          </div>
        ) : (
          steps.map((step, index) => {
            const isActive = isLoopRunning && currentLoopIndex === index;
            
            if (step.type === 'combined') {
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-all border-l-4 border-l-purple-500 ${
                    isActive
                      ? 'bg-white/10 border-[var(--accent-color)] shadow-[0_0_15px_rgba(255,255,255,0.05)] pulsing-glow'
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 flex items-center justify-center bg-black/40 text-[10px] font-bold rounded-full text-white">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        Guard & Sleep Routine
                      </span>
                      {isActive && (
                        <span className="badge badge-success text-[9px] px-1.5 py-0.5 animate-pulse">
                          Running
                        </span>
                      )}
                    </div>
                    {!isLoopRunning && (
                      <button
                        onClick={() => removeStep(index)}
                        className="p-1 rounded hover:bg-red-500/10 text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    • Patrols walking in a square layout.<br />
                    • Sends a chat message once every 15 minutes.<br />
                    • Auto-sleeps in the closest bed (within 32 blocks) during night.
                  </p>
                </div>
              );
            }

            let themeClass = 'border-l-4 border-l-slate-400';
            if (step.type === 'move') themeClass = 'border-l-4 border-l-emerald-500';
            else if (step.type === 'look') themeClass = 'border-l-4 border-l-sky-500';
            else if (step.type === 'chat') themeClass = 'border-l-4 border-l-purple-500';
            else if (step.type === 'jump') themeClass = 'border-l-4 border-l-pink-500';
            else if (step.type === 'wait') themeClass = 'border-l-4 border-l-amber-500';

            return (
              <div
                key={index}
                className={`p-3 rounded-lg border transition-all ${themeClass} ${
                  isActive
                    ? 'bg-white/10 border-[var(--accent-color)] shadow-[0_0_15px_rgba(255,255,255,0.05)] pulsing-glow'
                    : 'bg-white/5 border-white/5'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center bg-black/40 text-[10px] font-bold rounded-full text-white">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      {step.type}
                    </span>
                    {isActive && (
                      <span className="badge badge-success text-[9px] px-1.5 py-0.5 animate-pulse">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={isLoopRunning || index === 0}
                      onClick={() => moveStep(index, 'up')}
                      className="p-1 rounded hover:bg-white/5 text-[var(--text-secondary)] disabled:opacity-30"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      disabled={isLoopRunning || index === steps.length - 1}
                      onClick={() => moveStep(index, 'down')}
                      className="p-1 rounded hover:bg-white/5 text-[var(--text-secondary)] disabled:opacity-30"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button
                      disabled={isLoopRunning}
                      onClick={() => removeStep(index)}
                      className="p-1 rounded hover:bg-red-500/10 text-red-400 hover:text-red-300 disabled:opacity-30"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Step fields based on action type */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {step.type === 'move' && (
                    <>
                      <div className="flex flex-col space-y-1">
                        <span style={{ color: 'var(--text-muted)' }}>Direction:</span>
                        <select
                          disabled={isLoopRunning}
                          value={step.direction}
                          onChange={(e) => updateStep(index, 'direction', e.target.value)}
                          className="bg-black/40 border border-white/5 rounded px-2 py-1 text-white outline-none"
                        >
                          <option value="forward">Forward</option>
                          <option value="back">Backward</option>
                          <option value="left">Left</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span style={{ color: 'var(--text-muted)' }}>Duration (ms):</span>
                        <input
                          disabled={isLoopRunning}
                          type="number"
                          value={step.duration}
                          onChange={(e) => updateStep(index, 'duration', parseInt(e.target.value) || 0)}
                          className="bg-black/40 border border-white/5 rounded px-2 py-1 text-white outline-none"
                        />
                      </div>
                    </>
                  )}

                  {step.type === 'look' && (
                    <>
                      <div className="flex flex-col space-y-1">
                        <span style={{ color: 'var(--text-muted)' }}>Yaw (0-6.28):</span>
                        <input
                          disabled={isLoopRunning}
                          type="number"
                          step="0.1"
                          value={step.yaw}
                          onChange={(e) => updateStep(index, 'yaw', parseFloat(e.target.value) || 0)}
                          className="bg-black/40 border border-white/5 rounded px-2 py-1 text-white outline-none"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span style={{ color: 'var(--text-muted)' }}>Pitch (-1.5 to 1.5):</span>
                        <input
                          disabled={isLoopRunning}
                          type="number"
                          step="0.1"
                          value={step.pitch}
                          onChange={(e) => updateStep(index, 'pitch', parseFloat(e.target.value) || 0)}
                          className="bg-black/40 border border-white/5 rounded px-2 py-1 text-white outline-none"
                        />
                      </div>
                    </>
                  )}

                  {step.type === 'chat' && (
                    <div className="col-span-2 flex flex-col space-y-1">
                      <span style={{ color: 'var(--text-muted)' }}>Message:</span>
                      <input
                        disabled={isLoopRunning}
                        type="text"
                        value={step.message}
                        onChange={(e) => updateStep(index, 'message', e.target.value)}
                        className="bg-black/40 border border-white/5 rounded px-2 py-1 text-white outline-none w-full"
                      />
                    </div>
                  )}

                  {step.type === 'wait' && (
                    <div className="flex flex-col space-y-1">
                      <span style={{ color: 'var(--text-muted)' }}>Duration (ms):</span>
                      <input
                        disabled={isLoopRunning}
                        type="number"
                        value={step.duration}
                        onChange={(e) => updateStep(index, 'duration', parseInt(e.target.value) || 0)}
                        className="bg-black/40 border border-white/5 rounded px-2 py-1 text-white outline-none"
                      />
                    </div>
                  )}

                  {/* Rest Delay after action */}
                  {step.type !== 'wait' && (
                    <div className="flex flex-col space-y-1">
                      <span style={{ color: 'var(--text-muted)' }}>Post Delay (ms):</span>
                      <input
                        disabled={isLoopRunning}
                        type="number"
                        value={step.delay}
                        onChange={(e) => updateStep(index, 'delay', parseInt(e.target.value) || 0)}
                        className="bg-black/40 border border-white/5 rounded px-2 py-1 text-white outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Builder Toolbar */}
      <div className="border-t border-white/5 pt-4">
        <span className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>Add New Loop Step:</span>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <button
            disabled={isLoopRunning}
            onClick={() => addStep('move')}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded text-emerald-400 text-xs font-semibold disabled:opacity-50"
          >
            <Plus size={12} /> Walk
          </button>
          <button
            disabled={isLoopRunning}
            onClick={() => addStep('jump')}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500/20 rounded text-pink-400 text-xs font-semibold disabled:opacity-50"
          >
            <Plus size={12} /> Jump
          </button>
          <button
            disabled={isLoopRunning}
            onClick={() => addStep('look')}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 rounded text-sky-400 text-xs font-semibold disabled:opacity-50"
          >
            <Plus size={12} /> Look
          </button>
          <button
            disabled={isLoopRunning}
            onClick={() => addStep('chat')}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 rounded text-purple-400 text-xs font-semibold disabled:opacity-50"
          >
            <Plus size={12} /> Chat
          </button>
          <button
            disabled={isLoopRunning}
            onClick={() => addStep('wait')}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 rounded text-amber-400 text-xs font-semibold disabled:opacity-50"
          >
            <Plus size={12} /> Wait
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActionLoopManager;
