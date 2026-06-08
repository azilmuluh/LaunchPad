-- ═══════════════════════════════════════════════════════════════════════════
-- Fix for Supabase Function Parameter Name Conflict
-- Run this in Supabase SQL Editor to fix the check_user_eligibility error
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop existing functions to avoid parameter name conflicts
DROP FUNCTION IF EXISTS check_user_eligibility(JSONB, JSONB);
DROP FUNCTION IF EXISTS calculate_match_score(JSONB, JSONB);

-- Recreate with proper parameter names (prefixed with p_)
CREATE OR REPLACE FUNCTION check_user_eligibility(
  p_user_data JSONB,
  p_opportunity_eligibility JSONB
) RETURNS BOOLEAN AS $$
DECLARE
  user_age INTEGER;
  age_min INTEGER;
  age_max INTEGER;
BEGIN
  -- Age check
  IF p_opportunity_eligibility ? 'age_min' OR p_opportunity_eligibility ? 'age_max' THEN
    user_age := (p_user_data->>'age')::INTEGER;
    IF user_age IS NULL THEN RETURN FALSE; END IF;
    
    age_min := (p_opportunity_eligibility->>'age_min')::INTEGER;
    age_max := (p_opportunity_eligibility->>'age_max')::INTEGER;
    
    IF age_min IS NOT NULL AND user_age < age_min THEN RETURN FALSE; END IF;
    IF age_max IS NOT NULL AND user_age > age_max THEN RETURN FALSE; END IF;
  END IF;
  
  -- Add more eligibility checks as needed
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Match score calculation function
CREATE OR REPLACE FUNCTION calculate_match_score(
  p_user_data JSONB,
  p_opportunity_data JSONB
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Base eligibility = 20 points
  score := 20;
  
  -- Interest alignment (max 30)
  -- Field match (25)
  -- Location match (15)
  -- Fully funded bonus (10)
  
  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- Verify functions were created successfully
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name IN ('check_user_eligibility', 'calculate_match_score')
ORDER BY routine_name;
