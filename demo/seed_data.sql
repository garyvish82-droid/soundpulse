-- ============================================================
--  SoundCloud UX MCP — Demo Seed Data
--  Realistic synthetic data to power stakeholder demos.
--  Run AFTER schema.sql
-- ============================================================

-- ─── Track Snapshots (50 realistic tracks) ───────────────────────────────────
INSERT INTO track_snapshots (track_id, title, user_id, creator_name, genre, duration_ms, playback_count, likes_count, reposts_count, comment_count, bpm, created_at) VALUES
-- Electronic / Dance
(101, 'Midnight Protocol',          201, 'HVST',         'Electronic',  342000,  284000, 9800,  3200, 412,  128.0, NOW() - INTERVAL '45 days'),
(102, 'Frequency Drift',            202, 'Neon Bloom',   'Electronic',  298000,   71000, 1900,   580, 89,   135.0, NOW() - INTERVAL '30 days'),
(103, 'City Lights (Extended)',     203, 'Pulse Theory', 'Electronic',  438000,  512000, 18400, 6700, 1120, 122.0, NOW() - INTERVAL '60 days'),
(104, 'Bass Architecture',          201, 'HVST',         'Electronic',  267000,   38000, 1200,   390, 67,   140.0, NOW() - INTERVAL '15 days'),
(105, 'Aurora Dreams',              204, 'AmbientLab',   'Ambient',     520000,   95000, 3800,  1100, 203,  90.0,  NOW() - INTERVAL '90 days'),
-- Hip-Hop / Rap
(201, 'Street Theorem Vol.1',       301, 'Verse Craft',  'Hip-hop & Rap', 220000, 178000, 5200, 2100, 890,  87.0,  NOW() - INTERVAL '20 days'),
(202, 'Cipher Season',              302, 'The 90s Kid',  'Hip-hop & Rap', 195000,  42000, 1100,  320, 156,  94.0,  NOW() - INTERVAL '12 days'),
(203, 'Neon Bars',                  303, 'LowKey MC',    'Hip-hop & Rap', 178000,  89000, 2700,  980, 445,  88.0,  NOW() - INTERVAL '35 days'),
(204, 'Late Night Freestyle',       301, 'Verse Craft',  'Hip-hop & Rap', 143000, 310000, 9100, 4200, 1650, 92.0,  NOW() - INTERVAL '8 days'),
(205, 'Block Melody',               304, 'Uptown Sound', 'Hip-hop & Rap', 212000,  67000, 1900,  710, 280,  96.0,  NOW() - INTERVAL '25 days'),
-- House / Techno
(301, 'Deep Meridian',              401, 'Fader 909',    'House',       418000,  234000, 7800,  2900, 380,  126.0, NOW() - INTERVAL '55 days'),
(302, 'Warehouse Protocol',         402, 'Sub Pattern',  'Techno',      612000,   56000, 1400,   430, 71,   138.0, NOW() - INTERVAL '18 days'),
(303, 'Ibiza Calling',              403, 'Solar Deck',   'House',       384000,  890000, 31000, 12000, 2100, 124.0, NOW() - INTERVAL '120 days'),
(304, 'Modular Trance',             401, 'Fader 909',    'Techno',      487000,   28000,  720,   190, 34,   142.0, NOW() - INTERVAL '5 days'),
(305, 'Chicago Roots',              404, 'Deep Craft',   'House',       356000,  145000, 4900,  1800, 312,  122.0, NOW() - INTERVAL '40 days'),
-- Indie / Alternative
(401, 'Glass Architecture',        501, 'Soft Machines', 'Indie',       247000,  34000, 1200,   280, 89,   76.0,  NOW() - INTERVAL '22 days'),
(402, 'Tremolo Season',             502, 'Echo Valley',  'Indie',       312000,   78000, 2900,   920, 201,  82.0,  NOW() - INTERVAL '50 days'),
(403, 'Static Bloom',               503, 'Worn Vinyl',   'Alternative', 289000,   51000, 1700,   490, 134,  84.0,  NOW() - INTERVAL '30 days'),
-- Lo-fi / Chill
(501, 'Coffee & Rain 2am',         601, 'LoFi Brewer',  'Lo-fi',       3600000, 2800000, 89000, 34000, 5200, 75.0, NOW() - INTERVAL '180 days'),
(502, 'Study Session Vol.7',        601, 'LoFi Brewer',  'Lo-fi',       3240000,  980000, 31000, 12000, 1900, 72.0, NOW() - INTERVAL '90 days'),
(503, 'Rainy Day Mix',              602, 'Chill Tape',   'Lo-fi',       5400000,  560000, 18000,  7200, 1100, 70.0, NOW() - INTERVAL '150 days');


