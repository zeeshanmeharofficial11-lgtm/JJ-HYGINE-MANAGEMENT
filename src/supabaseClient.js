// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oxuvoabnwrmdhkgdejfc.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94dXZvYWJud3JtZGhrZ2RlamZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTM2NDAsImV4cCI6MjA3OTA2OTY0MH0._26C_tWQC5Thxe8u9jd8qnYvdlpFebm8QKYuQxs6BIk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
