
ALTER FUNCTION public.level_for_xp(INT) SET search_path = public;
ALTER FUNCTION public.level_tier(INT) SET search_path = public;
ALTER FUNCTION public.rank_tier_for_points(INT) SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.claim_challenge_reward(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.submit_game_score_v2(TEXT,INT,INT,INT,INT,TEXT,BOOLEAN) FROM anon;
REVOKE EXECUTE ON FUNCTION public.join_tournament(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.finalize_tournament(UUID) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.start_clan_war(UUID,UUID,INT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.finalize_clan_war(UUID) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purchase_cosmetic(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.equip_cosmetic(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.leaderboard_global(TEXT,INT,TEXT,TEXT) TO authenticated, anon;

INSERT INTO public.cosmetics(code,type,name,description,rarity,icon,price_coins,unlock_via) VALUES
  ('title_novice','title'::public.cosmetic_type,'Novice','Just getting started','common'::public.cosmetic_rarity,'🌱',NULL,'achievement'),
  ('title_polyglot','title'::public.cosmetic_type,'Polyglot','Speaks many tongues','rare'::public.cosmetic_rarity,'🗣️',NULL,'achievement'),
  ('title_champion','title'::public.cosmetic_type,'Champion','Tournament victor','epic'::public.cosmetic_rarity,'🏆',NULL,'tournament'),
  ('title_warlord','title'::public.cosmetic_type,'Warlord','Clan war veteran','epic'::public.cosmetic_rarity,'⚔️',NULL,'achievement'),
  ('title_legend','title'::public.cosmetic_type,'Legend','Reached level 100','legendary'::public.cosmetic_rarity,'👑',NULL,'achievement'),
  ('title_streaker','title'::public.cosmetic_type,'Streaker','30-day streak','rare'::public.cosmetic_rarity,'🔥',NULL,'achievement'),
  ('badge_first_win','badge'::public.cosmetic_type,'First Win','Won your first game','common'::public.cosmetic_rarity,'🥇',NULL,'achievement'),
  ('badge_translator','badge'::public.cosmetic_type,'Translator','100 translations','rare'::public.cosmetic_rarity,'🌐',NULL,'achievement'),
  ('badge_grammarian','badge'::public.cosmetic_type,'Grammarian','Grammar master','epic'::public.cosmetic_rarity,'📚',NULL,'achievement'),
  ('badge_speedster','badge'::public.cosmetic_type,'Speedster','Won 10 speed games','rare'::public.cosmetic_rarity,'⚡',NULL,'achievement'),
  ('badge_clan_hero','badge'::public.cosmetic_type,'Clan Hero','Top clan contributor','epic'::public.cosmetic_rarity,'🛡️',NULL,'achievement'),
  ('frame_bronze','frame'::public.cosmetic_type,'Bronze Frame','Bronze tier reward','common'::public.cosmetic_rarity,'🟫',500,'shop'),
  ('frame_silver','frame'::public.cosmetic_type,'Silver Frame','Silver tier reward','rare'::public.cosmetic_rarity,'⬜',1500,'shop'),
  ('frame_gold','frame'::public.cosmetic_type,'Gold Frame','Gold tier reward','epic'::public.cosmetic_rarity,'🟨',5000,'shop'),
  ('frame_diamond','frame'::public.cosmetic_type,'Diamond Frame','Diamond tier reward','legendary'::public.cosmetic_rarity,'💎',15000,'shop'),
  ('frame_mythic','frame'::public.cosmetic_type,'Mythic Frame','Only the worthy','mythic'::public.cosmetic_rarity,'✨',50000,'shop'),
  ('skin_char_neon','character_skin'::public.cosmetic_type,'Neon Avatar','Glowing neon character','rare'::public.cosmetic_rarity,'🌈',2000,'shop'),
  ('skin_char_cyber','character_skin'::public.cosmetic_type,'Cyber Avatar','Cyberpunk style','epic'::public.cosmetic_rarity,'🤖',5000,'shop'),
  ('skin_char_galaxy','character_skin'::public.cosmetic_type,'Galaxy Avatar','Cosmic energy','legendary'::public.cosmetic_rarity,'🌌',12000,'shop'),
  ('skin_comp_dragon','companion_skin'::public.cosmetic_type,'Dragon Owl','Fierce dragon owl','epic'::public.cosmetic_rarity,'🐉',6000,'shop'),
  ('skin_comp_phoenix','companion_skin'::public.cosmetic_type,'Phoenix Owl','Reborn from flames','legendary'::public.cosmetic_rarity,'🔥',15000,'shop'),
  ('accessory_crown','accessory'::public.cosmetic_type,'Royal Crown','For royalty only','legendary'::public.cosmetic_rarity,'👑',20000,'shop'),
  ('accessory_glasses','accessory'::public.cosmetic_type,'Smart Glasses','Look smarter','common'::public.cosmetic_rarity,'👓',300,'shop'),
  ('accessory_halo','accessory'::public.cosmetic_type,'Halo','Heavenly aura','epic'::public.cosmetic_rarity,'😇',8000,'shop')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.achievements(code,title,description,icon,xp_reward,category,coin_reward,condition_type,condition_target,rarity) VALUES
  ('first_win','First Victory','Win your first game','trophy',50,'games',25,'wins',1,'common'::public.cosmetic_rarity),
  ('ten_wins','Hot Streak','Win 10 games','flame',200,'games',100,'wins',10,'common'::public.cosmetic_rarity),
  ('hundred_wins','Centurion','Win 100 games','medal',1000,'games',500,'wins',100,'rare'::public.cosmetic_rarity),
  ('thousand_wins','Champion','Win 1000 games','crown',10000,'games',5000,'wins',1000,'legendary'::public.cosmetic_rarity),
  ('first_game','Getting Started','Play your first game','play',25,'games',10,'games',1,'common'::public.cosmetic_rarity),
  ('fifty_games','Dedicated','Play 50 games','gamepad',500,'games',250,'games',50,'common'::public.cosmetic_rarity),
  ('xp_1k','Rising Star','Earn 1,000 XP','star',100,'loyalty',50,'xp',1000,'common'::public.cosmetic_rarity),
  ('xp_10k','XP Master','Earn 10,000 XP','sparkles',500,'loyalty',250,'xp',10000,'rare'::public.cosmetic_rarity),
  ('xp_100k','XP Legend','Earn 100,000 XP','zap',5000,'loyalty',2500,'xp',100000,'epic'::public.cosmetic_rarity),
  ('streak_7','Week Warrior','7-day streak','fire',200,'loyalty',100,'streak',7,'common'::public.cosmetic_rarity),
  ('streak_30','Monthly Master','30-day streak','flame',1000,'loyalty',500,'streak',30,'rare'::public.cosmetic_rarity),
  ('streak_100','Centennial','100-day streak','bolt',5000,'loyalty',2500,'streak',100,'epic'::public.cosmetic_rarity),
  ('streak_365','Year of Mastery','365-day streak','crown',25000,'loyalty',10000,'streak',365,'legendary'::public.cosmetic_rarity),
  ('words_100','Word Collector','Learn 100 words','book',150,'vocabulary',75,'words',100,'common'::public.cosmetic_rarity),
  ('words_1k','Lexicon Builder','Learn 1,000 words','library',1000,'vocabulary',500,'words',1000,'rare'::public.cosmetic_rarity),
  ('words_10k','Word Sage','Learn 10,000 words','scroll',10000,'vocabulary',5000,'words',10000,'legendary'::public.cosmetic_rarity),
  ('level_25','Explorer','Reach level 25','compass',500,'loyalty',250,'level',25,'common'::public.cosmetic_rarity),
  ('level_50','Translator','Reach level 50','globe',2000,'loyalty',1000,'level',50,'rare'::public.cosmetic_rarity),
  ('level_75','Expert','Reach level 75','brain',5000,'loyalty',2500,'level',75,'epic'::public.cosmetic_rarity),
  ('level_100','Master Linguist','Reach level 100','crown',15000,'loyalty',7500,'level',100,'legendary'::public.cosmetic_rarity)
ON CONFLICT (code) DO UPDATE
  SET coin_reward = EXCLUDED.coin_reward,
      condition_type = EXCLUDED.condition_type,
      condition_target = EXCLUDED.condition_target,
      category = EXCLUDED.category,
      rarity = EXCLUDED.rarity;

WITH d AS (
  SELECT date_trunc('day', now()) AS day_start,
         date_trunc('week', now()) AS week_start,
         date_trunc('month', now()) AS month_start
)
INSERT INTO public.challenges(kind,code,title,description,metric,target,xp_reward,coin_reward,starts_at,ends_at)
SELECT 'daily'::public.challenge_kind,'d_play_3','Daily Grinder','Play 3 games today','games_played',3,150,50, day_start, day_start + interval '1 day' FROM d
UNION ALL SELECT 'daily'::public.challenge_kind,'d_wins_2','Daily Victor','Win 2 games today','wins',2,200,75, day_start, day_start + interval '1 day' FROM d
UNION ALL SELECT 'daily'::public.challenge_kind,'d_xp_300','Daily XP Hunter','Earn 300 XP today','xp_earned',300,100,40, day_start, day_start + interval '1 day' FROM d
UNION ALL SELECT 'weekly'::public.challenge_kind,'w_play_20','Weekly Marathon','Play 20 games this week','games_played',20,1000,400, week_start, week_start + interval '1 week' FROM d
UNION ALL SELECT 'weekly'::public.challenge_kind,'w_wins_10','Weekly Conqueror','Win 10 games this week','wins',10,1500,600, week_start, week_start + interval '1 week' FROM d
UNION ALL SELECT 'weekly'::public.challenge_kind,'w_xp_5k','Weekly XP Master','Earn 5,000 XP','xp_earned',5000,1200,500, week_start, week_start + interval '1 week' FROM d
UNION ALL SELECT 'monthly'::public.challenge_kind,'m_play_100','Monthly Legend','Play 100 games','games_played',100,5000,2500, month_start, month_start + interval '1 month' FROM d
UNION ALL SELECT 'monthly'::public.challenge_kind,'m_wins_50','Monthly Champion','Win 50 games','wins',50,7500,4000, month_start, month_start + interval '1 month' FROM d
UNION ALL SELECT 'monthly'::public.challenge_kind,'m_xp_25k','Monthly XP King','Earn 25,000 XP','xp_earned',25000,10000,5000, month_start, month_start + interval '1 month' FROM d
ON CONFLICT (kind,code,starts_at) DO NOTHING;

INSERT INTO public.tournaments(name,description,kind,status,starts_at,ends_at,entry_cost,xp_pool,coin_pool)
SELECT 'Weekend Showdown','Top scorers win big','weekly'::public.challenge_kind,'active'::public.tournament_status, now(), now() + interval '7 days', 50, 20000, 10000
WHERE NOT EXISTS (SELECT 1 FROM public.tournaments WHERE name='Weekend Showdown');

INSERT INTO public.events(code,name,description,xp_multiplier,coin_multiplier,starts_at,ends_at,banner_color)
VALUES('weekend_boost','Weekend XP Boost','2x XP all weekend!',2.0,1.5, date_trunc('week', now()) + interval '5 days', date_trunc('week', now()) + interval '7 days','#f59e0b')
ON CONFLICT (code) DO UPDATE SET xp_multiplier = EXCLUDED.xp_multiplier;