-- ─── Retention Events (realistic drop-off curves) ────────────────────────────
-- Track 101: Good retention (Electronic, 128 BPM)
INSERT INTO retention_events (track_id, position_pct, listener_count, session_type, genre) VALUES
(101, 0,   1000, 'organic', 'Electronic'), (101, 5,   920, 'organic', 'Electronic'),
(101, 10,  880, 'organic', 'Electronic'),  (101, 15,  845, 'organic', 'Electronic'),
(101, 20,  820, 'organic', 'Electronic'),  (101, 25,  800, 'organic', 'Electronic'),
(101, 30,  790, 'organic', 'Electronic'),  (101, 40,  775, 'organic', 'Electronic'),
(101, 50,  760, 'organic', 'Electronic'),  (101, 60,  745, 'organic', 'Electronic'),
(101, 70,  720, 'organic', 'Electronic'),  (101, 80,  700, 'organic', 'Electronic'),
(101, 90,  680, 'organic', 'Electronic'),  (101, 100, 650, 'organic', 'Electronic');

-- Track 204: Late Night Freestyle — huge drop at intro (hip-hop, ad/intro problem)
INSERT INTO retention_events (track_id, position_pct, listener_count, session_type, genre) VALUES
(204, 0,   1000, 'search', 'Hip-hop & Rap'), (204, 5,   420, 'search', 'Hip-hop & Rap'),
(204, 10,  380, 'search', 'Hip-hop & Rap'),  (204, 15,  360, 'search', 'Hip-hop & Rap'),
(204, 20,  345, 'search', 'Hip-hop & Rap'),  (204, 25,  335, 'search', 'Hip-hop & Rap'),
(204, 30,  320, 'search', 'Hip-hop & Rap'),  (204, 40,  310, 'search', 'Hip-hop & Rap'),
(204, 50,  305, 'search', 'Hip-hop & Rap'),  (204, 60,  298, 'search', 'Hip-hop & Rap'),
(204, 70,  290, 'search', 'Hip-hop & Rap'),  (204, 80,  280, 'search', 'Hip-hop & Rap'),
(204, 90,  275, 'search', 'Hip-hop & Rap'),  (204, 100, 265, 'search', 'Hip-hop & Rap');

-- Track 303: Ibiza Calling — drop at 60% (length problem)
INSERT INTO retention_events (track_id, position_pct, listener_count, session_type, genre) VALUES
(303, 0,   1000, 'playlist', 'House'), (303, 10,  960, 'playlist', 'House'),
(303, 20,  940, 'playlist', 'House'),  (303, 30,  920, 'playlist', 'House'),
(303, 40,  905, 'playlist', 'House'),  (303, 50,  890, 'playlist', 'House'),
(303, 60,  430, 'playlist', 'House'),  (303, 70,  415, 'playlist', 'House'),
(303, 80,  400, 'playlist', 'House'),  (303, 90,  385, 'playlist', 'House'),
(303, 100, 370, 'playlist', 'House');


