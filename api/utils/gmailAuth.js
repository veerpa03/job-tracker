// Gmail OAuth2 utilities for backend
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// OAuth2 configuration
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send'
];

/**
 * Create OAuth2 client
 */
export function getOAuth2Client() {
  const redirectUri = process.env.NODE_ENV === 'production'
    ? 'https://viraj-job-tracker.vercel.app/api/gmail/callback'
    : 'http://localhost:5173/api/gmail/callback';

  return new google.auth.OAuth2(
    process.env.VITE_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET, // You'll need to add this to .env
    redirectUri
  );
}

/**
 * Get authorization URL
 */
export function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Save tokens to Supabase
 */
export async function saveTokens(userEmail, tokens) {
  const { data, error } = await supabase
    .from('gmail_tokens')
    .upsert({
      user_email: userEmail,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: tokens.expiry_date,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_email'
    })
    .select();

  if (error) throw error;
  return data;
}

/**
 * Get tokens from Supabase
 */
export async function getTokens(userEmail) {
  const { data, error } = await supabase
    .from('gmail_tokens')
    .select('*')
    .eq('user_email', userEmail)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get authenticated Gmail client
 */
export async function getAuthenticatedGmail(userEmail) {
  const tokenData = await getTokens(userEmail);

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expiry_date: tokenData.token_expiry
  });

  // Check if token needs refresh
  if (Date.now() >= tokenData.token_expiry) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    await saveTokens(userEmail, credentials);
    oauth2Client.setCredentials(credentials);
  }

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Delete tokens (disconnect)
 */
export async function deleteTokens(userEmail) {
  const { error } = await supabase
    .from('gmail_tokens')
    .delete()
    .eq('user_email', userEmail);

  if (error) throw error;
}
