
-- ============ Games catalog ============
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🎮',
  xp_reward INT NOT NULL DEFAULT 10,
  coin_reward INT NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'coming_soon',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.games TO anon, authenticated;
GRANT ALL ON public.games TO service_role;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view games" ON public.games FOR SELECT USING (true);

-- ============ Game sessions ============
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_code TEXT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  xp_earned INT NOT NULL DEFAULT 0,
  coins_earned INT NOT NULL DEFAULT 0,
  duration_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_game_sessions_user ON public.game_sessions(user_id, created_at DESC);
CREATE INDEX idx_game_sessions_game ON public.game_sessions(game_code, created_at DESC);
GRANT SELECT, INSERT ON public.game_sessions TO authenticated;
GRANT ALL ON public.game_sessions TO service_role;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own sessions" ON public.game_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON public.game_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ Clans ============
CREATE TABLE public.clans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  tag TEXT NOT NULL UNIQUE,
  description TEXT,
  emoji TEXT NOT NULL DEFAULT '🛡️',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_count INT NOT NULL DEFAULT 1,
  total_xp INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clans_total_xp ON public.clans(total_xp DESC);
GRANT SELECT ON public.clans TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.clans TO authenticated;
GRANT ALL ON public.clans TO service_role;
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view clans" ON public.clans FOR SELECT USING (true);
CREATE POLICY "Owner can update clan" ON public.clans FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete clan" ON public.clans FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- ============ Clan members ============
CREATE TABLE public.clan_members (
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contributed_xp INT NOT NULL DEFAULT 0,
  PRIMARY KEY (clan_id, user_id)
);
CREATE UNIQUE INDEX idx_clan_members_user ON public.clan_members(user_id);
GRANT SELECT ON public.clan_members TO anon, authenticated;
GRANT ALL ON public.clan_members TO service_role;
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view clan members" ON public.clan_members FOR SELECT USING (true);

-- Security definer helper to check membership without recursion
CREATE OR REPLACE FUNCTION public.is_clan_member(_clan_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.clan_members WHERE clan_id = _clan_id AND user_id = _user_id);
$$;

-- ============ Clan messages ============
CREATE TABLE public.clan_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clan_messages_clan ON public.clan_messages(clan_id, created_at DESC);
GRANT SELECT, INSERT ON public.clan_messages TO authenticated;
GRANT ALL ON public.clan_messages TO service_role;
ALTER TABLE public.clan_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view clan messages" ON public.clan_messages FOR SELECT TO authenticated
  USING (public.is_clan_member(clan_id, auth.uid()));
