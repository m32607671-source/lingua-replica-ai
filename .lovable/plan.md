## MVP Foundation

Builds the gamification skeleton. Other 47+ games, tournaments, teams, country/weekly leaderboards, and seasonal events become additive once this is in place.

## What ships

**1. Database (one migration)**
- `games` — catalog (code, name, category, description, xp/coin reward, status)
- `game_sessions` — per-play results (user_id, game_code, score, xp_earned, coins_earned)
- `clans` — id, name, tag, description, owner_id, member_count, total_xp
- `clan_members` — clan_id, user_id, role (owner/officer/member)
- `clan_messages` — clan_id, user_id, content (realtime enabled)
- RPCs: `create_clan`, `join_clan`, `leave_clan`, `submit_game_score` (awards XP + coins atomically, updates profile)
- Seed `games` table with all 50+ entries (only 3 marked `status='live'`, rest `coming_soon`)
- Realtime publication for `clan_messages`

**2. Server functions (AI content)**
- `src/lib/games.functions.ts` → `generateGameContent({ game, difficulty, language })` calls Lovable AI (`google/gemini-3-flash-preview`) returning structured JSON (word lists, memory pairs, hangman words). Uses `requireSupabaseAuth`.
- `submitGameScore` server fn calls the SQL RPC.

**3. Playable games (pure React + Tailwind)**
- `/games` — hub listing all games filtered by category, with live vs coming-soon badges
- `/games/word-catcher` — falling words, click to translate match, 60s timer
- `/games/memory-match` — flip cards, match word↔translation pairs
- `/games/hangman` — guess translation letter by letter

Each game: fetch AI content on start → play → submit score → toast XP/coins earned.

**4. Leaderboard**
- `/leaderboard` — tabs for XP / Coins / Translations, top 100 from `profiles`, highlights current user's rank

**5. Clans (basic + realtime)**
- `/clans` — list all clans, create clan dialog, join button
- `/clans/$clanId` — member list, realtime chat panel (Supabase Realtime on `clan_messages`), leave button
- Clan total_xp aggregates as members earn XP

**6. Navigation**
- Header gets links: Games, Leaderboard, Clans

## Technical notes

- All AI calls server-side; client never sees `LOVABLE_API_KEY`.
- Score submission validates server-side (max XP per session capped to prevent cheating).
- RLS: clan_messages readable only by members; games table public read; game_sessions own-row.
- Realtime chat uses `supabase.channel().on('postgres_changes')` on `clan_messages`.
- Reuses existing `coins`/`xp` columns on `profiles` — no duplicate wallet.

## Out of scope (next phases)

Teams, country/weekly/monthly leaderboards, tournaments, clan wars, achievements UI, titles/badges/skins integration with rewards, the other 47+ playable games (scaffolded as "coming soon" entries).

## File map

```text
supabase/migrations/<ts>_gamification_mvp.sql
src/lib/games.functions.ts
src/lib/ai-gateway.server.ts        (if missing)
src/routes/games.tsx                (hub)
src/routes/games.word-catcher.tsx
src/routes/games.memory-match.tsx
src/routes/games.hangman.tsx
src/routes/leaderboard.tsx
src/routes/clans.tsx
src/routes/clans.$clanId.tsx
src/components/games/GameCard.tsx
src/components/clans/ClanChat.tsx
src/components/site/Header.tsx      (add nav links)
```