-- ─── Search Sessions (discovery gap data) ────────────────────────────────────
INSERT INTO search_sessions (search_term, results_shown, results_clicked, tracks_played, avg_completion_pct, user_segment, genre_expected, genre_found) VALUES
('chill beats to study',      20, 12, 8,  78.4, 'casual',  'Lo-fi',       'Lo-fi'),
('underground techno',        20,  6, 3,  41.2, 'engaged', 'Techno',      'Electronic'),
('boom bap hip hop 90s',      20,  9, 4,  38.7, 'engaged', 'Hip-hop & Rap', 'Hip-hop & Rap'),
('new york drill 2024',       20,  4, 1,  22.1, 'casual',  'Hip-hop & Rap', 'Electronic'),
('deep house summer mix',     20, 14, 9,  65.3, 'power',   'House',       'House'),
('ambient focus music',       20, 11, 7,  82.1, 'casual',  'Ambient',     'Lo-fi'),
('indie rock bedroom pop',    20,  7, 2,  29.4, 'casual',  'Indie',       'Alternative'),
('melodic bass music',        20,  5, 2,  35.8, 'engaged', 'Electronic',  'Electronic'),
('afrobeats workout 2024',    20,  3, 1,  18.9, 'casual',  'Afro House',  'Hip-hop & Rap'),
('lofi hip hop radio',        20, 18, 14, 89.2, 'casual',  'Lo-fi',       'Lo-fi'),
('progressive trance',        20,  8, 5,  52.4, 'power',   'Trance',      'Electronic'),
('r&b new releases',          20,  6, 2,  31.5, 'casual',  'R&B & Soul',  'Hip-hop & Rap'),
('jazz instrumental study',   20, 10, 7,  76.8, 'casual',  'Jazz & Blues','Lo-fi'),
('hardstyle festival',        20, 13, 8,  58.9, 'power',   'Electronic',  'Electronic'),
('singer songwriter guitar',  20,  4, 1,  24.3, 'casual',  'Indie',       'Indie'),
('workout pump up music',     20,  9, 5,  44.7, 'casual',  'Electronic',  'Hip-hop & Rap'),
('minimal techno berlin',     20, 11, 6,  48.2, 'power',   'Techno',      'Techno'),
('trap beats free',           20, 15, 9,  35.6, 'casual',  'Hip-hop & Rap', 'Hip-hop & Rap'),
('drum and bass liquid',      20,  7, 3,  42.1, 'engaged', 'Drum & Bass', 'Electronic'),
('house music classics 90s',  20, 12, 8,  71.3, 'engaged', 'House',       'House');


-- ─── User Sessions ────────────────────────────────────────────────────────────
-- 200 synthetic sessions across 3 segments
INSERT INTO user_sessions (user_segment, tracks_played, tracks_completed, tracks_skipped, session_duration_min, genre_diversity, source, returned_within_24h)
SELECT
    CASE (random()*3)::INT WHEN 0 THEN 'casual' WHEN 1 THEN 'engaged' ELSE 'power' END,
    (random()*8 + 1)::INT,
    (random()*5)::INT,
    (random()*4)::INT,
    round((random()*90 + 5)::numeric, 1),
    round((random())::numeric, 2),
    CASE (random()*4)::INT WHEN 0 THEN 'direct' WHEN 1 THEN 'search' WHEN 2 THEN 'recommendation' ELSE 'playlist' END,
    random() > 0.6
FROM generate_series(1, 200);


-- ─── Creator Engagement ───────────────────────────────────────────────────────
INSERT INTO creator_engagement (creator_id, creator_name, track_count, total_plays, total_likes, total_comments, total_reposts, avg_like_rate, avg_comment_rate, avg_repost_rate, top_genre, follower_count, engagement_score) VALUES
(201, 'HVST',         12, 322000, 11000, 479,  3590,  0.034, 0.00149, 0.0111, 'Electronic',    8400,  72.4),
(202, 'Neon Bloom',    8,  71000,  1900,  89,   580,  0.027, 0.00125, 0.0082, 'Electronic',    2100,  41.2),
(203, 'Pulse Theory', 15, 512000, 18400, 1120, 6700,  0.036, 0.00219, 0.0131, 'Electronic',   21000,  88.7),
(301, 'Verse Craft',  18, 488000, 14300, 2540, 6300,  0.029, 0.00520, 0.0129, 'Hip-hop & Rap', 15200,  81.3),
(302, 'The 90s Kid',   6,  42000,  1100,  156,  320,  0.026, 0.00371, 0.0076, 'Hip-hop & Rap', 3400,   38.9),
(401, 'Fader 909',    20, 262000,  8520,  414, 3090,  0.033, 0.00158, 0.0118, 'Techno',        9800,   68.5),
(403, 'Solar Deck',    9, 890000, 31000, 2100, 12000, 0.035, 0.00236, 0.0135, 'House',        48000,   94.2),
(601, 'LoFi Brewer',   4, 3780000, 120000, 7100, 46000, 0.032, 0.00188, 0.0122, 'Lo-fi',      89000,   96.8);