CREATE POLICY "Members can send clan messages" ON public.clan_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_clan_member(clan_id, auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_messages;

-- ============ RPCs ============

-- Submit game score; awards XP and coins atomically, updates clan xp.
CREATE OR REPLACE FUNCTION public.submit_game_score(_game_code TEXT, _score INT, _duration_seconds INT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_game public.games%ROWTYPE;
  v_xp INT;
  v_coins INT;
  v_clan_id UUID;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT * INTO v_game FROM public.games WHERE code = _game_code AND status = 'live';
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'game_not_available'); END IF;

  -- Reward scales with score (capped to prevent cheating)
  v_xp := LEAST(v_game.xp_reward * GREATEST(1, _score / 5), v_game.xp_reward * 20);
  v_coins := LEAST(v_game.coin_reward * GREATEST(1, _score / 10), v_game.coin_reward * 10);

  INSERT INTO public.game_sessions (user_id, game_code, score, xp_earned, coins_earned, duration_seconds)
    VALUES (v_user, _game_code, _score, v_xp, v_coins, _duration_seconds);

  UPDATE public.profiles
    SET xp = xp + v_xp,
        coins = coins + v_coins,
        level = GREATEST(1, ((xp + v_xp) / 100) + 1),
        last_activity_date = CURRENT_DATE,
        updated_at = now()
    WHERE id = v_user;

  INSERT INTO public.coin_transactions (user_id, kind, amount, balance_after, reason, ref_type)
    SELECT v_user, 'earn'::public.coin_tx_kind, v_coins,
           (SELECT coins FROM public.profiles WHERE id = v_user),
           'Game reward: ' || v_game.name, 'game';

  -- Contribute to clan
  SELECT clan_id INTO v_clan_id FROM public.clan_members WHERE user_id = v_user;
  IF v_clan_id IS NOT NULL THEN
    UPDATE public.clans SET total_xp = total_xp + v_xp, updated_at = now() WHERE id = v_clan_id;
    UPDATE public.clan_members SET contributed_xp = contributed_xp + v_xp WHERE clan_id = v_clan_id AND user_id = v_user;
  END IF;

  RETURN jsonb_build_object('ok', true, 'xp_earned', v_xp, 'coins_earned', v_coins);
END;
$$;

-- Create clan
CREATE OR REPLACE FUNCTION public.create_clan(_name TEXT, _tag TEXT, _description TEXT DEFAULT NULL, _emoji TEXT DEFAULT '🛡️')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_clan_id UUID;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF EXISTS (SELECT 1 FROM public.clan_members WHERE user_id = v_user) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_in_clan');
  END IF;
  IF length(trim(_name)) < 3 OR length(trim(_name)) > 32 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_name');
  END IF;
  IF length(trim(_tag)) < 2 OR length(trim(_tag)) > 6 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_tag');
  END IF;

  INSERT INTO public.clans (name, tag, description, emoji, owner_id)
    VALUES (trim(_name), upper(trim(_tag)), _description, COALESCE(_emoji, '🛡️'), v_user)
    RETURNING id INTO v_clan_id;

  INSERT INTO public.clan_members (clan_id, user_id, role) VALUES (v_clan_id, v_user, 'owner');

  RETURN jsonb_build_object('ok', true, 'clan_id', v_clan_id);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('ok', false, 'error', 'name_or_tag_taken');
END;
$$;

-- Join clan
CREATE OR REPLACE FUNCTION public.join_clan(_clan_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF EXISTS (SELECT 1 FROM public.clan_members WHERE user_id = v_user) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_in_clan');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.clans WHERE id = _clan_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'clan_not_found');
  END IF;
  INSERT INTO public.clan_members (clan_id, user_id, role) VALUES (_clan_id, v_user, 'member');
  UPDATE public.clans SET member_count = member_count + 1, updated_at = now() WHERE id = _clan_id;
  RETURN jsonb_build_object('ok', true, 'clan_id', _clan_id);
END;
$$;

-- Leave clan
CREATE OR REPLACE FUNCTION public.leave_clan()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_clan_id UUID;
  v_role TEXT;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT clan_id, role INTO v_clan_id, v_role FROM public.clan_members WHERE user_id = v_user;
  IF v_clan_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_in_clan'); END IF;

  DELETE FROM public.clan_members WHERE user_id = v_user;

  IF v_role = 'owner' THEN
    -- Disband the clan if owner leaves
    DELETE FROM public.clans WHERE id = v_clan_id;
  ELSE
    UPDATE public.clans SET member_count = GREATEST(1, member_count - 1), updated_at = now() WHERE id = v_clan_id;
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ============ Seed games ============
INSERT INTO public.games (code, name, category, description, icon, xp_reward, coin_reward, status, sort_order) VALUES
-- Live (3)
('word-catcher', 'Word Catcher', 'speed', 'Catch falling words by matching them with their translation before time runs out.', '🪂', 15, 8, 'live', 1),
('memory-match', 'Memory Match', 'memory', 'Flip cards to match word pairs with their translations. Train your memory.', '🧠', 12, 6, 'live', 2),
('hangman-translator', 'Hangman Translator', 'vocabulary', 'Classic hangman with a twist — guess the translation letter by letter.', '🪢', 10, 5, 'live', 3),
-- Vocabulary (coming soon)
('synonym-train', 'Synonym Train', 'vocabulary', 'Chain words together by their synonyms across languages.', '🚂', 10, 5, 'coming_soon', 10),
('missing-link', 'Missing Link', 'vocabulary', 'Fill in the missing word that connects two related sentences.', '🔗', 10, 5, 'coming_soon', 11),
('vocab-bingo', 'Vocab Bingo', 'vocabulary', 'Get five translations in a row to win.', '🎱', 10, 5, 'coming_soon', 12),
('word-builder', 'Word Builder', 'vocabulary', 'Construct words from scrambled letters.', '🔤', 10, 5, 'coming_soon', 13),
('flash-vocab', 'Flash Vocab', 'vocabulary', 'Lightning-fast vocabulary recall test.', '⚡', 10, 5, 'coming_soon', 14),
('etymology-explorer', 'Etymology Explorer', 'vocabulary', 'Trace word origins across languages.', '🗺️', 12, 6, 'coming_soon', 15),
-- Grammar
('grammar-gauntlet', 'Grammar Gauntlet', 'grammar', 'Survive waves of grammar challenges.', '⚔️', 12, 6, 'coming_soon', 20),
('tense-master', 'Tense Master', 'grammar', 'Conjugate verbs across every tense.', '⏳', 12, 6, 'coming_soon', 21),
('article-attack', 'Article Attack', 'grammar', 'Pick the right article before the timer ends.', '🛡️', 10, 5, 'coming_soon', 22),
('preposition-puzzle', 'Preposition Puzzle', 'grammar', 'Drop the correct preposition into context.', '🧩', 10, 5, 'coming_soon', 23),
('sentence-builder', 'Sentence Builder', 'grammar', 'Drag words to build grammatically correct sentences.', '🏗️', 12, 6, 'coming_soon', 24),
('gender-guess', 'Gender Guess', 'grammar', 'Identify noun gender for gendered languages.', '⚧️', 10, 5, 'coming_soon', 25),
-- Translation
('translation-duel', 'Translation Duel', 'multiplayer', 'Race another player to translate the same sentence first.', '⚔️', 20, 10, 'coming_soon', 30),
('translation-crossword', 'Translation Crossword', 'translation', 'Solve a crossword where clues are translations.', '🔠', 15, 8, 'coming_soon', 31),
('idiom-detective', 'Idiom Detective', 'translation', 'Decode tricky idioms and pick the right meaning.', '🕵️', 14, 7, 'coming_soon', 32),
('localization-hero', 'Localization Hero', 'translation', 'Adapt slogans for different cultures and markets.', '🌐', 15, 8, 'coming_soon', 33),
('reverse-translate', 'Reverse Translate', 'translation', 'Translate from your target language back to your native one.', '↩️', 12, 6, 'coming_soon', 34),
('subtitle-sprint', 'Subtitle Sprint', 'translation', 'Translate movie subtitles before the next scene plays.', '🎬', 15, 8, 'coming_soon', 35),
-- Pronunciation
('pronounce-perfect', 'Pronounce Perfect', 'pronunciation', 'Record yourself and beat the AI pronunciation scorer.', '🎤', 14, 7, 'coming_soon', 40),
('accent-coach', 'Accent Coach', 'pronunciation', 'Match a native accent step by step.', '🗣️', 14, 7, 'coming_soon', 41),
('tongue-twister', 'Tongue Twister', 'pronunciation', 'Survive the trickiest sentences in your target language.', '👅', 12, 6, 'coming_soon', 42),
('rhyme-time', 'Rhyme Time', 'pronunciation', 'Find rhyming words in any language.', '🎵', 10, 5, 'coming_soon', 43),
-- Listening
('audio-rush', 'Audio Rush', 'listening', 'Type what you hear in a target language.', '🎧', 14, 7, 'coming_soon', 50),
('dictation-master', 'Dictation Master', 'listening', 'Long-form listening dictation drills.', '✍️', 14, 7, 'coming_soon', 51),
('podcast-pause', 'Podcast Pause', 'listening', 'Pause real podcasts and answer comprehension questions.', '🎙️', 15, 8, 'coming_soon', 52),
('song-lyrics', 'Song Lyrics', 'listening', 'Fill in missing lyrics from songs in your target language.', '🎶', 12, 6, 'coming_soon', 53),
-- Memory
('flashcard-frenzy', 'Flashcard Frenzy', 'memory', 'Beat the clock through hundreds of flashcards.', '🃏', 12, 6, 'coming_soon', 60),
('chain-recall', 'Chain Recall', 'memory', 'Remember growing chains of vocabulary.', '⛓️', 12, 6, 'coming_soon', 61),
('image-recall', 'Image Recall', 'memory', 'Match images to the words you saw seconds ago.', '🖼️', 12, 6, 'coming_soon', 62),
('story-recall', 'Story Recall', 'memory', 'Read a short story and answer detail questions.', '📖', 13, 6, 'coming_soon', 63),
-- Speed
('beat-the-clock', 'Beat the Clock', 'speed', 'Translate as many words as possible in 60 seconds.', '⏱️', 15, 8, 'coming_soon', 70),
('bubble-sort', 'Bubble Sort', 'speed', 'Pop bubbles in order of correct translation.', '🫧', 12, 6, 'coming_soon', 71),
('speed-spell', 'Speed Spell', 'speed', 'Spell translations faster than your opponent.', '🌀', 12, 6, 'coming_soon', 72),
('rapid-fire', 'Rapid Fire', 'speed', 'A rapid-fire quiz with bonuses for combos.', '🔥', 14, 7, 'coming_soon', 73),
-- Visual / Other
('visual-translator', 'Visual Translator', 'translation', 'Identify objects in images by their target-language name.', '👁️', 13, 6, 'coming_soon', 80),
('emoji-translator', 'Emoji Translator', 'vocabulary', 'Translate emojis into sentences.', '😀', 10, 5, 'coming_soon', 81),
('picture-story', 'Picture Story', 'vocabulary', 'Build a story from a sequence of images.', '🖼️', 12, 6, 'coming_soon', 82),
('map-quest', 'Map Quest', 'vocabulary', 'Travel a language map and pick up words on the way.', '🗺️', 12, 6, 'coming_soon', 83),
-- Multiplayer
('clan-war', 'Clan War', 'multiplayer', 'Compete as a clan against another clan in a 10-minute battle.', '🏰', 25, 12, 'coming_soon', 90),
('team-relay', 'Team Relay', 'multiplayer', 'Translate together as a team — pass the baton fast.', '🏃', 20, 10, 'coming_soon', 91),
('global-quiz', 'Global Quiz', 'multiplayer', 'Daily quiz played by everyone at once.', '🌍', 18, 9, 'coming_soon', 92),
('coop-story', 'Co-op Story', 'multiplayer', 'Co-write a translated story with a partner.', '✍️', 16, 8, 'coming_soon', 93),
-- Mix / Bonus
('crossword-classic', 'Crossword Classic', 'vocabulary', 'A daily classic crossword in your target language.', '🔡', 14, 7, 'coming_soon', 100),
('word-search', 'Word Search', 'vocabulary', 'Find hidden translations in a grid of letters.', '🔍', 10, 5, 'coming_soon', 101),
('anagram-hunt', 'Anagram Hunt', 'vocabulary', 'Unscramble anagrams across languages.', '🔀', 12, 6, 'coming_soon', 102),
('proverb-puzzle', 'Proverb Puzzle', 'translation', 'Match proverbs across cultures.', '📜', 14, 7, 'coming_soon', 103),
('news-decoder', 'News Decoder', 'translation', 'Translate the day''s news headlines.', '📰', 15, 8, 'coming_soon', 104),
('cooking-class', 'Cooking Class', 'vocabulary', 'Learn vocabulary by following a recipe.', '🍳', 12, 6, 'coming_soon', 105),
('travel-phrases', 'Travel Phrases', 'vocabulary', 'Master phrases for every travel scenario.', '✈️', 12, 6, 'coming_soon', 106),
('business-lingo', 'Business Lingo', 'vocabulary', 'Master business terminology in any language.', '💼', 14, 7, 'coming_soon', 107),
('formal-vs-casual', 'Formal vs Casual', 'grammar', 'Pick the right register for each context.', '🎭', 12, 6, 'coming_soon', 108),
('false-friends', 'False Friends', 'vocabulary', 'Spot tricky words that look the same but mean different things.', '🎭', 13, 6, 'coming_soon', 109);
