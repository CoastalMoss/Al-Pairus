/**
 * AL-PAIRUS - RPG Real-Time Stat Tracker
 * Client logic, P2P/Cloud state synchronization, and UI controllers.
 */

(() => {
  'use strict';

  // --- AUDIO SYNTHESIZER (Web Audio API - No external asset dependency) ---
  class SoundFX {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playClick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    }

    playDamage() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    }

    playHeal() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    }

    playToxicity() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      // Bubble / hiss
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(360, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    }

    playTurnEnd() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      // Deep resonant gong
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc2.type = 'sine';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.8);
      osc2.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(218, this.ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc2.start();
      osc.stop(this.ctx.currentTime + 0.8);
      osc2.stop(this.ctx.currentTime + 0.8);
    }
  }

  const sfx = new SoundFX();

  // --- DEFAULT STATE ---
  const DEFAULT_STATE = {
    players: {
      player1: {
        name: 'Kassandra',
        hp: 8,
        maxHp: 8,
        toxicity: 0,
        turnCount: 1,
        lastUpdated: Date.now()
      },
      player2: {
        name: 'Yoru',
        hp: 7,
        maxHp: 7,
        toxicity: 0,
        turnCount: 1,
        lastUpdated: Date.now()
      }
    },
    mobs: [],
    logs: [
      { id: '1', text: 'Campaign initialized. A dark wind blows.', type: 'system', time: new Date().toLocaleTimeString() }
    ],
    gmPin: '1234',
    version: 1
  };

  // --- APPLICATION CONTROLLER ---
  class AlPairusApp {
    constructor() {
      this.roomId = 'realm-of-shadows';
      this.currentRole = null; // 'player1' | 'player2' | 'gm'
      this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      
      // Sync Layer
      this.peer = null;
      this.peerConnections = [];
      this.broadcastChannel = null;
      this.syncProvider = 'p2p';
      this.fbDbUrl = '';
      
      // DOM Elements
      this.dom = {};
    }

    init() {
      this.cacheDom();
      this.bindEvents();
      this.parseUrlParams();
      this.initBroadcastChannel();
      this.renderVials(0);
      this.updateSyncBadge('local', 'Ready');
    }

    cacheDom() {
      this.dom = {
        // Views
        lobbyView: document.getElementById('lobbyView'),
        playerView: document.getElementById('playerView'),
        gmView: document.getElementById('gmView'),
        
        // Header
        syncStatusBadge: document.getElementById('syncStatusBadge'),
        syncStatusText: document.getElementById('syncStatusText'),
        displayRoomId: document.getElementById('displayRoomId'),
        copyShareBtn: document.getElementById('copyShareBtn'),
        soundToggleBtn: document.getElementById('soundToggleBtn'),
        switchRoleBtn: document.getElementById('switchRoleBtn'),
        settingsBtn: document.getElementById('settingsBtn'),

        // Lobby
        roomInput: document.getElementById('roomInput'),
        randomRoomBtn: document.getElementById('randomRoomBtn'),
        roleCards: document.querySelectorAll('.role-card'),
        gmPinContainer: document.getElementById('gmPinContainer'),
        gmPinInput: document.getElementById('gmPinInput'),
        confirmGmBtn: document.getElementById('confirmGmBtn'),
        lobbyP1Name: document.getElementById('lobbyP1Name'),
        lobbyP2Name: document.getElementById('lobbyP2Name'),

        // Player View
        playerCharName: document.getElementById('playerCharName'),
        renameCharBtn: document.getElementById('renameCharBtn'),
        playerTurnCount: document.getElementById('playerTurnCount'),
        playerHpCurrent: document.getElementById('playerHpCurrent'),
        playerHpMax: document.getElementById('playerHpMax'),
        playerHpBar: document.getElementById('playerHpBar'),
        playerHpPercent: document.getElementById('playerHpPercent'),
        editMaxHpBtn: document.getElementById('editMaxHpBtn'),
        hpCustomAmount: document.getElementById('hpCustomAmount'),
        dealDamageBtn: document.getElementById('dealDamageBtn'),
        applyHealBtn: document.getElementById('applyHealBtn'),
        playerToxCurrent: document.getElementById('playerToxCurrent'),
        playerVialsContainer: document.getElementById('playerVialsContainer'),
        decToxBtn: document.getElementById('decToxBtn'),
        incToxBtn: document.getElementById('incToxBtn'),
        maxToxBtn: document.getElementById('maxToxBtn'),
        purgeToxBtn: document.getElementById('purgeToxBtn'),
        endTurnBtn: document.getElementById('endTurnBtn'),
        playerCombatLog: document.getElementById('playerCombatLog'),
        clearPlayerLogBtn: document.getElementById('clearPlayerLogBtn'),

        // GM View
        gmPartyCount: document.getElementById('gmPartyCount'),
        gmMobCount: document.getElementById('gmMobCount'),
        gmResetPartyBtn: document.getElementById('gmResetPartyBtn'),
        gmP1Name: document.getElementById('gmP1Name'),
        gmP1Turn: document.getElementById('gmP1Turn'),
        gmP1HpLabel: document.getElementById('gmP1HpLabel'),
        gmP1HpBar: document.getElementById('gmP1HpBar'),
        gmP1ToxLabel: document.getElementById('gmP1ToxLabel'),
        gmP1ToxBar: document.getElementById('gmP1ToxBar'),
        gmP2Name: document.getElementById('gmP2Name'),
        gmP2Turn: document.getElementById('gmP2Turn'),
        gmP2HpLabel: document.getElementById('gmP2HpLabel'),
        gmP2HpBar: document.getElementById('gmP2HpBar'),
        gmP2ToxLabel: document.getElementById('gmP2ToxLabel'),
        gmP2ToxBar: document.getElementById('gmP2ToxBar'),
        openAddMobModalBtn: document.getElementById('openAddMobModalBtn'),
        gmMobsList: document.getElementById('gmMobsList'),
        emptyMobsState: document.getElementById('emptyMobsState'),
        gmCombatLog: document.getElementById('gmCombatLog'),
        clearGmLogBtn: document.getElementById('clearGmLogBtn'),

        // Modals
        mobModal: document.getElementById('mobModal'),
        closeMobModalBtn: document.getElementById('closeMobModalBtn'),
        cancelMobModalBtn: document.getElementById('cancelMobModalBtn'),
        confirmAddMobBtn: document.getElementById('confirmAddMobBtn'),
        mobNameInput: document.getElementById('mobNameInput'),
        mobHpInput: document.getElementById('mobHpInput'),
        mobCurrentHpInput: document.getElementById('mobCurrentHpInput'),

        editCharModal: document.getElementById('editCharModal'),
        closeCharModalBtn: document.getElementById('closeCharModalBtn'),
        cancelCharModalBtn: document.getElementById('cancelCharModalBtn'),
        saveCharBtn: document.getElementById('saveCharBtn'),
        charNameInput: document.getElementById('charNameInput'),
        charMaxHpInput: document.getElementById('charMaxHpInput'),

        settingsModal: document.getElementById('settingsModal'),
        closeSettingsModalBtn: document.getElementById('closeSettingsModalBtn'),
        saveSettingsBtn: document.getElementById('saveSettingsBtn'),
        firebaseConfigBox: document.getElementById('firebaseConfigBox'),
        fbDbUrl: document.getElementById('fbDbUrl'),
        newGmPinInput: document.getElementById('newGmPinInput'),
        saveGmPinBtn: document.getElementById('saveGmPinBtn')
      };
    }

    bindEvents() {
      // Room & Header
      this.dom.randomRoomBtn.addEventListener('click', () => {
        const adjectives = ['grim', 'shadow', 'cursed', 'ancient', 'iron', 'blood', 'frost'];
        const nouns = ['keep', 'realm', 'vault', 'covenant', 'spire', 'crypt', 'citadel'];
        const num = Math.floor(100 + Math.random() * 900);
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        this.dom.roomInput.value = `${adj}-${noun}-${num}`;
        sfx.playClick();
      });

      this.dom.copyShareBtn.addEventListener('click', () => this.copyShareLink());
      this.dom.soundToggleBtn.addEventListener('click', () => this.toggleSound());
      this.dom.switchRoleBtn.addEventListener('click', () => this.showLobby());
      this.dom.settingsBtn.addEventListener('click', () => this.openSettingsModal());

      // Role Selection in Lobby
      this.dom.roleCards.forEach(card => {
        card.addEventListener('click', () => {
          const role = card.dataset.role;
          sfx.playClick();
          if (role === 'gm') {
            this.dom.gmPinContainer.classList.remove('hidden');
            this.dom.gmPinInput.focus();
            this.dom.roleCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
          } else {
            this.dom.gmPinContainer.classList.add('hidden');
            this.selectRole(role);
          }
        });
      });

      this.dom.confirmGmBtn.addEventListener('click', () => {
        const enteredPin = this.dom.gmPinInput.value.trim();
        if (enteredPin === this.state.gmPin) {
          sfx.playClick();
          this.selectRole('gm');
        } else {
          sfx.playDamage();
          alert('Incorrect GM Passcode! Default is 1234.');
          this.dom.gmPinInput.select();
        }
      });

      this.dom.gmPinInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.dom.confirmGmBtn.click();
        }
      });

      // Player Controls: HP Quick Chips
      document.querySelectorAll('.adjust-chip').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const delta = parseInt(e.target.dataset.delta, 10);
          this.modifyPlayerHp(this.currentRole, delta);
        });
      });

      // Player Controls: Custom Damage / Heal
      this.dom.dealDamageBtn.addEventListener('click', () => {
        const amount = parseInt(this.dom.hpCustomAmount.value, 10) || 0;
        if (amount > 0) this.modifyPlayerHp(this.currentRole, -amount);
      });

      this.dom.applyHealBtn.addEventListener('click', () => {
        const amount = parseInt(this.dom.hpCustomAmount.value, 10) || 0;
        if (amount > 0) this.modifyPlayerHp(this.currentRole, amount);
      });

      // Player Controls: Toxicity
      this.dom.incToxBtn.addEventListener('click', () => this.modifyPlayerTox(this.currentRole, 1));
      this.dom.decToxBtn.addEventListener('click', () => this.modifyPlayerTox(this.currentRole, -1));
      this.dom.maxToxBtn.addEventListener('click', () => this.setPlayerTox(this.currentRole, 10));
      this.dom.purgeToxBtn.addEventListener('click', () => this.setPlayerTox(this.currentRole, 0));

      // Player Controls: END TURN (-2 TOX)
      this.dom.endTurnBtn.addEventListener('click', () => this.handleEndTurn());

      // Player Controls: Name / Max HP Edit
      this.dom.renameCharBtn.addEventListener('click', () => this.openEditCharModal());
      this.dom.editMaxHpBtn.addEventListener('click', () => this.openEditCharModal());
      this.dom.closeCharModalBtn.addEventListener('click', () => this.closeModal(this.dom.editCharModal));
      this.dom.cancelCharModalBtn.addEventListener('click', () => this.closeModal(this.dom.editCharModal));
      this.dom.saveCharBtn.addEventListener('click', () => this.saveCharChanges());

      // Log Clears
      this.dom.clearPlayerLogBtn.addEventListener('click', () => {
        this.dom.playerCombatLog.innerHTML = '<li class="log-entry system-entry">Log cleared.</li>';
      });
      this.dom.clearGmLogBtn.addEventListener('click', () => {
        this.state.logs = [];
        this.renderCombatLogs();
        this.broadcastState();
      });

      // GM Controls: Overrides on Player Cards
      document.querySelectorAll('.gm-chip').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget.dataset.target;
          const action = e.currentTarget.dataset.action;
          const val = parseInt(e.currentTarget.dataset.val, 10);

          if (action === 'hp') {
            this.modifyPlayerHp(target, val, true);
          } else if (action === 'tox') {
            if (val === 0) {
              this.setPlayerTox(target, 0, true);
            } else {
              this.modifyPlayerTox(target, val, true);
            }
          } else if (action === 'custom-hp') {
            const current = this.state.players[target];
            const newMax = prompt(`Enter new Max HP for ${current.name}:`, current.maxHp);
            if (newMax && !isNaN(parseInt(newMax, 10))) {
              current.maxHp = Math.max(1, parseInt(newMax, 10));
              current.hp = Math.min(current.hp, current.maxHp);
              this.addLog(`${current.name}'s Max HP updated to ${current.maxHp} by GM.`, 'gm');
              this.render();
              this.broadcastState();
            }
          }
        });
      });

      // GM Controls: Reset Session Round
      this.dom.gmResetPartyBtn.addEventListener('click', () => {
        if (confirm('Reset player turns and purge toxicity for a new encounter round?')) {
          for (let role of ['player1', 'player2']) {
            this.state.players[role].toxicity = 0;
            this.state.players[role].turnCount = 1;
          }
          this.addLog('Encounter round reset by Federico (GM).', 'gm');
          sfx.playTurnEnd();
          this.render();
          this.broadcastState();
        }
      });

      // GM Controls: Mob Spawning Modal
      this.dom.openAddMobModalBtn.addEventListener('click', () => this.openMobModal());
      this.dom.closeMobModalBtn.addEventListener('click', () => this.closeModal(this.dom.mobModal));
      this.dom.cancelMobModalBtn.addEventListener('click', () => this.closeModal(this.dom.mobModal));
      this.dom.confirmAddMobBtn.addEventListener('click', () => this.handleAddMob());

      // Quick Mob Preset Buttons
      document.querySelectorAll('.quick-template-row .btn-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
          this.dom.mobNameInput.value = e.target.dataset.preset;
          this.dom.mobHpInput.value = e.target.dataset.hp;
          this.dom.mobCurrentHpInput.value = e.target.dataset.hp;
          sfx.playClick();
        });
      });

      // Settings Modal
      this.dom.closeSettingsModalBtn.addEventListener('click', () => this.closeModal(this.dom.settingsModal));
      this.dom.saveSettingsBtn.addEventListener('click', () => this.closeModal(this.dom.settingsModal));
      this.dom.saveGmPinBtn.addEventListener('click', () => {
        const newPin = this.dom.newGmPinInput.value.trim();
        if (newPin.length >= 4) {
          this.state.gmPin = newPin;
          this.saveStateToLocal();
          alert('GM PIN updated successfully!');
          this.dom.newGmPinInput.value = '';
        } else {
          alert('PIN must be at least 4 characters.');
        }
      });

      // Sync Mode Switcher
      document.querySelectorAll('input[name="syncProvider"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
          this.syncProvider = e.target.value;
          if (this.syncProvider === 'firebase') {
            this.dom.firebaseConfigBox.classList.remove('hidden');
          } else {
            this.dom.firebaseConfigBox.classList.add('hidden');
          }
        });
      });
    }

    parseUrlParams() {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      const urlRole = params.get('role');

      if (urlRoom) {
        this.roomId = urlRoom;
        this.dom.roomInput.value = urlRoom;
      }
      this.dom.displayRoomId.textContent = this.roomId;

      this.loadStateFromLocal();

      if (urlRole && ['player1', 'player2', 'gm'].includes(urlRole)) {
        if (urlRole === 'gm') {
          // Keep at lobby for PIN
          this.dom.gmPinContainer.classList.remove('hidden');
          this.dom.roleCards.forEach(c => {
            if (c.dataset.role === 'gm') c.classList.add('selected');
          });
        } else {
          this.selectRole(urlRole);
        }
      }
    }

    selectRole(role) {
      this.currentRole = role;
      this.roomId = this.dom.roomInput.value.trim() || 'realm-of-shadows';
      this.dom.displayRoomId.textContent = this.roomId;

      // Update URL query string without reloading
      const newUrl = `${window.location.pathname}?room=${encodeURIComponent(this.roomId)}&role=${role}`;
      window.history.replaceState({}, '', newUrl);

      // Start Networking
      this.connectPeerSync();

      // Render view
      if (role === 'gm') {
        this.showGmView();
      } else {
        this.showPlayerView();
      }
      this.render();
    }

    showLobby() {
      this.dom.lobbyView.classList.add('active-view');
      this.dom.playerView.classList.remove('active-view');
      this.dom.gmView.classList.remove('active-view');
      this.currentRole = null;
    }

    showPlayerView() {
      this.dom.lobbyView.classList.remove('active-view');
      this.dom.playerView.classList.add('active-view');
      this.dom.gmView.classList.remove('active-view');
    }

    showGmView() {
      this.dom.lobbyView.classList.remove('active-view');
      this.dom.playerView.classList.remove('active-view');
      this.dom.gmView.classList.add('active-view');
    }

    // --- RENDER METHODS ---
    render() {
      this.renderPlayerView();
      this.renderGmView();
      this.renderCombatLogs();
      this.saveStateToLocal();
    }

    renderPlayerView() {
      if (!this.currentRole || this.currentRole === 'gm') return;

      const player = this.state.players[this.currentRole];
      if (!player) return;

      this.dom.playerCharName.textContent = player.name;
      this.dom.playerTurnCount.textContent = player.turnCount;

      // Health
      this.dom.playerHpCurrent.textContent = player.hp;
      this.dom.playerHpMax.textContent = player.maxHp;
      const hpPercent = Math.max(0, Math.min(100, Math.round((player.hp / player.maxHp) * 100)));
      this.dom.playerHpBar.style.width = `${hpPercent}%`;
      this.dom.playerHpPercent.textContent = `${hpPercent}%`;

      if (hpPercent <= 25) {
        this.dom.playerHpBar.classList.add('critical');
      } else {
        this.dom.playerHpBar.classList.remove('critical');
      }

      // Toxicity
      this.dom.playerToxCurrent.textContent = player.toxicity;
      this.renderVials(player.toxicity);
    }

    renderVials(currentTox) {
      const container = this.dom.playerVialsContainer;
      container.innerHTML = '';

      for (let i = 1; i <= 10; i++) {
        const slot = document.createElement('div');
        slot.className = 'vial-slot';
        slot.title = `Toxicity Level ${i}`;
        
        if (i <= currentTox) {
          slot.classList.add('filled');
          if (i >= 9) {
            slot.classList.add('max-tox');
          } else if (i >= 6) {
            slot.classList.add('high-tox');
          }
        }

        const liquid = document.createElement('div');
        liquid.className = 'vial-liquid';

        const num = document.createElement('div');
        num.className = 'vial-number';
        num.textContent = i;

        slot.appendChild(liquid);
        slot.appendChild(num);

        // Click on vial directly to set toxicity level
        slot.addEventListener('click', () => {
          if (this.currentRole && this.currentRole !== 'gm') {
            this.setPlayerTox(this.currentRole, i);
          }
        });

        container.appendChild(slot);
      }
    }

    renderGmView() {
      // Player 1
      const p1 = this.state.players.player1;
      this.dom.gmP1Name.textContent = p1.name;
      this.dom.gmP1Turn.textContent = `Turn ${p1.turnCount}`;
      this.dom.gmP1HpLabel.textContent = `${p1.hp} / ${p1.maxHp}`;
      const p1HpPct = Math.max(0, Math.min(100, Math.round((p1.hp / p1.maxHp) * 100)));
      this.dom.gmP1HpBar.style.width = `${p1HpPct}%`;
      this.dom.gmP1ToxLabel.textContent = `${p1.toxicity} / 10`;
      this.dom.gmP1ToxBar.style.width = `${p1.toxicity * 10}%`;

      // Giuseppe (Player 2)
      const p2 = this.state.players.player2;
      this.dom.gmP2Name.textContent = p2.name;
      this.dom.gmP2Turn.textContent = `Turn ${p2.turnCount}`;
      this.dom.gmP2HpLabel.textContent = `${p2.hp} / ${p2.maxHp}`;
      const p2HpPct = Math.max(0, Math.min(100, Math.round((p2.hp / p2.maxHp) * 100)));
      this.dom.gmP2HpBar.style.width = `${p2HpPct}%`;
      this.dom.gmP2ToxLabel.textContent = `${p2.toxicity} / 10`;
      this.dom.gmP2ToxBar.style.width = `${p2.toxicity * 10}%`;

      // Mobs
      this.renderMobs();
    }

    renderMobs() {
      const container = this.dom.gmMobsList;
      const emptyState = this.dom.emptyMobsState;
      const countPill = this.dom.gmMobCount;

      countPill.textContent = `${this.state.mobs.length} Active`;

      if (this.state.mobs.length === 0) {
        emptyState.classList.remove('hidden');
        container.innerHTML = '';
        return;
      }

      emptyState.classList.add('hidden');
      container.innerHTML = '';

      this.state.mobs.forEach(mob => {
        const card = document.createElement('div');
        card.className = 'mob-card';
        card.id = `mob-${mob.id}`;

        const hpPct = Math.max(0, Math.min(100, Math.round((mob.hp / mob.maxHp) * 100)));

        card.innerHTML = `
          <div class="mob-header">
            <div class="mob-title-area">
              <span class="mob-icon">👹</span>
              <span class="mob-name">${escapeHtml(mob.name)}</span>
            </div>
            <button class="mob-delete-btn" title="Dismiss Creature">&times;</button>
          </div>
          <div class="mob-hp-stats">
            <span>Health</span>
            <span class="mob-hp-val">${mob.hp} / ${mob.maxHp} (${hpPct}%)</span>
          </div>
          <div class="meter-track health-track small">
            <div class="meter-fill health-fill" style="width: ${hpPct}%;"></div>
          </div>
          <div class="mob-quick-controls">
            <button class="mob-chip dmg" data-delta="-5">-5</button>
            <button class="mob-chip dmg" data-delta="-1">-1</button>
            <button class="mob-chip heal" data-delta="+1">+1</button>
            <button class="mob-chip heal" data-delta="+5">+5</button>
            <button class="mob-chip defeat">Defeat</button>
          </div>
        `;

        // Controls
        card.querySelector('.mob-delete-btn').addEventListener('click', () => {
          this.removeMob(mob.id);
        });

        card.querySelector('.mob-chip.defeat').addEventListener('click', () => {
          this.modifyMobHp(mob.id, -mob.hp);
        });

        card.querySelectorAll('.mob-chip.dmg, .mob-chip.heal').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const delta = parseInt(e.target.dataset.delta, 10);
            this.modifyMobHp(mob.id, delta);
          });
        });

        container.appendChild(card);
      });
    }

    renderCombatLogs() {
      const renderTo = (container) => {
        if (!container) return;
        container.innerHTML = '';
        const recentLogs = this.state.logs.slice(-25).reverse();
        recentLogs.forEach(log => {
          const li = document.createElement('li');
          li.className = `log-entry ${log.type}-entry`;
          li.textContent = `[${log.time}] ${log.text}`;
          container.appendChild(li);
        });
      };

      renderTo(this.dom.playerCombatLog);
      renderTo(this.dom.gmCombatLog);
    }

    // --- GAMEPLAY ACTIONS ---
    handleEndTurn() {
      if (!this.currentRole || this.currentRole === 'gm') return;

      const player = this.state.players[this.currentRole];
      const prevTox = player.toxicity;
      player.toxicity = Math.max(0, player.toxicity - 2);
      player.turnCount += 1;
      player.lastUpdated = Date.now();

      const toxReduced = prevTox - player.toxicity;
      this.spawnFloatingText(`-2 TOX`, 'tox');
      this.spawnFloatingText(`Turn ${player.turnCount}`, 'heal');
      sfx.playTurnEnd();

      this.addLog(`${player.name} ended their turn. Toxicity reduced by ${toxReduced} (now ${player.toxicity}/10). Turn #${player.turnCount} begun.`, 'turn');
      this.render();
      this.broadcastState();
    }

    modifyPlayerHp(role, delta, fromGm = false) {
      const player = this.state.players[role];
      if (!player) return;

      const oldHp = player.hp;
      player.hp = Math.max(0, Math.min(player.maxHp, player.hp + delta));
      player.lastUpdated = Date.now();

      if (delta < 0) {
        sfx.playDamage();
        this.spawnFloatingText(`${delta} HP`, 'damage');
        this.addLog(`${player.name} took ${Math.abs(delta)} damage (now ${player.hp}/${player.maxHp})${fromGm ? ' [by GM]' : ''}.`, 'damage');
      } else {
        sfx.playHeal();
        this.spawnFloatingText(`+${delta} HP`, 'heal');
        this.addLog(`${player.name} healed +${delta} HP (now ${player.hp}/${player.maxHp})${fromGm ? ' [by GM]' : ''}.`, 'heal');
      }

      this.render();
      this.broadcastState();
    }

    modifyPlayerTox(role, delta, fromGm = false) {
      const player = this.state.players[role];
      if (!player) return;

      player.toxicity = Math.max(0, Math.min(10, player.toxicity + delta));
      player.lastUpdated = Date.now();
      sfx.playToxicity();
      this.spawnFloatingText(`${delta > 0 ? '+' : ''}${delta} TOX`, 'tox');
      this.addLog(`${player.name}'s Toxicity changed by ${delta > 0 ? '+' : ''}${delta} (now ${player.toxicity}/10)${fromGm ? ' [by GM]' : ''}.`, 'turn');

      this.render();
      this.broadcastState();
    }

    setPlayerTox(role, val, fromGm = false) {
      const player = this.state.players[role];
      if (!player) return;

      player.toxicity = Math.max(0, Math.min(10, val));
      player.lastUpdated = Date.now();
      sfx.playToxicity();
      this.spawnFloatingText(`TOX: ${val}`, 'tox');
      this.addLog(`${player.name}'s Toxicity set to ${val}/10${fromGm ? ' [by GM]' : ''}.`, 'turn');

      this.render();
      this.broadcastState();
    }

    handleAddMob() {
      const name = this.dom.mobNameInput.value.trim() || 'Fell Beast';
      const maxHp = parseInt(this.dom.mobHpInput.value, 10) || 20;
      const hp = Math.min(maxHp, parseInt(this.dom.mobCurrentHpInput.value, 10) || maxHp);

      const newMob = {
        id: 'mob_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name,
        hp,
        maxHp
      };

      this.state.mobs.push(newMob);
      this.addLog(`Federico spawned "${name}" with ${hp}/${maxHp} HP.`, 'gm');
      sfx.playClick();

      this.closeModal(this.dom.mobModal);
      this.renderMobs();
      this.broadcastState();
    }

    modifyMobHp(mobId, delta) {
      const mob = this.state.mobs.find(m => m.id === mobId);
      if (!mob) return;

      mob.hp = Math.max(0, Math.min(mob.maxHp, mob.hp + delta));

      if (delta < 0) {
        sfx.playDamage();
        this.addLog(`"${mob.name}" took ${Math.abs(delta)} damage (now ${mob.hp}/${mob.maxHp}).`, 'damage');
      } else {
        sfx.playHeal();
        this.addLog(`"${mob.name}" healed +${delta} HP (now ${mob.hp}/${mob.maxHp}).`, 'heal');
      }

      if (mob.hp <= 0) {
        this.addLog(`"${mob.name}" has been slain in combat! 💀`, 'damage');
      }

      this.renderMobs();
      this.broadcastState();
    }

    removeMob(mobId) {
      const idx = this.state.mobs.findIndex(m => m.id === mobId);
      if (idx !== -1) {
        const removed = this.state.mobs.splice(idx, 1)[0];
        this.addLog(`"${removed.name}" removed from encounter.`, 'gm');
        sfx.playClick();
        this.renderMobs();
        this.broadcastState();
      }
    }

    // --- CHARACTER MODAL ---
    openEditCharModal() {
      if (!this.currentRole || this.currentRole === 'gm') return;
      const player = this.state.players[this.currentRole];
      this.dom.charNameInput.value = player.name;
      this.dom.charMaxHpInput.value = player.maxHp;
      this.openModal(this.dom.editCharModal);
    }

    saveCharChanges() {
      if (!this.currentRole || this.currentRole === 'gm') return;
      const player = this.state.players[this.currentRole];
      const newName = this.dom.charNameInput.value.trim();
      const newMaxHp = parseInt(this.dom.charMaxHpInput.value, 10);

      if (newName) player.name = newName;
      if (newMaxHp && newMaxHp > 0) {
        player.maxHp = newMaxHp;
        player.hp = Math.min(player.hp, player.maxHp);
      }
      player.lastUpdated = Date.now();

      this.addLog(`${player.name} updated character stats.`, 'system');
      this.closeModal(this.dom.editCharModal);
      this.render();
      this.broadcastState();
    }

    openMobModal() {
      this.dom.mobNameInput.value = '';
      this.dom.mobHpInput.value = 20;
      this.dom.mobCurrentHpInput.value = 20;
      this.openModal(this.dom.mobModal);
    }

    openSettingsModal() {
      this.openModal(this.dom.settingsModal);
    }

    openModal(modal) {
      modal.classList.remove('hidden');
      sfx.playClick();
    }

    closeModal(modal) {
      modal.classList.add('hidden');
    }

    // --- VISUAL FX & LOGS ---
    spawnFloatingText(text, type) {
      const el = document.createElement('div');
      el.className = `floating-combat-text ${type}`;
      el.textContent = text;
      
      const x = window.innerWidth / 2 + (Math.random() * 80 - 40);
      const y = window.innerHeight / 2 + (Math.random() * 60 - 30);
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;

      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }

    addLog(text, type = 'system') {
      const entry = {
        id: Date.now() + Math.random().toString(),
        text,
        type,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      this.state.logs.push(entry);
      if (this.state.logs.length > 50) this.state.logs.shift();
    }

    toggleSound() {
      sfx.enabled = !sfx.enabled;
      this.dom.soundToggleBtn.textContent = sfx.enabled ? '🔊' : '🔇';
      if (sfx.enabled) sfx.playClick();
    }

    copyShareLink() {
      const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(this.roomId)}`;
      navigator.clipboard.writeText(url).then(() => {
        const originalText = this.dom.copyShareBtn.textContent;
        this.dom.copyShareBtn.textContent = '✅ Copied!';
        sfx.playClick();
        setTimeout(() => this.dom.copyShareBtn.textContent = originalText, 2000);
      }).catch(() => {
        prompt('Copy this campaign room link to share with players:', url);
      });
    }

    // --- REAL-TIME SYNCHRONIZATION (PeerJS WebRTC Mesh + BroadcastChannel) ---
    initBroadcastChannel() {
      try {
        if ('BroadcastChannel' in window) {
          this.broadcastChannel = new BroadcastChannel(`alpairus_${this.roomId}`);
          this.broadcastChannel.onmessage = (event) => {
            if (event.data && event.data.type === 'STATE_UPDATE') {
              this.mergeRemoteState(event.data.payload);
            }
          };
        }
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    connectPeerSync() {
      this.updateSyncBadge('connecting', 'Connecting...');

      // Clean old peer if exists
      if (this.peer) {
        try { this.peer.destroy(); } catch (e) {}
      }

      // Consistent room-scoped Peer IDs for the 3 roles
      const normalizedRoom = this.roomId.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const myPeerId = `alpairus-${normalizedRoom}-${this.currentRole}`;

      try {
        // Use PeerJS public cloud signaling server
        this.peer = new Peer(myPeerId, {
          debug: 1
        });

        this.peer.on('open', (id) => {
          this.updateSyncBadge('online', 'P2P Live (WebRTC)');
          this.connectToOtherRoles(normalizedRoom);
        });

        this.peer.on('connection', (conn) => {
          this.setupConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.warn('PeerJS note:', err.type);
          if (err.type === 'unavailable-id') {
            // Role ID already claimed by another browser tab/user, generate unique suffix
            const altId = `${myPeerId}-${Math.floor(Math.random() * 1000)}`;
            this.peer = new Peer(altId);
            this.peer.on('open', () => {
              this.updateSyncBadge('online', 'P2P Connected');
              this.connectToOtherRoles(normalizedRoom);
            });
            this.peer.on('connection', (c) => this.setupConnection(c));
          } else {
            this.updateSyncBadge('online', 'Local / P2P');
          }
        });
      } catch (err) {
        console.warn('PeerJS init failed, using BroadcastChannel:', err);
        this.updateSyncBadge('online', 'Local Sync Active');
      }
    }

    connectToOtherRoles(normalizedRoom) {
      const allRoles = ['gm', 'player1', 'player2'];
      const targets = allRoles.filter(r => r !== this.currentRole);

      targets.forEach(role => {
        const targetPeerId = `alpairus-${normalizedRoom}-${role}`;
        try {
          const conn = this.peer.connect(targetPeerId, { reliable: true });
          this.setupConnection(conn);
        } catch (e) {
          // Peer may not be online yet; will connect when they open
        }
      });
    }

    setupConnection(conn) {
      conn.on('open', () => {
        if (!this.peerConnections.includes(conn)) {
          this.peerConnections.push(conn);
        }
        this.updateSyncBadge('online', `Live (${this.peerConnections.length} Peers)`);
        
        // Immediately exchange current state
        conn.send({
          type: 'STATE_UPDATE',
          payload: this.state
        });
      });

      conn.on('data', (data) => {
        if (data && data.type === 'STATE_UPDATE') {
          this.mergeRemoteState(data.payload);
        }
      });

      conn.on('close', () => {
        this.peerConnections = this.peerConnections.filter(c => c !== conn);
        this.updateSyncBadge('online', this.peerConnections.length > 0 ? `Live (${this.peerConnections.length} Peers)` : 'P2P Ready');
      });
    }

    broadcastState() {
      const payload = {
        type: 'STATE_UPDATE',
        payload: this.state
      };

      // 1. BroadcastChannel (for other tabs on the same machine)
      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage(payload);
        } catch (e) {}
      }

      // 2. PeerJS DataConnections (over the internet to remote friends)
      this.peerConnections.forEach(conn => {
        if (conn.open) {
          try {
            conn.send(payload);
          } catch (e) {
            console.warn('Peer send failed:', e);
          }
        }
      });

      // 3. LocalStorage
      this.saveStateToLocal();
    }

    mergeRemoteState(remote) {
      if (!remote || !remote.players) return;

      // Smart merge: preserve local role if locally updated more recently, otherwise adopt remote
      let changed = false;

      // Merge players
      for (let role of ['player1', 'player2']) {
        if (remote.players[role]) {
          const rPlayer = remote.players[role];
          const lPlayer = this.state.players[role];

          // If I am editing this player, only accept if remote is newer
          if (this.currentRole === role) {
            if (rPlayer.lastUpdated > lPlayer.lastUpdated) {
              this.state.players[role] = { ...lPlayer, ...rPlayer };
              changed = true;
            }
          } else {
            // Adopt remote player state
            this.state.players[role] = { ...lPlayer, ...rPlayer };
            changed = true;
          }
        }
      }

      // Merge Mobs
      if (Array.isArray(remote.mobs)) {
        this.state.mobs = remote.mobs;
        changed = true;
      }

      // Merge Logs
      if (Array.isArray(remote.logs) && remote.logs.length > this.state.logs.length) {
        this.state.logs = remote.logs;
        changed = true;
      }

      if (changed) {
        this.render();
      }
    }

    updateSyncBadge(status, label) {
      const badge = this.dom.syncStatusBadge;
      const text = this.dom.syncStatusText;
      badge.classList.remove('online', 'error');

      if (status === 'online') {
        badge.classList.add('online');
      } else if (status === 'error') {
        badge.classList.add('error');
      }
      text.textContent = label;
    }

    saveStateToLocal() {
      try {
        localStorage.setItem(`alpairus_state_${this.roomId}`, JSON.stringify(this.state));
      } catch (e) {}
    }

    loadStateFromLocal() {
      try {
        const saved = localStorage.getItem(`alpairus_state_${this.roomId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          this.state = { ...DEFAULT_STATE, ...parsed };
        }
      } catch (e) {}
    }
  }

  // Helper
  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Bootstrap when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const app = new AlPairusApp();
    app.init();
    window.alPairus = app; // Accessible in console for debugging
  });

})();
