// ══════════════════════════════════════════════════════════════════════════════
// Gmail API Integration - OAuth2 & Email Reading for Context
// ══════════════════════════════════════════════════════════════════════════════

import { gapi } from 'gapi-script';

// Gmail API configuration
const GMAIL_SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];

let isGapiInitialized = false;

/**
 * Get Google Client ID from environment
 */
export function getGoogleClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('google_client_id') || '';
}

/**
 * Save Google Client ID to localStorage
 */
export function saveGoogleClientId(clientId) {
  localStorage.setItem('google_client_id', clientId);
}

/**
 * Initialize Google API client
 */
export async function initGoogleAPI() {
  const clientId = getGoogleClientId();

  if (!clientId) {
    throw new Error('Google Client ID not set. Please add it in Settings.');
  }

  if (isGapiInitialized) {
    return true;
  }

  return new Promise((resolve, reject) => {
    gapi.load('client:auth2', async () => {
      try {
        await gapi.client.init({
          clientId: clientId,
          scope: GMAIL_SCOPES,
          discoveryDocs: DISCOVERY_DOCS
        });

        isGapiInitialized = true;

        // Check if user is already signed in
        const authInstance = gapi.auth2.getAuthInstance();
        if (authInstance.isSignedIn.get()) {
          localStorage.setItem('gmail_connected', 'true');
        }

        resolve(true);
      } catch (error) {
        console.error('Error initializing Google API:', error);
        reject(error);
      }
    });
  });
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  try {
    await initGoogleAPI();

    const authInstance = gapi.auth2.getAuthInstance();
    await authInstance.signIn();

    localStorage.setItem('gmail_connected', 'true');

    return {
      success: true,
      email: authInstance.currentUser.get().getBasicProfile().getEmail()
    };
  } catch (error) {
    console.error('Error signing in:', error);
    throw new Error('Failed to sign in with Google');
  }
}

/**
 * Sign out from Google
 */
export async function signOutFromGoogle() {
  try {
    const authInstance = gapi.auth2.getAuthInstance();
    await authInstance.signOut();

    localStorage.removeItem('gmail_connected');

    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Check if user is signed in with Gmail
 */
export function isGmailConnected() {
  return localStorage.getItem('gmail_connected') === 'true';
}

/**
 * Get current user's email
 */
export function getCurrentUserEmail() {
  try {
    if (!isGapiInitialized) return null;

    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance || !authInstance.isSignedIn.get()) return null;

    return authInstance.currentUser.get().getBasicProfile().getEmail();
  } catch (error) {
    return null;
  }
}

/**
 * Decode base64 email body
 */
function decodeEmailBody(encodedBody) {
  if (!encodedBody) return '';

  try {
    // Gmail uses base64url encoding
    const base64 = encodedBody.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return decoded;
  } catch (error) {
    console.error('Error decoding email body:', error);
    return '';
  }
}

/**
 * Extract plain text from email payload
 */
function extractEmailBody(payload) {
  if (!payload) return '';

  // Check if it's multipart
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeEmailBody(part.body.data);
      }
    }

    // Try nested parts
    for (const part of payload.parts) {
      if (part.parts) {
        const body = extractEmailBody(part);
        if (body) return body;
      }
    }
  }

  // Single part email
  if (payload.body?.data) {
    return decodeEmailBody(payload.body.data);
  }

  return '';
}

/**
 * Search for the most recent email sent to a contact
 * Returns the email body for context
 */
export async function findPreviousEmail(contactEmail) {
  try {
    await initGoogleAPI();

    const response = await gapi.client.gmail.users.messages.list({
      userId: 'me',
      q: `to:${contactEmail} in:sent`,
      maxResults: 1
    });

    if (!response.result.messages || response.result.messages.length === 0) {
      return null;
    }

    // Get the full message
    const messageId = response.result.messages[0].id;
    const message = await gapi.client.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    // Extract headers
    const headers = message.result.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';

    // Extract body
    const body = extractEmailBody(message.result.payload);

    return {
      id: message.result.id,
      threadId: message.result.threadId,
      subject,
      date,
      body: body.substring(0, 1000), // Limit to 1000 chars for context
      snippet: message.result.snippet
    };
  } catch (error) {
    console.error('Error finding previous email:', error);
    return null;
  }
}

/**
 * Send email via Gmail API with threading support
 */
export async function sendEmailViaGmail(contact, emailBody, previousEmail = null) {
  try {
    await initGoogleAPI();

    const signature = localStorage.getItem("email_signature") || "";
    const fullBody = signature ? `${emailBody}\n\n${signature}` : emailBody;

    // Build email headers
    let subject = `Following up: Opportunities at ${contact.company}`;
    const headers = [
      `To: ${contact.email}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0'
    ];

    // If we have a previous email, reply to it
    if (previousEmail) {
      subject = `Re: ${previousEmail.subject}`;
      headers[1] = `Subject: ${subject}`;

      // Add threading headers (if we had Message-ID)
      // headers.push(`In-Reply-To: ${previousEmail.messageId}`);
      // headers.push(`References: ${previousEmail.messageId}`);
    }

    headers.push(''); // Empty line
    headers.push(fullBody);

    const email = headers.join('\r\n');

    // Encode in base64url
    const encodedEmail = btoa(email)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    const sendParams = {
      userId: 'me',
      resource: {
        raw: encodedEmail
      }
    };

    // If we have a thread ID, add it to keep emails in same thread
    if (previousEmail?.threadId) {
      sendParams.resource.threadId = previousEmail.threadId;
    }

    const response = await gapi.client.gmail.users.messages.send(sendParams);

    return {
      success: true,
      messageId: response.result.id,
      threadId: response.result.threadId,
      inThread: !!previousEmail
    };
  } catch (error) {
    console.error('Error sending email via Gmail:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Check if contact has replied to your emails
 */
export async function checkForReply(contactEmail) {
  try {
    await initGoogleAPI();

    const response = await gapi.client.gmail.users.messages.list({
      userId: 'me',
      q: `from:${contactEmail} newer_than:30d`,
      maxResults: 1
    });

    return {
      hasReplied: !!(response.result.messages && response.result.messages.length > 0),
      messageCount: response.result.resultSizeEstimate || 0
    };
  } catch (error) {
    console.error('Error checking for replies:', error);
    return { hasReplied: false, messageCount: 0 };
  }
}

/**
 * Batch check replies for multiple contacts
 */
export async function batchCheckReplies(contacts) {
  const results = [];

  for (const contact of contacts) {
    if (!contact.email) continue;

    try {
      const reply = await checkForReply(contact.email);
      results.push({
        contactId: contact.id,
        contactEmail: contact.email,
        ...reply
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      results.push({
        contactId: contact.id,
        contactEmail: contact.email,
        hasReplied: false,
        error: error.message
      });
    }
  }

  return results;
}
