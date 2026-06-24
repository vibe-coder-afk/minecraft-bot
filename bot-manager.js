import mineflayer from 'mineflayer';

export class BotManager {
  constructor(io) {
    this.io = io;
    this.bot = null;
    this.config = null;
    this.status = 'disconnected'; // disconnected, connecting, spawned
    this.reconnectTimeout = null;
    this.shouldReconnect = false;
    this.reconnectAttempts = 0;
    this.chatLogs = [];
    this.consoleLogs = [];
    
    // Custom Loop configuration
    this.isLoopRunning = false;
    this.loopSteps = [];
    this.currentLoopIndex = -1;
    this.loopTimer = null;
    this.loopActionTimer = null;
  }

  log(message, type = 'info') {
    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type // info, success, warning, error, chat
    };
    this.consoleLogs.push(logEntry);
    if (this.consoleLogs.length > 500) this.consoleLogs.shift();
    
    this.io.emit('console_log', logEntry);
    console.log(`[${logEntry.type.toUpperCase()}] ${message}`);
  }

  emitStatus() {
    const botData = this.bot && this.status === 'spawned' ? {
      username: this.bot.username,
      health: this.bot.health,
      food: this.bot.food,
      position: this.bot.entity?.position || { x: 0, y: 0, z: 0 },
      players: Object.keys(this.bot.players).map(name => ({
        name,
        ping: this.bot.players[name].ping
      }))
    } : null;

    this.io.emit('status_update', {
      status: this.status,
      config: this.config ? {
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        version: this.config.version,
        auth: this.config.auth
      } : null,
      bot: botData,
      isLoopRunning: this.isLoopRunning,
      currentLoopIndex: this.currentLoopIndex,
      loopSteps: this.loopSteps
    });
  }

  connect(config) {
    if (this.bot) {
      this.disconnect();
    }

    this.config = config;
    this.shouldReconnect = true;
    this.status = 'connecting';
    this.emitStatus();
    this.log(`Connecting to ${config.host}:${config.port} as ${config.username}...`, 'info');

    try {
      this.bot = mineflayer.createBot({
        host: config.host,
        port: parseInt(config.port) || 25565,
        username: config.username,
        version: config.version || false, // false auto-detects
        auth: config.auth || 'offline'
      });

      this.setupEventHandlers();
    } catch (err) {
      this.log(`Failed to initiate bot creation: ${err.message}`, 'error');
      this.disconnect();
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this.stopCustomLoop();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.bot) {
      this.log('Disconnecting from server...', 'info');
      try {
        this.bot.quit();
      } catch (err) {
        // Ignore errors during quit
      }
      this.bot = null;
    }

    this.status = 'disconnected';
    this.reconnectAttempts = 0;
    this.emitStatus();
  }

  setupEventHandlers() {
    const bot = this.bot;

    bot.on('login', () => {
      this.log(`Logged in successfully! Spawning...`, 'success');
    });

    bot.on('spawn', () => {
      this.status = 'spawned';
      this.reconnectAttempts = 0;
      this.log(`Bot spawned in world!`, 'success');
      this.emitStatus();

      // Trigger custom loop if enabled
      if (this.isLoopRunning) {
        if (this.activeRoutine === 'combined') {
          this.runCombinedRoutine();
        } else if (this.loopSteps.length > 0) {
          this.runLoop(0);
        }
      }

      // Start periodic updates (every 2 seconds) to keep UI in sync
      this.startPeriodicUpdates();
    });

    bot.on('chat', (username, message) => {
      // Avoid circular processing if bot chats with itself
      if (username === bot.username) return;

      const chatEntry = {
        timestamp: new Date().toLocaleTimeString(),
        username,
        message
      };

      this.chatLogs.push(chatEntry);
      if (this.chatLogs.length > 200) this.chatLogs.shift();
      this.io.emit('chat_message', chatEntry);
      
      this.log(`[CHAT] <${username}> ${message}`, 'chat');

      // Simple triggers for owner
      if (this.config.owner && username === this.config.owner) {
        this.handleOwnerCommand(message);
      }
    });

    bot.on('health', () => {
      this.emitStatus();
    });

    bot.on('death', () => {
      this.log('Bot died! Attempting to auto-respawn...', 'warning');
      try {
        bot.respawn();
      } catch (err) {
        this.log(`Failed to auto-respawn: ${err.message}`, 'error');
      }
    });

    bot.on('kicked', (reason) => {
      const cleanReason = typeof reason === 'object' ? JSON.stringify(reason) : reason;
      this.log(`Kicked from server: ${cleanReason}`, 'warning');
    });

    bot.on('error', (err) => {
      this.log(`Connection error: ${err.message}`, 'error');
    });

    bot.on('end', () => {
      this.status = 'disconnected';
      this.stopPeriodicUpdates();
      this.emitStatus();
      this.log('Connection ended.', 'info');
      
      if (this.shouldReconnect) {
        this.handleReconnect();
      }
    });
  }

  handleReconnect() {
    if (!this.shouldReconnect) return;

    this.reconnectAttempts++;
    // Exponential backoff with a cap of 30 seconds
    const delay = Math.min(5000 * Math.pow(1.2, this.reconnectAttempts - 1), 30000);
    
    this.log(`Attempting reconnection in ${(delay / 1000).toFixed(1)}s (Attempt #${this.reconnectAttempts})...`, 'info');
    this.status = 'connecting';
    this.emitStatus();

    this.reconnectTimeout = setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect(this.config);
      }
    }, delay);
  }

  handleOwnerCommand(message) {
    if (message === '#come') {
      const ownerEntity = this.bot.players[this.config.owner]?.entity;
      if (ownerEntity) {
        this.log(`Moving to owner: ${this.config.owner}`, 'info');
        // mineflayer pathfinding could be integrated here, but we can do a direct look & step for simplicity
        const p = ownerEntity.position;
        this.bot.lookAt(p);
        this.bot.setControlState('forward', true);
        setTimeout(() => this.bot.setControlState('forward', false), 2000);
      } else {
        this.bot.chat(`I can't see you, ${this.config.owner}!`);
      }
    } else if (message === '#jump') {
      this.bot.setControlState('jump', true);
      setTimeout(() => this.bot.setControlState('jump', false), 250);
    } else if (message === '#status') {
      this.bot.chat(`Health: ${this.bot.health}/20, Food: ${this.bot.food}/20`);
    }
  }

  sendChat(message) {
    if (this.bot && this.status === 'spawned') {
      this.bot.chat(message);
      const chatEntry = {
        timestamp: new Date().toLocaleTimeString(),
        username: this.bot.username,
        message
      };
      this.chatLogs.push(chatEntry);
      this.io.emit('chat_message', chatEntry);
      this.log(`[CHAT] <${this.bot.username}> ${message}`, 'chat');
    } else {
      this.log('Cannot send chat: Bot is not connected.', 'error');
    }
  }

  startPeriodicUpdates() {
    this.stopPeriodicUpdates();
    this.periodicInterval = setInterval(() => {
      if (this.status === 'spawned') {
        this.emitStatus();
      }
    }, 2000);
  }

  stopPeriodicUpdates() {
    if (this.periodicInterval) {
      clearInterval(this.periodicInterval);
      this.periodicInterval = null;
    }
  }

  // --- CUSTOM LOOP SYSTEM ---

  startCustomLoop(steps) {
    this.loopSteps = steps;
    this.isLoopRunning = true;
    
    // Check if it's the combined routine preset
    if (steps.length === 1 && steps[0].type === 'combined') {
      this.activeRoutine = 'combined';
      this.lastChatPingTime = 0; // force immediate first ping
      this.combinedStepIndex = 0;
      this.log('Guard Routine started: Square Patrol + 15m Chat Pinger + Auto-Sleep at Night.', 'success');
      this.emitStatus();
      if (this.status === 'spawned') {
        this.runCombinedRoutine();
      }
      return;
    }

    this.activeRoutine = 'custom';
    this.log(`Custom routine loop started with ${steps.length} steps.`, 'success');
    this.emitStatus();
    
    if (this.status === 'spawned') {
      this.runLoop(0);
    }
  }

  stopCustomLoop() {
    this.isLoopRunning = false;
    this.activeRoutine = null;
    this.currentLoopIndex = -1;
    this.clearLoopTimers();

    if (this.bot && this.status === 'spawned') {
      // Reset all controls to safe state
      const controls = ['forward', 'back', 'left', 'right', 'jump', 'sneak', 'sprint'];
      controls.forEach(ctrl => {
        try {
          this.bot.setControlState(ctrl, false);
        } catch (e) {}
      });
    }

    this.log('Routine loop stopped.', 'info');
    this.emitStatus();
  }

  clearLoopTimers() {
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.loopActionTimer) {
      clearTimeout(this.loopActionTimer);
      this.loopActionTimer = null;
    }
  }

  async runLoop(index) {
    this.clearLoopTimers();
    if (!this.isLoopRunning || this.status !== 'spawned' || !this.bot) return;

    if (this.loopSteps.length === 0) {
      this.stopCustomLoop();
      return;
    }

    // Wrap around index
    if (index >= this.loopSteps.length) {
      index = 0;
    }

    this.currentLoopIndex = index;
    const step = this.loopSteps[index];
    this.emitStatus();

    this.log(`Executing step #${index + 1}: [${step.type.toUpperCase()}]`, 'info');

    try {
      switch (step.type) {
        case 'move': {
          const dir = step.direction || 'forward';
          const duration = parseInt(step.duration) || 1000;
          this.bot.setControlState(dir, true);
          
          this.loopActionTimer = setTimeout(() => {
            if (this.bot && this.status === 'spawned') {
              this.bot.setControlState(dir, false);
            }
            this.scheduleNextStep(index, step.delay || 1000);
          }, duration);
          break;
        }

        case 'jump': {
          this.bot.setControlState('jump', true);
          this.loopActionTimer = setTimeout(() => {
            if (this.bot && this.status === 'spawned') {
              this.bot.setControlState('jump', false);
            }
            this.scheduleNextStep(index, step.delay || 1000);
          }, 150);
          break;
        }

        case 'look': {
          // yaw is 0 to 2*PI, pitch is -PI/2 to PI/2
          const yaw = parseFloat(step.yaw) || 0;
          const pitch = parseFloat(step.pitch) || 0;
          this.bot.look(yaw, pitch, true); // true forces instant rotation
          this.scheduleNextStep(index, step.delay || 1000);
          break;
        }

        case 'chat': {
          const message = step.message || 'AFK Bot check';
          this.bot.chat(message);
          this.scheduleNextStep(index, step.delay || 1000);
          break;
        }

        case 'wait': {
          const duration = parseInt(step.duration) || 1000;
          this.scheduleNextStep(index, duration);
          break;
        }

        default:
          this.scheduleNextStep(index, 1000);
          break;
      }
    } catch (err) {
      this.log(`Error running step #${index + 1}: ${err.message}`, 'error');
      this.scheduleNextStep(index, 3000); // Wait longer on error
    }
  }

  scheduleNextStep(currentIndex, delay) {
    this.loopTimer = setTimeout(() => {
      this.runLoop(currentIndex + 1);
    }, delay);
  }

  // --- COMBINED GUARD ROUTINE ---
  async runCombinedRoutine() {
    this.clearLoopTimers();
    if (!this.isLoopRunning || this.activeRoutine !== 'combined' || this.status !== 'spawned' || !this.bot) return;

    try {
      // 1. Check Night time (Minecraft ticks: 12540 to 23460 represents sleep time)
      const timeOfDay = this.bot.time.timeOfDay;
      const isNight = timeOfDay >= 12540 && timeOfDay <= 23460;

      if (isNight && !this.bot.isSleeping) {
        this.log("It is night time. Pausing patrol to search for closest bed...", "warning");
        const bed = this.bot.findBlock({
          matching: block => block.name.includes('bed'),
          maxDistance: 32
        });

        if (bed) {
          try {
            // Find an adjacent air block to stand on instead of standing directly on the bed block
            let standPosition = bed.position.offset(1, 0, 0);
            const offsets = [
              [1, 0, 0],
              [-1, 0, 0],
              [0, 0, 1],
              [0, 0, -1]
            ];
            for (const [dx, dy, dz] of offsets) {
              const adjBlock = this.bot.blockAt(bed.position.offset(dx, dy, dz));
              if (adjBlock && (adjBlock.name === 'air' || adjBlock.name.includes('cave_air') || adjBlock.name.includes('void_air'))) {
                standPosition = bed.position.offset(dx, dy, dz);
                break;
              }
            }

            // Walk to the stand position next to the bed
            await this.walkTo(standPosition);
            
            // Wait 500ms to settle physics
            await new Promise(r => setTimeout(r, 500));
            
            // Look directly at the bed block
            await this.bot.lookAt(bed.position.offset(0.5, 0.5, 0.5), true);
            
            // Wait another 200ms
            await new Promise(r => setTimeout(r, 200));

            // Activate the bed block directly (bypassing Mineflayer's strict time check)
            await this.bot.activateBlock(bed);
            this.log("Clicking bed block... waiting for sleep confirmation...", "info");
            
            // Wait to see if the bot goes to sleep
            await new Promise((resolve) => {
              const sleepHandler = () => {
                this.log("Bot went to sleep successfully! Waiting for sunrise...", "success");
                
                const wakeHandler = () => {
                  this.log("Sunrise! Bot woke up.", "success");
                  this.bot.off('wake', wakeHandler);
                  resolve();
                };
                this.bot.once('wake', wakeHandler);
              };

              this.bot.once('sleep', sleepHandler);

              // If the bot doesn't sleep within 2.5 seconds, continue patrol
              setTimeout(() => {
                this.bot.off('sleep', sleepHandler);
                resolve();
              }, 2500);
            });
          } catch (err) {
            this.log(`Sleep attempt failed: ${err.message}`, "error");
          }
        } else {
          this.log("No beds found within 32 blocks. Continuing square patrol.", "warning");
        }
      }

      // Re-verify conditions
      if (!this.isLoopRunning || this.activeRoutine !== 'combined' || this.status !== 'spawned' || !this.bot) return;

      // 2. Check 15-Minute Chat Ping
      const now = Date.now();
      if (now - this.lastChatPingTime >= 15 * 60 * 1000) {
        this.lastChatPingTime = now;
        this.bot.chat("[AFK Bot] Patrolling & monitoring server. Keeping chunk active!");
        this.log("Sent 15-minute routine chat message.", "success");
      }

      // 3. Perform Square Patrol Step
      const yaws = [0, 1.57, 3.14, 4.71];
      const directions = ['North', 'East', 'South', 'West'];
      const currentYaw = yaws[this.combinedStepIndex];

      this.log(`Patrolling: Walking ${directions[this.combinedStepIndex]}...`, "info");
      this.bot.look(currentYaw, 0, true);
      this.bot.setControlState('forward', true);

      await new Promise((resolve) => {
        this.loopActionTimer = setTimeout(() => {
          if (this.bot && this.status === 'spawned') {
            this.bot.setControlState('forward', false);
          }
          resolve();
        }, 1500); // walk for 1.5 seconds
      });

      this.combinedStepIndex = (this.combinedStepIndex + 1) % 4;

      // Schedule next corner in 2.5 seconds
      this.loopTimer = setTimeout(() => {
        this.runCombinedRoutine();
      }, 2500);

    } catch (err) {
      this.log(`Error in combined patrol routine: ${err.message}`, "error");
      this.loopTimer = setTimeout(() => {
        this.runCombinedRoutine();
      }, 5000);
    }
  }

  // Simple direct walk-to function
  async walkTo(position) {
    return new Promise((resolve, reject) => {
      if (!this.bot || this.status !== 'spawned') return reject(new Error('Bot not spawned'));

      this.log(`Walking toward coordinates: X:${position.x.toFixed(1)}, Z:${position.z.toFixed(1)}`, 'info');

      const checkInterval = setInterval(() => {
        if (!this.bot || this.status !== 'spawned') {
          clearInterval(checkInterval);
          return reject(new Error('Bot disconnected during walk'));
        }

        const p = this.bot.entity.position;
        const dx = position.x - p.x;
        const dz = position.z - p.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance <= 2.2) { // Stand close to target
          clearInterval(checkInterval);
          this.bot.setControlState('forward', false);
          resolve();
        } else {
          // Turn toward the target coordinate and walk forward
          this.bot.lookAt(position.offset(0.5, 0.5, 0.5), true);
          this.bot.setControlState('forward', true);
        }
      }, 100);

      // Safety timeout after 15 seconds to prevent path block lockups
      setTimeout(() => {
        clearInterval(checkInterval);
        if (this.bot && this.status === 'spawned') {
          this.bot.setControlState('forward', false);
        }
        resolve();
      }, 15000);
    });
  }
}
