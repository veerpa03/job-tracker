// ══════════════════════════════════════════════════════════════════════════════
// Email Service - Send follow-up emails with threading support
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Format email with signature
 */
function formatEmailBody(body, signature) {
  if (!signature) return body;
  return `${body}\n\n${signature}`;
}

/**
 * Generate mailto link for email client
 */
export function generateMailtoLink(contact, emailBody) {
  const signature = localStorage.getItem("email_signature") || "";
  const fullBody = formatEmailBody(emailBody, signature);

  const subject = `Following up: Opportunities at ${contact.company}`;
  const mailto = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`;

  return mailto;
}

/**
 * Open email in default mail client
 */
export function openEmailClient(contact, emailBody, attachmentFiles = []) {
  const mailto = generateMailtoLink(contact, emailBody);

  // Open in default email client
  window.location.href = mailto;

  // Note: mailto: links cannot include attachments
  // User will need to attach files manually
  if (attachmentFiles.length > 0) {
    return {
      success: true,
      warning: "Please attach the following files manually in your email client:\n" +
               attachmentFiles.map(f => `- ${f.name}`).join("\n")
    };
  }

  return { success: true };
}

/**
 * Copy email to clipboard
 */
export async function copyEmailToClipboard(contact, emailBody) {
  const signature = localStorage.getItem("email_signature") || "";
  const fullBody = formatEmailBody(emailBody, signature);

  const subject = `Following up: Opportunities at ${contact.company}`;
  const fullEmail = `To: ${contact.email}\nSubject: ${subject}\n\n${fullBody}`;

  try {
    await navigator.clipboard.writeText(fullEmail);
    return { success: true, message: "Email copied to clipboard!" };
  } catch (err) {
    return { success: false, error: "Failed to copy to clipboard" };
  }
}

/**
 * Download attachments as a bundle
 */
export function downloadAttachments(files) {
  files.forEach(file => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

/**
 * Send email (for future integration with backend API)
 * This is a placeholder for when you want to integrate with:
 * - Gmail API
 * - SendGrid
 * - AWS SES
 * - Custom backend email service
 */
export async function sendEmailViaAPI(contact, emailBody, attachmentFiles = []) {
  // TODO: Implement when backend is ready
  throw new Error("API email sending not yet implemented. Use 'Open in Email Client' for now.");
}

/**
 * Generate email preview HTML
 */
export function generateEmailPreview(contact, emailBody) {
  const signature = localStorage.getItem("email_signature") || "";
  const fullBody = formatEmailBody(emailBody, signature);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff; color: #000;">
      <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 20px;">
        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
          <strong>To:</strong> ${contact.email}
        </div>
        <div style="font-size: 12px; color: #6b7280;">
          <strong>Subject:</strong> Following up: Opportunities at ${contact.company}
        </div>
      </div>
      <div style="white-space: pre-wrap; line-height: 1.6; color: #111827;">
        ${fullBody}
      </div>
    </div>
  `;
}

/**
 * Update contact after sending email
 */
export function getUpdatedContactData() {
  const today = new Date().toISOString().split("T")[0];
  const nextFollowUp = new Date();
  nextFollowUp.setDate(nextFollowUp.getDate() + 7);

  return {
    outreachDate: today,
    followUp: nextFollowUp.toISOString().split("T")[0],
    status: "Message Sent" // Or keep existing status
  };
}
