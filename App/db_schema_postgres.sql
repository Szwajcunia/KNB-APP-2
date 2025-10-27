-- Postgres schema for 4 panels

-- Users and roles
CREATE TYPE user_role AS ENUM ('dispatcher','versand','komisjon','admin');

CREATE TABLE app_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'komisjon',
  pin_hash TEXT, -- store bcrypt here
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Loading lists (zakładka 3)
CREATE TABLE load_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL,           -- Numer listy
  title TEXT NOT NULL,            -- Nazwa listy
  destination TEXT NOT NULL,      -- Miejsce rozładunku
  planned_time TIMESTAMPTZ,       -- Planowany czas
  planned_qty INTEGER NOT NULL DEFAULT 0,
  actual_qty INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'planowana',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trucks (kolejka + stan)
CREATE TYPE truck_status AS ENUM ('czeka','wTrakcie','zaladowana');

CREATE TABLE truck (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate TEXT NOT NULL UNIQUE,     -- rejestracja
  forwarder TEXT,                 -- spedycja
  status truck_status NOT NULL DEFAULT 'czeka',
  assigned_list_id UUID REFERENCES load_list(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- YARD bays / places as on screen (opcjonalnie do zakładki 1)
CREATE TYPE bay_state AS ENUM ('PUSTE','OCZEKUJE','ZAŁADUNEK','GOTOWE');
CREATE TABLE bay (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  state bay_state NOT NULL DEFAULT 'PUSTE',
  current_truck_id UUID REFERENCES truck(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Simple audit
CREATE TABLE event_log (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);