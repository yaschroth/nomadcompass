/**
 * Supabase Configuration for The Nomad HQ
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Replace the placeholder values below with your project's credentials
 * 3. See SUPABASE_SETUP.md for detailed instructions
 */

// Supabase project credentials
const SUPABASE_URL = 'https://bpcysxxfzpqpeekhxvme.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwY3lzeHhmenBxcGVla2h4dm1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzQ4NTIsImV4cCI6MjA4ODY1MDg1Mn0.tBumq3dQ3JuatJqpiIqElsJVG53Ufnvxr3g5yvwa2jc';

// Initialize Supabase client (loaded from CDN)
let supabaseClient = null;

function initSupabase() {
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseClient;
  } else {
    console.warn('Supabase SDK not loaded. Voting will use localStorage fallback.');
    return null;
  }
}

function getSupabase() {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
}

// Check if Supabase is properly configured
function isSupabaseConfigured() {
  return SUPABASE_URL !== 'https://YOUR_PROJECT_ID.supabase.co' &&
         SUPABASE_ANON_KEY !== 'YOUR_ANON_KEY_HERE';
}
