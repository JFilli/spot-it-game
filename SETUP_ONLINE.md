# Play Spot It With Friends (Online Setup)

Follow these steps once to let friends join from their phones anywhere.

## What you need

- A free [Supabase](https://supabase.com) account (database for game rooms)
- A free [Vercel](https://vercel.com) account (hosts the website at a public URL)

Total time: about 15 minutes.

---

## Step 1 — Create the database (Supabase)

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click **New project**, pick a name and password, wait for it to finish
3. Open **SQL Editor** in the left sidebar
4. Click **New query**, paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**
5. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (long string under Project API keys)

## Step 2 — Connect your project locally

In the `spot-it-game` folder, create a file named `.env.local`:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your real values from Step 1.

Restart the dev server:

```bash
cd ~/Projects/spot-it-game
npm run dev
```

The home screen should say **"Online — friends can join from any phone or computer"**.

---

## Step 3 — Put the game on the internet (Vercel)

Friends cannot open `localhost` on your Mac. You need a public URL.

1. Push your project to GitHub (or use Vercel’s import)
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. Under **Environment Variables**, add the same two variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**

You’ll get a URL like `https://spot-it-game.vercel.app`.

---

## Step 4 — Challenge a friend

1. Open your Vercel URL on your phone
2. Enter your name → **Create Game**
3. Tap **Share Game Link** and text it to your friend
4. They open the link, enter their name, and tap **Join Lobby**
5. You each tap **Start Playing** when ready (no need to wait for each other)
6. After 5 rounds, check **Standings** in the lobby — fastest total time wins!

Up to **10 players** can join the same lobby.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Home says "Local mode only" | Check `.env.local` exists and restart `npm run dev` |
| Friend’s link doesn’t work | Make sure you deployed to Vercel with env vars set |
| "Game not found" | Room may have been created in local mode before online setup — create a new game |
| Standings don’t update | Wait a few seconds; the app polls every few seconds for updates |

---

## Testing on the same WiFi (without deploying)

If you want a quick test before deploying:

```bash
npm run dev -- --host
```

Open `http://YOUR-MAC-IP:5173` on your phone (find IP in **System Settings → Wi-Fi → Details**).

Both phones must be on the same WiFi, and you still need Supabase configured in `.env.local`.
