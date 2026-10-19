/**
 * AL-PAIRUS - RPG Real-Time Stat Tracker
 * Client logic, P2P/Cloud state synchronization, Dice Roller, Attributes, and Motore Chirurgico.
 */

(() => {
  'use strict';

  // --- AUDIO SYNTHESIZER (Web Audio API - Nessun file esterno necessario) ---
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

    playDice() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      for (let i = 0; i < 5; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(160 + Math.random() * 320, this.ctx.currentTime + i * 0.04);
        gain.gain.setValueAtTime(0.07, this.ctx.currentTime + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.04 + 0.035);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.04);
        osc.stop(this.ctx.currentTime + i * 0.04 + 0.035);
      }
    }
  }

  const sfx = new SoundFX();

  // --- ATTRIBUTI E POINT BUY D&D 5E ---
  const ATTRIBUTES = [
    { key: 'str', label: 'Forza' },
    { key: 'dex', label: 'Destrezza' },
    { key: 'con', label: 'Costituzione' },
    { key: 'int', label: 'Intelligenza' },
    { key: 'wis', label: 'Saggezza' },
    { key: 'cha', label: 'Carisma' }
  ];

  const POINT_COSTS = {
    8: 0,
    9: 1,
    10: 2,
    11: 3,
    12: 4,
    13: 5,
    14: 7,
    15: 9
  };

  const DEFAULT_ATTRIBUTES = {
    str: { base: 12, racial: 0 },
    dex: { base: 13, racial: 0 },
    con: { base: 13, racial: 0 },
    int: { base: 13, racial: 0 },
    wis: { base: 12, racial: 0 },
    cha: { base: 11, racial: 0 }
  };

  // --- STATO INIZIALE PREDEFINITO ---
  const DEFAULT_STATE = {
    players: {
      player1: {
        name: 'Kassandra',
        hp: 8,
        maxHp: 8,
        toxicity: 0,
        turnCount: 1,
        attributes: JSON.parse(JSON.stringify(DEFAULT_ATTRIBUTES)),
        engine: {
          gear: 0, // 0 = spento, 1 = marcia 1, 2 = marcia 2, 3 = marcia 3
          notes: ''
        },
        lastUpdated: Date.now()
      },
      player2: {
        name: 'Yoru',
        hp: 7,
        maxHp: 7,
        toxicity: 0,
        turnCount: 1,
        attributes: JSON.parse(JSON.stringify(DEFAULT_ATTRIBUTES)),
        engine: {
          gear: 0,
          notes: ''
        },
        lastUpdated: Date.now()
      }
    },
    mobs: [],
    logs: [
      { id: '1', text: 'Campagna avviata. Il freddo del ferro avvolge Al-Pairus.', type: 'system', time: new Date().toLocaleTimeString() }
    ],
    gmPin: '1234',
    version: 2
  };

  // --- CONTROLLER PRINCIPALE AL-PAIRUS ---
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

      // Dice Roller State
      this.selectedDiceSides = 20;
      
      // DOM Elements
      this.dom = {};
    }

    init() {
      this.cacheDom();
      this.bindEvents();
      this.parseUrlParams();
      this.initBroadcastChannel();
      this.renderVials(0);
      this.updateSyncBadge('local', 'Pronto');
    }

    cacheDom() {
      this.dom = {
        // Viste
        lobbyView: document.getElementById('lobbyView'),
        playerView: document.getElementById('playerView'),
        gmView: document.getElementById('gmView'),
        
        // Header
        syncStatusBadge: document.getElementById('syncStatusBadge'),
        syncStatusText: document.getElementById('syncStatusText'),
        displayRoomId: document.getElementById('displayRoomId'),
        copyShareBtn: document.getElementById('copyShareBtn'),
        diceRollerBtn: document.getElementById('diceRollerBtn'),
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

        // Vista Giocatore
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

        // Motore Chirurgico (Kassandra)
        kassandraEngineCard: document.getElementById('kassandraEngineCard'),
        engineGearBadge: document.getElementById('engineGearBadge'),
        btnGear1: document.getElementById('btnGear1'),
        btnGear2: document.getElementById('btnGear2'),
        btnGear3: document.getElementById('btnGear3'),
        btnRiteOfFlesh: document.getElementById('btnRiteOfFlesh'),
        biomechNotesInput: document.getElementById('biomechNotesInput'),

        // Attributi & Point Buy
        totalPointsSpent: document.getElementById('totalPointsSpent'),
        resetAttributesBtn: document.getElementById('resetAttributesBtn'),
        attributesTableBody: document.getElementById('attributesTableBody'),

        // Vista GM (Federico)
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

        // Modale Mostro
        mobModal: document.getElementById('mobModal'),
        closeMobModalBtn: document.getElementById('closeMobModalBtn'),
        cancelMobModalBtn: document.getElementById('cancelMobModalBtn'),
        confirmAddMobBtn: document.getElementById('confirmAddMobBtn'),
        mobNameInput: document.getElementById('mobNameInput'),
        mobHpInput: document.getElementById('mobHpInput'),
        mobCurrentHpInput: document.getElementById('mobCurrentHpInput'),
        mobMaxToxInput: document.getElementById('mobMaxToxInput'),
        mobCurrentToxInput: document.getElementById('mobCurrentToxInput'),

        // Modale Dadi
        diceModal: document.getElementById('diceModal'),
        closeDiceModalBtn: document.getElementById('closeDiceModalBtn'),
        diceTypeBtns: document.querySelectorAll('.dice-type-btn'),
        diceCountInput: document.getElementById('diceCountInput'),
        diceModInput: document.getElementById('diceModInput'),
        secretRollWrapper: document.getElementById('secretRollWrapper'),
        secretRollCheckbox: document.getElementById('secretRollCheckbox'),
        executeRollBtn: document.getElementById('executeRollBtn'),
        diceResultTotal: document.getElementById('diceResultTotal'),
        diceResultBreakdown: document.getElementById('diceResultBreakdown'),

        // Modale Modifica Personaggio
        editCharModal: document.getElementById('editCharModal'),
        closeCharModalBtn: document.getElementById('closeCharModalBtn'),
        cancelCharModalBtn: document.getElementById('cancelCharModalBtn'),
        saveCharBtn: document.getElementById('saveCharBtn'),
        charNameInput: document.getElementById('charNameInput'),
        charMaxHpInput: document.getElementById('charMaxHpInput'),

        // Modale Impostazioni
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
      // Room e Header
      this.dom.randomRoomBtn.addEventListener('click', () => {
        const agg = ['ombra', 'ferro', 'sangue', 'abisso', 'freddo', 'cenere', 'arcano'];
        const sost = ['rocca', 'lama', 'cripta', 'fortezza', 'spirale', 'cittadella', 'fossa'];
        const num = Math.floor(100 + Math.random() * 900);
        const a = agg[Math.floor(Math.random() * agg.length)];
        const s = sost[Math.floor(Math.random() * sost.length)];
        this.dom.roomInput.value = `${s}-${a}-${num}`;
        sfx.playClick();
      });

      this.dom.copyShareBtn.addEventListener('click', () => this.copyShareLink());
      this.dom.soundToggleBtn.addEventListener('click', () => this.toggleSound());
      this.dom.switchRoleBtn.addEventListener('click', () => this.showLobby());
      this.dom.settingsBtn.addEventListener('click', () => this.openSettingsModal());
      this.dom.diceRollerBtn.addEventListener('click', () => this.openDiceModal());

      // Selezione Ruolo in Lobby
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
          alert('Passcode GM non corretto! Quello predefinito è 1234.');
          this.dom.gmPinInput.select();
        }
      });

      this.dom.gmPinInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.dom.confirmGmBtn.click();
        }
      });

      // Controlli Rapidi PF Giocatore
      document.querySelectorAll('.adjust-chip').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const delta = parseInt(e.target.dataset.delta, 10);
          this.modifyPlayerHp(this.currentRole, delta);
        });
      });

      // Danno / Cura Personalizzati
      this.dom.dealDamageBtn.addEventListener('click', () => {
        const amount = parseInt(this.dom.hpCustomAmount.value, 10) || 0;
        if (amount > 0) this.modifyPlayerHp(this.currentRole, -amount);
      });

      this.dom.applyHealBtn.addEventListener('click', () => {
        const amount = parseInt(this.dom.hpCustomAmount.value, 10) || 0;
        if (amount > 0) this.modifyPlayerHp(this.currentRole, amount);
      });

      // Controlli Tossicità Giocatore
      this.dom.incToxBtn.addEventListener('click', () => this.modifyPlayerTox(this.currentRole, 1));
      this.dom.decToxBtn.addEventListener('click', () => this.modifyPlayerTox(this.currentRole, -1));
      this.dom.maxToxBtn.addEventListener('click', () => this.setPlayerTox(this.currentRole, 10));
      this.dom.purgeToxBtn.addEventListener('click', () => this.setPlayerTox(this.currentRole, 0));

      // CONCLUDI TURNO
      this.dom.endTurnBtn.addEventListener('click', () => this.handleEndTurn());

      // Motore Chirurgico (Kassandra)
      this.dom.btnGear1.addEventListener('click', () => this.setEngineGear(1));
      this.dom.btnGear2.addEventListener('click', () => this.setEngineGear(2));
      this.dom.btnGear3.addEventListener('click', () => this.setEngineGear(3));
      this.dom.btnRiteOfFlesh.addEventListener('click', () => this.triggerRiteOfFlesh());
      this.dom.biomechNotesInput.addEventListener('input', (e) => {
        if (this.currentRole === 'player1') {
          this.state.players.player1.engine.notes = e.target.value;
          this.broadcastState();
        }
      });

      // Reset Attributi
      this.dom.resetAttributesBtn.addEventListener('click', () => {
        if (confirm('Reimpostare i punteggi delle caratteristiche ai valori base?')) {
          const player = this.state.players[this.currentRole];
          if (player) {
            player.attributes = JSON.parse(JSON.stringify(DEFAULT_ATTRIBUTES));
            this.renderAttributes();
            this.broadcastState();
            sfx.playClick();
          }
        }
      });

      // Modifica Nome / PF Max
      this.dom.renameCharBtn.addEventListener('click', () => this.openEditCharModal());
      this.dom.editMaxHpBtn.addEventListener('click', () => this.openEditCharModal());
      this.dom.closeCharModalBtn.addEventListener('click', () => this.closeModal(this.dom.editCharModal));
      this.dom.cancelCharModalBtn.addEventListener('click', () => this.closeModal(this.dom.editCharModal));
      this.dom.saveCharBtn.addEventListener('click', () => this.saveCharChanges());

      // Svuota Log
      this.dom.clearPlayerLogBtn.addEventListener('click', () => {
        this.dom.playerCombatLog.innerHTML = '<li class="log-entry system-entry">Cronache svuotate.</li>';
      });
      this.dom.clearGmLogBtn.addEventListener('click', () => {
        this.state.logs = [];
        this.renderCombatLogs();
        this.broadcastState();
      });

      // Controlli Master (Overrides su Schede Giocatori)
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
            const newMax = prompt(`Inserisci nuovi PF Massimi per ${current.name}:`, current.maxHp);
            if (newMax && !isNaN(parseInt(newMax, 10))) {
              current.maxHp = Math.max(1, parseInt(newMax, 10));
              current.hp = Math.min(current.hp, current.maxHp);
              this.addLog(`PF Massimi di ${current.name} impostati a ${current.maxHp} dal Master.`, 'gm');
              this.render();
              this.broadcastState();
            }
          }
        });
      });

      // Master: Azzera Round
      this.dom.gmResetPartyBtn.addEventListener('click', () => {
        if (confirm('Azzerare turni e tossicità dei giocatori per un nuovo round di combattimento?')) {
          for (let role of ['player1', 'player2']) {
            this.state.players[role].toxicity = 0;
            this.state.players[role].turnCount = 1;
          }
          this.addLog('Round di combattimento azzerato da Federico (Master).', 'gm');
          sfx.playTurnEnd();
          this.render();
          this.broadcastState();
        }
      });

      // Master: Evocazione Mostro
      this.dom.openAddMobModalBtn.addEventListener('click', () => this.openMobModal());
      this.dom.closeMobModalBtn.addEventListener('click', () => this.closeModal(this.dom.mobModal));
      this.dom.cancelMobModalBtn.addEventListener('click', () => this.closeModal(this.dom.mobModal));
      this.dom.confirmAddMobBtn.addEventListener('click', () => this.handleAddMob());

      // Presets Mostro Rapidi
      document.querySelectorAll('.quick-template-row .btn-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
          this.dom.mobNameInput.value = e.target.dataset.preset;
          this.dom.mobHpInput.value = e.target.dataset.hp;
          this.dom.mobCurrentHpInput.value = e.target.dataset.hp;
          this.dom.mobMaxToxInput.value = e.target.dataset.tox || 0;
          this.dom.mobCurrentToxInput.value = 0;
          sfx.playClick();
        });
      });

      // Modale Dadi
      this.dom.closeDiceModalBtn.addEventListener('click', () => this.closeModal(this.dom.diceModal));
      this.dom.diceTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.dom.diceTypeBtns.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this.selectedDiceSides = parseInt(btn.dataset.sides, 10);
          sfx.playClick();
        });
      });
      this.dom.executeRollBtn.addEventListener('click', () => {
        const count = Math.max(1, Math.min(20, parseInt(this.dom.diceCountInput.value, 10) || 1));
        const mod = parseInt(this.dom.diceModInput.value, 10) || 0;
        const isSecret = this.dom.secretRollCheckbox.checked;
        this.rollDice(this.selectedDiceSides, count, mod, isSecret);
      });

      // Impostazioni
      this.dom.closeSettingsModalBtn.addEventListener('click', () => this.closeModal(this.dom.settingsModal));
      this.dom.saveSettingsBtn.addEventListener('click', () => this.closeModal(this.dom.settingsModal));
      this.dom.saveGmPinBtn.addEventListener('click', () => {
        const newPin = this.dom.newGmPinInput.value.trim();
        if (newPin.length >= 4) {
          this.state.gmPin = newPin;
          this.saveStateToLocal();
          alert('PIN Master aggiornato con successo!');
          this.dom.newGmPinInput.value = '';
        } else {
          alert('Il PIN deve essere lungo almeno 4 caratteri.');
        }
      });

      // Sync Selector
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

      const newUrl = `${window.location.pathname}?room=${encodeURIComponent(this.roomId)}&role=${role}`;
      window.history.replaceState({}, '', newUrl);

      // Mostra checkbox Tiro Segreto solo se si è il GM
      if (role === 'gm') {
        this.dom.secretRollWrapper.classList.remove('hidden');
      } else {
        this.dom.secretRollWrapper.classList.add('hidden');
        this.dom.secretRollCheckbox.checked = false;
      }

      this.connectPeerSync();

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

      // Mostra Motore Chirurgico SOLO per Kassandra
      if (this.currentRole === 'player1') {
        this.dom.kassandraEngineCard.classList.remove('hidden');
      } else {
        this.dom.kassandraEngineCard.classList.add('hidden');
      }
    }

    showGmView() {
      this.dom.lobbyView.classList.remove('active-view');
      this.dom.playerView.classList.remove('active-view');
      this.dom.gmView.classList.add('active-view');
    }

    // --- RENDER ---
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

      // Punti Ferita
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

      // Tossicità (0-10)
      this.dom.playerToxCurrent.textContent = player.toxicity;
      this.renderVials(player.toxicity);

      // Motore Chirurgico (Se Kassandra)
      if (this.currentRole === 'player1') {
        this.renderEngine();
      }

      // Tabella Attributi
      this.renderAttributes();
    }

    renderEngine() {
      const p1 = this.state.players.player1;
      const gear = p1.engine ? p1.engine.gear : 0;
      const badge = this.dom.engineGearBadge;

      badge.classList.remove('active-1', 'active-2', 'active-3');
      this.dom.btnGear1.classList.remove('selected');
      this.dom.btnGear2.classList.remove('selected');
      this.dom.btnGear3.classList.remove('selected');

      if (gear === 0) {
        badge.textContent = 'Spento';
      } else if (gear === 1) {
        badge.textContent = 'Marcia 1 Attiva';
        badge.classList.add('active-1');
        this.dom.btnGear1.classList.add('selected');
      } else if (gear === 2) {
        badge.textContent = 'Marcia 2 Attiva';
        badge.classList.add('active-2');
        this.dom.btnGear2.classList.add('selected');
      } else if (gear === 3) {
        badge.textContent = 'Marcia 3 ATTIVA (D4 Danno)';
        badge.classList.add('active-3');
        this.dom.btnGear3.classList.add('selected');
      }

      if (p1.engine && p1.engine.notes !== undefined) {
        this.dom.biomechNotesInput.value = p1.engine.notes;
      }
    }

    renderAttributes() {
      if (!this.currentRole || this.currentRole === 'gm') return;
      const player = this.state.players[this.currentRole];
      if (!player) return;

      if (!player.attributes) {
        player.attributes = JSON.parse(JSON.stringify(DEFAULT_ATTRIBUTES));
      }

      const tbody = this.dom.attributesTableBody;
      tbody.innerHTML = '';
      let totalCost = 0;

      ATTRIBUTES.forEach(attr => {
        const data = player.attributes[attr.key] || { base: 10, racial: 0 };
        const baseScore = Math.max(8, Math.min(15, data.base));
        const racial = data.racial || 0;
        const total = baseScore + racial;
        const mod = Math.floor((total - 10) / 2);
        const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
        const cost = POINT_COSTS[baseScore] !== undefined ? POINT_COSTS[baseScore] : 0;
        totalCost += cost;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${attr.label}</td>
          <td>
            <input type="number" class="attr-input base-input" data-key="${attr.key}" min="8" max="15" value="${baseScore}">
          </td>
          <td>
            <input type="number" class="attr-input racial-input" data-key="${attr.key}" min="-5" max="10" value="${racial}">
          </td>
          <td class="attr-total-val">${total}</td>
          <td>
            <button class="attr-mod-btn" data-key="${attr.key}" data-mod="${mod}" data-name="${attr.label}" title="Clicca per lanciare 1d20 ${modStr}">
              🎲 ${modStr}
            </button>
          </td>
          <td class="attr-cost-val">${cost}</td>
        `;

        // Eventi input
        tr.querySelector('.base-input').addEventListener('change', (e) => {
          data.base = parseInt(e.target.value, 10) || 8;
          player.lastUpdated = Date.now();
          this.renderAttributes();
          this.broadcastState();
        });

        tr.querySelector('.racial-input').addEventListener('change', (e) => {
          data.racial = parseInt(e.target.value, 10) || 0;
          player.lastUpdated = Date.now();
          this.renderAttributes();
          this.broadcastState();
        });

        // Click to roll su modificatore
        tr.querySelector('.attr-mod-btn').addEventListener('click', (e) => {
          const modVal = parseInt(e.currentTarget.dataset.mod, 10);
          const attrName = e.currentTarget.dataset.name;
          this.rollDice(20, 1, modVal, false, `Prova di ${attrName}`);
        });

        tbody.appendChild(tr);
      });

      this.dom.totalPointsSpent.textContent = totalCost;
      if (totalCost > 27) {
        this.dom.totalPointsSpent.style.color = '#ef4444';
      } else {
        this.dom.totalPointsSpent.style.color = 'var(--gold-bright)';
      }
    }

    renderVials(currentTox) {
      const container = this.dom.playerVialsContainer;
      container.innerHTML = '';

      for (let i = 1; i <= 10; i++) {
        const slot = document.createElement('div');
        slot.className = 'vial-slot';
        slot.title = `Livello Tossicità ${i}`;
        
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

        slot.addEventListener('click', () => {
          if (this.currentRole && this.currentRole !== 'gm') {
            this.setPlayerTox(this.currentRole, i);
          }
        });

        container.appendChild(slot);
      }
    }

    renderGmView() {
      // Kassandra (Player 1)
      const p1 = this.state.players.player1;
      this.dom.gmP1Name.textContent = p1.name;
      this.dom.gmP1Turn.textContent = `Turno ${p1.turnCount}`;
      this.dom.gmP1HpLabel.textContent = `${p1.hp} / ${p1.maxHp}`;
      const p1HpPct = Math.max(0, Math.min(100, Math.round((p1.hp / p1.maxHp) * 100)));
      this.dom.gmP1HpBar.style.width = `${p1HpPct}%`;
      this.dom.gmP1ToxLabel.textContent = `${p1.toxicity} / 10`;
      this.dom.gmP1ToxBar.style.width = `${p1.toxicity * 10}%`;

      // Yoru (Player 2)
      const p2 = this.state.players.player2;
      this.dom.gmP2Name.textContent = p2.name;
      this.dom.gmP2Turn.textContent = `Turno ${p2.turnCount}`;
      this.dom.gmP2HpLabel.textContent = `${p2.hp} / ${p2.maxHp}`;
      const p2HpPct = Math.max(0, Math.min(100, Math.round((p2.hp / p2.maxHp) * 100)));
      this.dom.gmP2HpBar.style.width = `${p2HpPct}%`;
      this.dom.gmP2ToxLabel.textContent = `${p2.toxicity} / 10`;
      this.dom.gmP2ToxBar.style.width = `${p2.toxicity * 10}%`;

      // Mostri
      this.renderMobs();
    }

    renderMobs() {
      const container = this.dom.gmMobsList;
      const emptyState = this.dom.emptyMobsState;
      const countPill = this.dom.gmMobCount;

      countPill.textContent = `${this.state.mobs.length} Attivi`;

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
        const maxTox = mob.maxTox || 0;
        const curTox = mob.tox || 0;
        const toxPct = maxTox > 0 ? Math.max(0, Math.min(100, Math.round((curTox / maxTox) * 100))) : 0;

        let toxHtml = '';
        if (maxTox > 0) {
          toxHtml = `
            <div class="mob-tox-stats">
              <span>Tossicità</span>
              <span class="mob-tox-val">${curTox} / ${maxTox} (${toxPct}%)</span>
            </div>
            <div class="meter-track tox-track small">
              <div class="meter-fill tox-fill" style="width: ${toxPct}%;"></div>
            </div>
            <div class="gm-override-row">
              <button class="mob-chip tox-down" data-tox-delta="-2">-2</button>
              <button class="mob-chip tox-down" data-tox-delta="-1">-1</button>
              <button class="mob-chip tox-up" data-tox-delta="+1">+1</button>
              <button class="mob-chip tox-purge" data-tox-set="0">Azzera</button>
            </div>
          `;
        }

        card.innerHTML = `
          <div class="mob-header">
            <div class="mob-title-area">
              <span class="mob-icon">👹</span>
              <span class="mob-name">${escapeHtml(mob.name)}</span>
            </div>
            <button class="mob-delete-btn" title="Rimuovi Creatura">&times;</button>
          </div>
          <div class="mob-hp-stats">
            <span>Salute</span>
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
            <button class="mob-chip defeat">Sconfitto</button>
          </div>
          ${toxHtml}
        `;

        // Controlli PF
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

        // Controlli Tossicità Mostro
        if (maxTox > 0) {
          card.querySelectorAll('[data-tox-delta]').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const delta = parseInt(e.target.dataset.toxDelta, 10);
              this.modifyMobTox(mob.id, delta);
            });
          });
          const purgeBtn = card.querySelector('[data-tox-set]');
          if (purgeBtn) {
            purgeBtn.addEventListener('click', () => {
              this.setMobTox(mob.id, 0);
            });
          }
        }

        container.appendChild(card);
      });
    }

    renderCombatLogs() {
      const renderTo = (container) => {
        if (!container) return;
        container.innerHTML = '';
        const recentLogs = this.state.logs.slice(-30).reverse();
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

    // --- AZIONI DI GIOCO ---
    handleEndTurn() {
      if (!this.currentRole || this.currentRole === 'gm') return;

      const player = this.state.players[this.currentRole];
      const prevTox = player.toxicity;

      // Se Kassandra ha il Motore Chirurgico attivo, subisce danno a inizio/fine turno!
      if (this.currentRole === 'player1' && player.engine && player.engine.gear > 0) {
        if (player.engine.gear === 1 || player.engine.gear === 2) {
          player.hp = Math.max(0, player.hp - 1);
          sfx.playDamage();
          this.spawnFloatingText(`-1 PF (Motore)`, 'damage');
          this.addLog(`Motore Chirurgico (Marcia ${player.engine.gear}): Kassandra perde 1 PF (PF rimasti: ${player.hp}/${player.maxHp}).`, 'damage');
        } else if (player.engine.gear === 3) {
          const d4 = Math.floor(Math.random() * 4) + 1;
          player.hp = Math.max(0, player.hp - d4);
          sfx.playDamage();
          this.spawnFloatingText(`-${d4} PF (Motore 1d4)`, 'damage');
          this.addLog(`Motore Chirurgico (Marcia 3): Kassandra perde 1d4 [${d4}] PF (PF rimasti: ${player.hp}/${player.maxHp})!`, 'damage');
        }
      }

      // Regola Turno: -2 Tossicità (fino a 0) e incremento turno
      player.toxicity = Math.max(0, player.toxicity - 2);
      player.turnCount += 1;
      player.lastUpdated = Date.now();

      const toxReduced = prevTox - player.toxicity;
      this.spawnFloatingText(`-2 TOSS`, 'tox');
      this.spawnFloatingText(`Turno ${player.turnCount}`, 'heal');
      sfx.playTurnEnd();

      this.addLog(`${player.name} ha concluso il turno. Tossicità ridotta di ${toxReduced} (ora ${player.toxicity}/10). Inizio Turno #${player.turnCount}.`, 'turn');
      this.render();
      this.broadcastState();
    }

    setEngineGear(gearNum) {
      if (this.currentRole !== 'player1') return;
      const player = this.state.players.player1;
      if (!player.engine) player.engine = { gear: 0, notes: '' };

      player.engine.gear = gearNum;
      sfx.playToxicity();

      if (gearNum === 1) {
        player.toxicity = Math.min(10, player.toxicity + 4);
        this.spawnFloatingText(`+4 TOSS (Marcia 1)`, 'tox');
        this.addLog(`Kassandra ha attivato il Motore Chirurgico (Marcia 1): +4 Tossicità. Modifica biomeccanica e ridistribuzione 2 punti. -1 PF all'inizio di ogni turno.`, 'gm');
      } else if (gearNum === 2) {
        player.toxicity = Math.min(10, player.toxicity + 1);
        player.hp = Math.min(player.maxHp, player.hp + 4);
        this.spawnFloatingText(`+1 TOSS / +4 PF`, 'heal');
        this.addLog(`Kassandra ha innestato la Marcia 2: +1 Tossicità, +4 PF. -1 PF all'inizio di ogni turno.`, 'heal');
      } else if (gearNum === 3) {
        player.toxicity = Math.min(10, player.toxicity + 1);
        this.spawnFloatingText(`+1 TOSS (Marcia 3)`, 'tox');
        this.addLog(`Kassandra ha innestato la Marcia 3: +1 Tossicità. Modifica biomeccanica e ridistribuzione 2 punti. -1d4 PF all'inizio di ogni turno!`, 'damage');
      }

      player.lastUpdated = Date.now();
      this.render();
      this.broadcastState();
    }

    triggerRiteOfFlesh() {
      if (this.currentRole !== 'player1') return;
      const player = this.state.players.player1;

      if (!confirm('Celebrare il Rito di Carne e Ferro? Il motore verrà disattivato, le modifiche annullate, la salute tornerà al MASSIMO e la Tossicità al MASSIMO (10).')) {
        return;
      }

      if (!player.engine) player.engine = { gear: 0, notes: '' };
      player.engine.gear = 0;
      player.engine.notes = '';
      player.hp = player.maxHp;
      player.toxicity = 10;
      player.lastUpdated = Date.now();

      sfx.playTurnEnd();
      this.spawnFloatingText(`RITO DI CARNE E FERRO!`, 'heal');
      this.addLog(`Kassandra ha celebrato il RITO DI CARNE E FERRO! Motore disattivato, salute rigenerata al MASSIMO (${player.hp}/${player.maxHp}), Tossicità al MASSIMO (10/10).`, 'gm');

      this.render();
      this.broadcastState();
    }

    modifyPlayerHp(role, delta, fromGm = false) {
      const player = this.state.players[role];
      if (!player) return;

      player.hp = Math.max(0, Math.min(player.maxHp, player.hp + delta));
      player.lastUpdated = Date.now();

      if (delta < 0) {
        sfx.playDamage();
        this.spawnFloatingText(`${delta} PF`, 'damage');
        this.addLog(`${player.name} subisce ${Math.abs(delta)} danni (ora ${player.hp}/${player.maxHp})${fromGm ? ' [dal Master]' : ''}.`, 'damage');
      } else {
        sfx.playHeal();
        this.spawnFloatingText(`+${delta} PF`, 'heal');
        this.addLog(`${player.name} recupera +${delta} PF (ora ${player.hp}/${player.maxHp})${fromGm ? ' [dal Master]' : ''}.`, 'heal');
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
      this.spawnFloatingText(`${delta > 0 ? '+' : ''}${delta} TOSS`, 'tox');
      this.addLog(`Tossicità di ${player.name}: ${delta > 0 ? '+' : ''}${delta} (ora ${player.toxicity}/10)${fromGm ? ' [dal Master]' : ''}.`, 'turn');

      this.render();
      this.broadcastState();
    }

    setPlayerTox(role, val, fromGm = false) {
      const player = this.state.players[role];
      if (!player) return;

      player.toxicity = Math.max(0, Math.min(10, val));
      player.lastUpdated = Date.now();
      sfx.playToxicity();
      this.spawnFloatingText(`TOSS: ${val}`, 'tox');
      this.addLog(`Tossicità di ${player.name} impostata a ${val}/10${fromGm ? ' [dal Master]' : ''}.`, 'turn');

      this.render();
      this.broadcastState();
    }

    handleAddMob() {
      const name = this.dom.mobNameInput.value.trim() || 'Creatura';
      const maxHp = parseInt(this.dom.mobHpInput.value, 10) || 20;
      const hp = Math.min(maxHp, parseInt(this.dom.mobCurrentHpInput.value, 10) || maxHp);
      const maxTox = Math.max(0, parseInt(this.dom.mobMaxToxInput.value, 10) || 0);
      const tox = Math.min(maxTox, Math.max(0, parseInt(this.dom.mobCurrentToxInput.value, 10) || 0));

      const newMob = {
        id: 'mob_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name,
        hp,
        maxHp,
        tox,
        maxTox
      };

      this.state.mobs.push(newMob);
      this.addLog(`Federico ha evocato "${name}" (${hp}/${maxHp} PF${maxTox > 0 ? `, Tossicità: ${tox}/${maxTox}` : ''}).`, 'gm');
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
        this.addLog(`"${mob.name}" subisce ${Math.abs(delta)} danni (ora ${mob.hp}/${mob.maxHp}).`, 'damage');
      } else {
        sfx.playHeal();
        this.addLog(`"${mob.name}" recupera +${delta} PF (ora ${mob.hp}/${mob.maxHp}).`, 'heal');
      }

      if (mob.hp <= 0) {
        this.addLog(`"${mob.name}" è caduto nello scontro! 💀`, 'damage');
      }

      this.renderMobs();
      this.broadcastState();
    }

    modifyMobTox(mobId, delta) {
      const mob = this.state.mobs.find(m => m.id === mobId);
      if (!mob || !mob.maxTox) return;

      mob.tox = Math.max(0, Math.min(mob.maxTox, (mob.tox || 0) + delta));
      sfx.playToxicity();
      this.addLog(`Tossicità di "${mob.name}": ${delta > 0 ? '+' : ''}${delta} (ora ${mob.tox}/${mob.maxTox}).`, 'turn');

      this.renderMobs();
      this.broadcastState();
    }

    setMobTox(mobId, val) {
      const mob = this.state.mobs.find(m => m.id === mobId);
      if (!mob) return;

      mob.tox = Math.max(0, Math.min(mob.maxTox || 10, val));
      sfx.playToxicity();
      this.addLog(`Tossicità di "${mob.name}" azzerata a ${mob.tox}.`, 'turn');

      this.renderMobs();
      this.broadcastState();
    }

    removeMob(mobId) {
      const idx = this.state.mobs.findIndex(m => m.id === mobId);
      if (idx !== -1) {
        const removed = this.state.mobs.splice(idx, 1)[0];
        this.addLog(`"${removed.name}" rimossa dal combattimento.`, 'gm');
        sfx.playClick();
        this.renderMobs();
        this.broadcastState();
      }
    }

    // --- LANCIATORE DI DADI ---
    openDiceModal() {
      this.openModal(this.dom.diceModal);
    }

    rollDice(sides, count = 1, modifier = 0, isSecret = false, customLabel = null) {
      const rolls = [];
      let sum = 0;

      for (let i = 0; i < count; i++) {
        const val = Math.floor(Math.random() * sides) + 1;
        rolls.push(val);
        sum += val;
      }

      const total = sum + modifier;
      sfx.playDice();

      // Aggiorna modale se aperta
      if (this.dom.diceResultTotal) {
        this.dom.diceResultTotal.textContent = total;
        const modStr = modifier !== 0 ? (modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`) : '';
        this.dom.diceResultBreakdown.textContent = `${count}d${sides} [${rolls.join(', ')}]${modStr} = ${total}`;
      }

      const rollerName = this.currentRole === 'gm' ? 'Federico (Master)' : (this.state.players[this.currentRole] ? this.state.players[this.currentRole].name : 'Giocatore');
      const label = customLabel ? `${customLabel} (${count}d${sides}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''})` : `Tiro ${count}d${sides}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`;
      const logText = `${rollerName} ${isSecret ? '🔒 [SEGRETO]' : ''} ha lanciato ${label}: [${rolls.join(', ')}]${modifier !== 0 ? (modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`) : ''} = ${total}`;

      this.spawnFloatingText(`🎲 ${total}`, 'heal');

      if (isSecret && this.currentRole === 'gm') {
        // Solo per Federico
        this.addLog(logText, 'gm');
        this.renderCombatLogs();
      } else {
        this.addLog(logText, 'system');
        this.renderCombatLogs();
        this.broadcastState();
      }
    }

    // --- MODALI ---
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

      this.addLog(`${player.name} ha aggiornato le impostazioni del personaggio.`, 'system');
      this.closeModal(this.dom.editCharModal);
      this.render();
      this.broadcastState();
    }

    openMobModal() {
      this.dom.mobNameInput.value = '';
      this.dom.mobHpInput.value = 20;
      this.dom.mobCurrentHpInput.value = 20;
      this.dom.mobMaxToxInput.value = 0;
      this.dom.mobCurrentToxInput.value = 0;
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

    // --- EFFETTI VISIVI & LOG ---
    spawnFloatingText(text, type) {
      const el = document.createElement('div');
      el.className = `floating-combat-text ${type}`;
      el.textContent = text;
      
      const x = window.innerWidth / 2 + (Math.random() * 80 - 40);
      const y = window.innerHeight / 2 + (Math.random() * 60 - 30);
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;

      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1300);
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
        this.dom.copyShareBtn.textContent = '✅ Copiato!';
        sfx.playClick();
        setTimeout(() => this.dom.copyShareBtn.textContent = originalText, 2000);
      }).catch(() => {
        prompt('Copia questo link della stanza per condividerlo:', url);
      });
    }

    // --- SINCRONIZZAZIONE P2P WEBRTC + BROADCASTCHANNEL ---
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
      this.updateSyncBadge('connecting', 'Connessione...');

      if (this.peer) {
        try { this.peer.destroy(); } catch (e) {}
      }

      const normalizedRoom = this.roomId.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const myPeerId = `alpairus-${normalizedRoom}-${this.currentRole}`;

      try {
        this.peer = new Peer(myPeerId, {
          debug: 1
        });

        this.peer.on('open', (id) => {
          this.updateSyncBadge('online', 'P2P Online (WebRTC)');
          this.connectToOtherRoles(normalizedRoom);
        });

        this.peer.on('connection', (conn) => {
          this.setupConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.warn('PeerJS note:', err.type);
          if (err.type === 'unavailable-id') {
            const altId = `${myPeerId}-${Math.floor(Math.random() * 1000)}`;
            this.peer = new Peer(altId);
            this.peer.on('open', () => {
              this.updateSyncBadge('online', 'P2P Connesso');
              this.connectToOtherRoles(normalizedRoom);
            });
            this.peer.on('connection', (c) => this.setupConnection(c));
          } else {
            this.updateSyncBadge('online', 'Locale / P2P');
          }
        });
      } catch (err) {
        console.warn('PeerJS init failed:', err);
        this.updateSyncBadge('online', 'Sincro Locale');
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
        } catch (e) {}
      });
    }

    setupConnection(conn) {
      conn.on('open', () => {
        if (!this.peerConnections.includes(conn)) {
          this.peerConnections.push(conn);
        }
        this.updateSyncBadge('online', `Online (${this.peerConnections.length} Peers)`);
        
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
        this.updateSyncBadge('online', this.peerConnections.length > 0 ? `Online (${this.peerConnections.length} Peers)` : 'P2P Pronto');
      });
    }

    broadcastState() {
      const payload = {
        type: 'STATE_UPDATE',
        payload: this.state
      };

      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage(payload);
        } catch (e) {}
      }

      this.peerConnections.forEach(conn => {
        if (conn.open) {
          try {
            conn.send(payload);
          } catch (e) {
            console.warn('Peer send failed:', e);
          }
        }
      });

      this.saveStateToLocal();
    }

    mergeRemoteState(remote) {
      if (!remote || !remote.players) return;

      let changed = false;

      for (let role of ['player1', 'player2']) {
        if (remote.players[role]) {
          const rPlayer = remote.players[role];
          const lPlayer = this.state.players[role];

          if (this.currentRole === role) {
            if (rPlayer.lastUpdated > lPlayer.lastUpdated) {
              this.state.players[role] = { ...lPlayer, ...rPlayer };
              changed = true;
            }
          } else {
            this.state.players[role] = { ...lPlayer, ...rPlayer };
            changed = true;
          }
        }
      }

      if (Array.isArray(remote.mobs)) {
        this.state.mobs = remote.mobs;
        changed = true;
      }

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

  // Bootstrap al caricamento del DOM
  document.addEventListener('DOMContentLoaded', () => {
    const app = new AlPairusApp();
    app.init();
    window.alPairus = app;
  });

})();
