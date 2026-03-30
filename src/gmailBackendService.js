// ══════════════════════════════════════════════════════════════════════════════
// Gmail Backend API Integration - Calls serverless functions
// ══════════════════════════════════════════════════════════════════════════════

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:5173/api'
  : 'https://viraj-job-tracker.vercel.app/api';

let currentUserEmail = null;

/**
 * Initialize Gmail OAuth flow
 * Uses localStorage to communicate between popup and main window
 */
export async function signInWithGoogle() {
  try {
    // Clear any previous OAuth state
    localStorage.removeItem('gmail_oauth_pending');
    localStorage.removeItem('gmail_oauth_result');

    // Get auth URL from backend
    const response = await fetch(`${API_BASE}/gmail/auth`);
    const { authUrl } = await response.json();

    // Mark OAuth as pending
    localStorage.setItem('gmail_oauth_pending', 'true');

    // Open OAuth in new window
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      authUrl,
      'Gmail OAuth',
      `width=${width},height=${height},top=${top},left=${left}`
    );

    // Wait for OAuth callback via localStorage
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        // Check localStorage for result (doesn't trigger COOP)
        const result = localStorage.getItem('gmail_oauth_result');

        if (result) {
          clearInterval(checkInterval);
          localStorage.removeItem('gmail_oauth_pending');
          localStorage.removeItem('gmail_oauth_result');

          const data = JSON.parse(result);

          if (data.error) {
            reject(new Error(data.error));
          } else if (data.success && data.email) {
            currentUserEmail = data.email;
            localStorage.setItem('gmail_connected', 'true');
            localStorage.setItem('gmail_user_email', data.email);
            resolve({ success: true, email: data.email });
          } else {
            reject(new Error('OAuth failed'));
          }
        }
      }, 500);

      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(checkInterval);
        localStorage.removeItem('gmail_oauth_pending');
        reject(new Error('OAuth timeout - please try again'));
      }, 120000);
    });
  } catch (error) {
    console.error('Error signing in:', error);
    throw new Error(`Failed to sign in: ${error.message}`);
  }
}

/**
 * Sign out from Gmail
 */
export async function signOutFromGoogle() {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) {
      throw new Error('No user email found');
    }

    await fetch(`${API_BASE}/gmail/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail })
    });

    currentUserEmail = null;
    localStorage.removeItem('gmail_connected');
    localStorage.removeItem('gmail_user_email');

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
  if (!currentUserEmail) {
    currentUserEmail = localStorage.getItem('gmail_user_email');
  }
  return currentUserEmail;
}

/**
 * Search for the most recent email sent to a contact
 * Returns the email body for context
 */
export async function findPreviousEmail(contactEmail) {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) {
      throw new Error('Not authenticated with Gmail');
    }

    const response = await fetch(`${API_BASE}/gmail/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail, contactEmail })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to read email');
    }

    if (!data.found) {
      return null;
    }

    return data.email;
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
    const userEmail = getCurrentUserEmail();
    if (!userEmail) {
      throw new Error('Not authenticated with Gmail');
    }

    const signature = localStorage.getItem("email_signature") || "";
    const fullBody = signature ? `${emailBody}\n\n${signature}` : emailBody;

    const response = await fetch(`${API_BASE}/gmail/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail,
        contactEmail: contact.email,
        contactName: contact.name,
        subject: previousEmail ? `Re: ${previousEmail.subject}` : undefined,
        body: fullBody,
        threadId: previousEmail?.threadId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email');
    }

    return data;
  } catch (error) {
    console.error('Error sending email via Gmail:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Check if contact has replied to your emails
 */
export async function checkForReply(contactEmail) {
  // This would require additional backend endpoint
  // For now, return not implemented
  return { hasReplied: false, messageCount: 0 };
}

/**
 * Batch check replies for multiple contacts
 */
export async function batchCheckReplies(contacts) {
  // This would require additional backend endpoint
  // For now, return empty results
  return contacts.map(contact => ({
    contactId: contact.id,
    contactEmail: contact.email,
    hasReplied: false,
    messageCount: 0
  }));
}

// Initialize on load
if (typeof window !== 'undefined') {
  currentUserEmail = localStorage.getItem('gmail_user_email');
}
