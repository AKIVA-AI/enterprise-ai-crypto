-- Create tradeable_instruments table for coin universe management
CREATE TABLE public.tradeable_instruments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  base_asset TEXT NOT NULL,
  quote_asset TEXT NOT NULL DEFAULT 'USD',
  venue TEXT NOT NULL,
  product_type TEXT NOT NULL DEFAULT 'spot',
  tier INTEGER NOT NULL DEFAULT 3,
  is_us_compliant BOOLEAN NOT NULL DEFAULT true,
  min_order_size NUMERIC DEFAULT 0,
  tick_size NUMERIC DEFAULT 0.01,
  maker_fee NUMERIC DEFAULT 0.001,
  taker_fee NUMERIC DEFAULT 0.002,
  volume_24h NUMERIC DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(symbol, venue, product_type)
);

-- Add composite scoring fields to intelligence_signals
ALTER TABLE public.intelligence_signals
ADD COLUMN IF NOT EXISTS composite_score NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS factor_scores JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_high_probability BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS venue TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'spot';

-- Create index for high probability signals
CREATE INDEX IF NOT EXISTS idx_intelligence_signals_high_prob 
ON public.intelligence_signals(is_high_probability, composite_score DESC) 
WHERE is_high_probability = true;

-- Create index for tradeable instruments lookup
CREATE INDEX IF NOT EXISTS idx_tradeable_instruments_venue_active 
ON public.tradeable_instruments(venue, is_active, tier);

CREATE INDEX IF NOT EXISTS idx_tradeable_instruments_symbol 
ON public.tradeable_instruments(symbol);

-- Enable RLS on tradeable_instruments
ALTER TABLE public.tradeable_instruments ENABLE ROW LEVEL SECURITY;

-- RLS policies for tradeable_instruments
CREATE POLICY "Authenticated users can read tradeable instruments" 
ON public.tradeable_instruments 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage tradeable instruments" 
ON public.tradeable_instruments 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_tradeable_instruments_updated_at
BEFORE UPDATE ON public.tradeable_instruments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Insert Tier 1: Coinbase Futures coins
INSERT INTO public.tradeable_instruments (symbol, base_asset, quote_asset, venue, product_type, tier, is_us_compliant) VALUES
('BTC-USD', 'BTC', 'USD', 'coinbase', 'futures', 1, true),
('ETH-USD', 'ETH', 'USD', 'coinbase', 'futures', 1, true),
('SOL-USD', 'SOL', 'USD', 'coinbase', 'futures', 1, true),
('XRP-USD', 'XRP', 'USD', 'coinbase', 'futures', 1, true),
('DOGE-USD', 'DOGE', 'USD', 'coinbase', 'futures', 1, true),
('AVAX-USD', 'AVAX', 'USD', 'coinbase', 'futures', 1, true),
('LINK-USD', 'LINK', 'USD', 'coinbase', 'futures', 1, true),
('LTC-USD', 'LTC', 'USD', 'coinbase', 'futures', 1, true),
('BCH-USD', 'BCH', 'USD', 'coinbase', 'futures', 1, true),
('DOT-USD', 'DOT', 'USD', 'coinbase', 'futures', 1, true);

-- Insert Tier 1 as Spot as well
INSERT INTO public.tradeable_instruments (symbol, base_asset, quote_asset, venue, product_type, tier, is_us_compliant) VALUES
('BTC-USD', 'BTC', 'USD', 'coinbase', 'spot', 1, true),
('ETH-USD', 'ETH', 'USD', 'coinbase', 'spot', 1, true),
('SOL-USD', 'SOL', 'USD', 'coinbase', 'spot', 1, true),
('XRP-USD', 'XRP', 'USD', 'coinbase', 'spot', 1, true),
('DOGE-USD', 'DOGE', 'USD', 'coinbase', 'spot', 1, true),
('AVAX-USD', 'AVAX', 'USD', 'coinbase', 'spot', 1, true),
('LINK-USD', 'LINK', 'USD', 'coinbase', 'spot', 1, true),
('LTC-USD', 'LTC', 'USD', 'coinbase', 'spot', 1, true),
('BCH-USD', 'BCH', 'USD', 'coinbase', 'spot', 1, true),
('DOT-USD', 'DOT', 'USD', 'coinbase', 'spot', 1, true);

-- Insert Tier 2: Additional Coinbase Spot US-compliant
INSERT INTO public.tradeable_instruments (symbol, base_asset, quote_asset, venue, product_type, tier, is_us_compliant) VALUES
('MATIC-USD', 'MATIC', 'USD', 'coinbase', 'spot', 2, true),
('ADA-USD', 'ADA', 'USD', 'coinbase', 'spot', 2, true),
('ATOM-USD', 'ATOM', 'USD', 'coinbase', 'spot', 2, true),
('UNI-USD', 'UNI', 'USD', 'coinbase', 'spot', 2, true),
('AAVE-USD', 'AAVE', 'USD', 'coinbase', 'spot', 2, true),
('MKR-USD', 'MKR', 'USD', 'coinbase', 'spot', 2, true),
('COMP-USD', 'COMP', 'USD', 'coinbase', 'spot', 2, true),
('SNX-USD', 'SNX', 'USD', 'coinbase', 'spot', 2, true),
('CRV-USD', 'CRV', 'USD', 'coinbase', 'spot', 2, true),
('FIL-USD', 'FIL', 'USD', 'coinbase', 'spot', 2, true),
('GRT-USD', 'GRT', 'USD', 'coinbase', 'spot', 2, true),
('NEAR-USD', 'NEAR', 'USD', 'coinbase', 'spot', 2, true),
('APT-USD', 'APT', 'USD', 'coinbase', 'spot', 2, true),
('ARB-USD', 'ARB', 'USD', 'coinbase', 'spot', 2, true),
('OP-USD', 'OP', 'USD', 'coinbase', 'spot', 2, true),
('SUI-USD', 'SUI', 'USD', 'coinbase', 'spot', 2, true),
('SEI-USD', 'SEI', 'USD', 'coinbase', 'spot', 2, true),
('INJ-USD', 'INJ', 'USD', 'coinbase', 'spot', 2, true),
('RENDER-USD', 'RENDER', 'USD', 'coinbase', 'spot', 2, true),
('FET-USD', 'FET', 'USD', 'coinbase', 'spot', 2, true);