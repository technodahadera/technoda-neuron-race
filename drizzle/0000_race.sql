CREATE TABLE rooms (
  code TEXT PRIMARY KEY,
  secret TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'lobby',
  expires INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE players (
  token TEXT PRIMARY KEY,
  code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  correct INTEGER NOT NULL DEFAULT 0,
  turn INTEGER NOT NULL DEFAULT 0,
  solved TEXT NOT NULL DEFAULT '[]',
  finished INTEGER,
  UNIQUE(code, name)
);
