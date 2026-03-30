// Handle Gmail OAuth callback
import { getTokensFromCode, saveTokens, getOAuth2Client } from '../utils/gmailAuth.js';
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, error } = req.query;

  if (error) {
    return res.redirect(`/?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing' });
  }

  try {
    console.log('[Callback] Starting OAuth callback');
    console.log('[Callback] Has CLIENT_ID:', !!process.env.VITE_GOOGLE_CLIENT_ID);
    console.log('[Callback] Has CLIENT_SECRET:', !!process.env.GOOGLE_CLIENT_SECRET);

    // Exchange code for tokens
    console.log('[Callback] Exchanging code for tokens...');
    const tokens = await getTokensFromCode(code);
    console.log('[Callback] Tokens received:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date
    });

    // Get user's email from ID token (simpler than API call)
    console.log('[Callback] Extracting email from tokens...');
    let userEmail;

    if (tokens.id_token) {
      // Decode ID token to get email (it's a JWT)
      const base64Payload = tokens.id_token.split('.')[1];
      const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
      userEmail = payload.email;
      console.log('[Callback] Email from ID token:', userEmail);
    } else {
      // Fallback to userinfo API
      console.log('[Callback] No ID token, using userinfo API...');
      const oauth2Client = getOAuth2Client();
      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data } = await oauth2.userinfo.get();
      userEmail = data.email;
      console.log('[Callback] Email from userinfo:', userEmail);
    }

    // Save tokens to Supabase
    console.log('[Callback] Saving tokens to Supabase...');
    await saveTokens(userEmail, tokens);
    console.log('[Callback] Tokens saved successfully');

    // Return HTML that sets localStorage and closes window
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gmail Connected</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #059669, #0284C7);
            color: white;
          }
          .container {
            text-align: center;
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
          }
          .success { font-size: 48px; margin-bottom: 20px; }
          h1 { margin: 0 0 10px 0; font-size: 24px; }
          p { margin: 0; opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✓</div>
          <h1>Gmail Connected!</h1>
          <p>You can close this window now.</p>
        </div>
        <script>
          // Set result in localStorage for parent window
          localStorage.setItem('gmail_oauth_result', JSON.stringify({
            success: true,
            email: ${JSON.stringify(userEmail)}
          }));

          // Try to close window automatically
          setTimeout(() => {
            window.close();
          }, 1500);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in OAuth callback:', error);

    // Return error HTML
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connection Failed</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #DC2626, #991B1B);
            color: white;
          }
          .container {
            text-align: center;
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
          }
          .error { font-size: 48px; margin-bottom: 20px; }
          h1 { margin: 0 0 10px 0; font-size: 24px; }
          p { margin: 0; opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error">✕</div>
          <h1>Connection Failed</h1>
          <p>Please close this window and try again.</p>
        </div>
        <script>
          localStorage.setItem('gmail_oauth_result', JSON.stringify({
            success: false,
            error: 'Failed to connect Gmail'
          }));
          setTimeout(() => window.close(), 3000);
        </script>
      </body>
      </html>
    `);
  }
}
