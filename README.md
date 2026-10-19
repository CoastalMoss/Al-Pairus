# ⚔️ AL-PAIRUS — Real-Time Combat & Stat Tracker

A lightweight, real-time web application tailored for a 3-player party (Federico as Game Master, Yoru, and Kassandra) to track vital combat stats during remote video-call sessions without needing to be on the same local network.

---

## 🌟 Key Features

1. **Private Player Sheets**:
   - Each player (Kassandra & Yoru) has a clean, focused view of their own character.
   - **Health Points**: Current / Max HP (Kassandra: 8 HP, Yoru: 7 HP) with animated crimson health bar, low-health critical pulse, quick adjustment chips (`-5`, `-1`, `+1`, `+5`), and direct Damage/Heal calculator.
   - **Toxicity Scale (0 to 10)**: 10 glowing alchemical vials that fill with animated acid green liquid. Click individual vials to set values directly.
   - **"End Turn" Action Button**: Automatically decreases Toxicity by **2 points** (clamping at 0) and increments your combat turn counter with visual effects and a resonant gong.
   - **Personal Combat Chronicle**: Logs every action, heal, damage, and turn transition.

2. **Game Master Overwatch (Federico)**:
   - **Protected by GM Passcode** (Default: `1234`, customizable in Settings).
   - **Live Party Monitor**: Watches both players' Health and Toxicity bars updating in real time.
   - **GM Override Controls**: Directly apply damage, healing, or adjust toxicity for any player if needed.
   - **Secret Mob & NPC Manager**:
     - Dynamically spawn creatures with preset buttons (*Goblin Skirmisher 12 HP*, *Skeleton Archer 18 HP*, *Dire Wolf 28 HP*, *Boss 65 HP*) or custom names/HPs.
     - Manage mob HP with quick-damage buttons and one-click "Defeat".
     - **Strictly hidden from player view**—invisible on player screens.

3. **Remote Real-Time Synchronization**:
   - Built-in **PeerJS (WebRTC)** connects the three of you directly across the internet (even behind NATs/different WiFis) using the shared Campaign Room code.
   - Built-in **BroadcastChannel** allows instant local multi-tab testing on the same computer.
   - Built-in **Web Audio Synthesizer**: Rich sound effects (damage thud, potion bubble, turn end gong) without needing any external audio file downloads.

---

## 🌐 Live Deployment (GitHub Pages)

The tracker is deployed and accessible at:
👉 **[https://coastalmoss.github.io/Al-Pairus/](https://coastalmoss.github.io/Al-Pairus/)**

### In Your Video Call:
1. Federico, Yoru, and Kassandra open **https://coastalmoss.github.io/Al-Pairus/**.
2. Ensure you all enter the **same Room Code** (e.g. `realm-of-shadows`).
3. Federico chooses **Federico** and enters PIN `1234`.
4. Yoru chooses **Yoru**.
5. You choose **Kassandra**.
6. Roll for initiative and enjoy your session! 🎲⚔️
