-- Enable Supabase Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE races;
ALTER PUBLICATION supabase_realtime ADD TABLE legs;
ALTER PUBLICATION supabase_realtime ADD TABLE runners;
