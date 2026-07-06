# Spot It — Multiplayer Web Game

Find the matching symbol on two cards across 5 timed rounds. Up to 10 players per lobby — lowest total time wins.

## Quick Start (solo / this device only)

```bash
cd ~/Projects/spot-it-game
npm install
npm run dev
```

Open `http://localhost:5173` → **Practice Solo**

## Play with friends on their phones

**You need online setup** (free). See **[SETUP_ONLINE.md](SETUP_ONLINE.md)** for the full walkthrough:

1. Create a free Supabase project (stores game rooms)
2. Add keys to `.env.local`
3. Deploy to Vercel (public URL friends can open)
4. Create a game → **Share Game Link** → friends join and play

## How a game works

1. **Create Game** → get a lobby and share link
2. Friends open the link → enter name → **Join Lobby**
3. Everyone plays **5 rounds** on their own phone, at their own pace
4. **Standings** in the lobby rank players by total time (1st, 2nd, 3rd…)

## Tech

- React + Vite + TypeScript
- Supabase (game rooms across devices)
- localStorage (your name + previous games on this device)
