// ══════════════════════════════════════════════════════════════════════════════
// AI Service for Follow-up Email Generation
// Uses Groq API (free & fast) or fallback to other providers
// ══════════════════════════════════════════════════════════════════════════════

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b"; // Fast & free

// Default prompt template (stored in localStorage, customizable)
export const DEFAULT_PROMPT_TEMPLATE = `You are a professional job seeker writing a follow-up email.

Context:
- Contact: {contact_name}
- Role: {contact_role}
- Company: {company}
- Days since last email: {days_since}
- Original outreach notes: {original_notes}
- Previous email content: {previous_email}

Write a brief, professional follow-up email (2-3 sentences maximum) that:
1. References your previous email naturally and specifically
2. Shows continued interest in opportunities at {company}
3. Is polite but not desperate
4. Does NOT include a subject line
5. Does NOT include a signature

Keep it concise and professional. Write ONLY the email body text.`;

/**
 * Get the current prompt template from localStorage
 */
export function getPromptTemplate() {
  const saved = localStorage.getItem("followup_prompt_template");
  return saved || DEFAULT_PROMPT_TEMPLATE;
}

/**
 * Save custom prompt template to localStorage
 */
export function savePromptTemplate(template) {
  localStorage.setItem("followup_prompt_template", template);
}

/**
 * Reset prompt template to default
 */
export function resetPromptTemplate() {
  localStorage.removeItem("followup_prompt_template");
  return DEFAULT_PROMPT_TEMPLATE;
}

/**
 * Calculate days since last contact
 */
function daysSince(dateStr) {
  if (!dateStr) return 0;
  const today = new Date();
  const past = new Date(dateStr);
  return Math.floor((today - past) / (1000 * 60 * 60 * 24));
}

/**
 * Generate follow-up email using AI
 * @param {Object} contact - Contact object from database
 * @param {string} apiKey - Groq API key (or other provider)
 * @param {Object} previousEmail - Previous email object from Gmail (optional)
 * @returns {Promise<string>} Generated email body
 */
export async function generateFollowUpEmail(contact, apiKey, previousEmail = null) {
  if (!apiKey) {
    throw new Error("API key is required. Please add your Groq API key in Settings.");
  }

  const days = daysSince(contact.outreachDate);
  const template = getPromptTemplate();

  // Use previous email content if available, otherwise use notes
  const previousEmailContent = previousEmail?.body || contact.notes || "initial outreach about opportunities";

  // Fill in the prompt template with contact data
  const prompt = template
    .replace(/{contact_name}/g, contact.name || "the contact")
    .replace(/{contact_role}/g, contact.role || "team member")
    .replace(/{company}/g, contact.company || "the company")
    .replace(/{days_since}/g, days.toString())
    .replace(/{original_notes}/g, contact.notes || "initial outreach about opportunities")
    .replace(/{previous_email}/g, previousEmailContent);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a professional email writer. Write concise, natural follow-up emails for job seekers."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
        top_p: 1,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "AI API request failed");
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content?.trim();

    if (!generatedText) {
      throw new Error("No response from AI");
    }

    return generatedText;
  } catch (error) {
    console.error("AI generation error:", error);
    throw new Error(`Failed to generate email: ${error.message}`);
  }
}

/**
 * Get API key from .env or localStorage
 * Priority: 1. .env file, 2. localStorage
 */
export function getApiKey() {
  // Try .env first (if set)
  const envKey = import.meta.env.VITE_GROQ_API_KEY;
  if (envKey && envKey !== "your_groq_api_key_here") {
    return envKey;
  }

  // Fallback to localStorage
  return localStorage.getItem("groq_api_key") || "";
}

/**
 * Save API key to localStorage
 */
export function saveApiKey(key) {
  localStorage.setItem("groq_api_key", key);
}

/**
 * Batch generate follow-ups for multiple contacts
 */
export async function generateBatchFollowUps(contacts, apiKey, onProgress) {
  const results = [];

  for (let i = 0; i < contacts.length; i++) {
    try {
      const email = await generateFollowUpEmail(contacts[i], apiKey);
      results.push({
        contact: contacts[i],
        generatedEmail: email,
        error: null
      });

      if (onProgress) {
        onProgress(i + 1, contacts.length);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      results.push({
        contact: contacts[i],
        generatedEmail: null,
        error: error.message
      });
    }
  }

  return results;
}
