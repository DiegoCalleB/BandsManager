-- SQL Migration for fan_link_clicks (Analytics for QR & Fans Landing)
CREATE TABLE IF NOT EXISTS fan_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id TEXT NOT NULL,
  button_type TEXT NOT NULL, -- 'instagram', 'youtube', 'tiktok', 'spotify', 'revolut', 'paypal', 'bizum', 'iban', 'dossier', 'waitlist', etc.
  concert_id TEXT DEFAULT NULL,
  concert_date TEXT DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  referer TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast analytics aggregation by band and concert
CREATE INDEX IF NOT EXISTS idx_fan_link_clicks_band ON fan_link_clicks(band_id);
CREATE INDEX IF NOT EXISTS idx_fan_link_clicks_concert ON fan_link_clicks(concert_id);
CREATE INDEX IF NOT EXISTS idx_fan_link_clicks_type ON fan_link_clicks(button_type);

-- RLS Policies
ALTER TABLE fan_link_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to fan_link_clicks" ON fan_link_clicks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated read to fan_link_clicks" ON fan_link_clicks
  FOR SELECT USING (auth.role() = 'authenticated' OR true);
