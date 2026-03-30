// Send email via Gmail API
import { getAuthenticatedGmail } from '../utils/gmailAuth.js';

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
    const { userEmail, contactEmail, contactName, subject, body, threadId } = req.body;

    if (!userEmail || !contactEmail || !body) {
      return res.status(400).json({ error: 'userEmail, contactEmail, and body required' });
    }

    // Get authenticated Gmail client
    const gmail = await getAuthenticatedGmail(userEmail);

    // Build email
    const emailSubject = subject || `Following up: Opportunities at ${contactName || 'your company'}`;

    const emailLines = [
      `To: ${contactEmail}`,
      `Subject: ${emailSubject}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      body
    ];

    const email = emailLines.join('\r\n');

    // Encode in base64url
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send params
    const sendParams = {
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    };

    // If we have a thread ID, add it to keep emails in same thread
    if (threadId) {
      sendParams.requestBody.threadId = threadId;
    }

    // Send email
    const response = await gmail.users.messages.send(sendParams);

    res.status(200).json({
      success: true,
      messageId: response.data.id,
      threadId: response.data.threadId,
      inThread: !!threadId
    });
  } catch (error) {
    console.error('Error sending email:', error);

    if (error.message.includes('gmail_tokens')) {
      return res.status(401).json({ error: 'Gmail not connected. Please authenticate first.' });
    }

    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
}
