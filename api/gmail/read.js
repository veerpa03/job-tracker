// Read previous email sent to a contact
import { getAuthenticatedGmail } from '../utils/gmailAuth.js';

/**
 * Decode base64url email body
 */
function decodeEmailBody(encodedBody) {
  if (!encodedBody) return '';
  try {
    const base64 = encodedBody.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userEmail, contactEmail } = req.body;

    if (!userEmail || !contactEmail) {
      return res.status(400).json({ error: 'userEmail and contactEmail required' });
    }

    // Get authenticated Gmail client
    const gmail = await getAuthenticatedGmail(userEmail);

    // Search for most recent email to this contact
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: `to:${contactEmail} in:sent`,
      maxResults: 1
    });

    if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
      return res.status(200).json({ found: false });
    }

    // Get the full message
    const messageId = listResponse.data.messages[0].id;
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    // Extract headers
    const headers = message.data.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';

    // Extract body
    const body = extractEmailBody(message.data.payload);

    res.status(200).json({
      found: true,
      email: {
        id: message.data.id,
        threadId: message.data.threadId,
        subject,
        date,
        body: body.substring(0, 1000), // Limit to 1000 chars
        snippet: message.data.snippet
      }
    });
  } catch (error) {
    console.error('Error reading email:', error);

    if (error.message.includes('gmail_tokens')) {
      return res.status(401).json({ error: 'Gmail not connected. Please authenticate first.' });
    }

    res.status(500).json({ error: 'Failed to read email', details: error.message });
  }
}
