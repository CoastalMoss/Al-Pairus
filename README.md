# ⚔️ GRIMOIRE — Grim RPG Stat & Toxicity Tracker

A lightweight, real-time web application tailored for a 3-player party (Federico as Game Master, Giuseppe, and yourself) to track vital combat stats during remote video-call sessions without needing to be on the same local network.

---

## 🌟 Key Features

1. **Private Player Sheets**:
   - Each player (Player 1 & Giuseppe) has a clean, focused view of their own character.
   - **Health Points**: Current / Max HP with animated crimson health bar, low-health critical pulse, quick adjustment chips (`-5`, `-1`, `+1`, `+5`), and direct Damage/Heal calculator.
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

## 🚀 How to Run & Test

### Option 1: Quick Local Test (Right Now!)
You can open `index.html` in your browser right away:
1. Open [index.html](file:///C:/Users/alemo/.gemini/antigravity-ide/scratch/rpg-stat-tracker/index.html) in your browser.
2. In the lobby, click **Player 1**.
3. Open a **second tab** with the same URL, and in the lobby select **Federico (GM)** (PIN: `1234`).
4. In Tab 1, adjust HP or click **"END TURN (-2 TOX)"**—watch it update live in Tab 2 on Federico's screen!

### Option 2: Run a Local Dev Server
If you have Python or Node installed:
```powershell
# Using Python
cd C:\Users\alemo\.gemini\antigravity-ide\scratch\rpg-stat-tracker
python -m http.server 3000

# Or using npx serve
npx -y serve .
```
Then visit `http://localhost:3000`.

---

## 🌐 How to Play Together in Your Video-Call

To share the dashboard with Federico and Giuseppe across different cities/networks:

### 1-Click Free Hosting:
1. **GitHub Pages**:
   - Create a free GitHub repo, push these files (`index.html`, `styles.css`, `app.js`).
   - Enable **GitHub Pages** in Repository Settings -> Pages.
2. **Netlify Drop** (Fastest - 30 seconds):
   - Go to [app.netlify.com/drop](https://app.netlify.com/drop).
   - Drag and drop the `rpg-stat-tracker` folder.
   - You get a live public link instantly (e.g. `https://grim-rpg-tracker.netlify.app`).
3. **Vercel**:
   - Run `npx -y vercel` in the project directory.

### In Your Video Call:
1. Federico, Giuseppe, and you open the same URL.
2. Ensure you all enter the **same Room Code** (e.g. `realm-of-shadows`).
3. Federico chooses **Federico (GM)** and enters `1234`.
4. Giuseppe chooses **Giuseppe**.
5. You choose **Player 1**.
6. Roll for initiative and enjoy your session! 🎲⚔️
