// ══════════════════════════════════════════════════════════════════════════════
// Settings Component - API Keys, Prompts, Email Configuration
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import {
  getApiKey,
  saveApiKey,
  getPromptTemplate,
  savePromptTemplate,
  resetPromptTemplate,
  DEFAULT_PROMPT_TEMPLATE
} from "./aiService";
import {
  isGmailConnected,
  signInWithGoogle,
  signOutFromGoogle,
  getCurrentUserEmail
} from "./gmailBackendService";

export default function Settings() {
  const [apiKey, setApiKey] = useState("");
  const [promptTemplate, setPromptTemplate] = useState("");
  const [emailSignature, setEmailSignature] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);

  // Gmail connection state
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState("");
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailError, setGmailError] = useState(null);

  useEffect(() => {
    setApiKey(getApiKey());
    setPromptTemplate(getPromptTemplate());
    setEmailSignature(localStorage.getItem("email_signature") || "");
    setGmailConnected(isGmailConnected());
    setGmailEmail(getCurrentUserEmail() || "");
  }, []);

  const handleSave = () => {
    saveApiKey(apiKey);
    savePromptTemplate(promptTemplate);
    localStorage.setItem("email_signature", emailSignature);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm("Reset prompt to default? Your custom prompt will be lost.")) {
      const defaultPrompt = resetPromptTemplate();
      setPromptTemplate(defaultPrompt);
    }
  };

  const handleGmailConnect = async () => {
    setGmailLoading(true);
    setGmailError(null);

    try {
      const result = await signInWithGoogle();
      setGmailConnected(true);
      setGmailEmail(result.email);
    } catch (error) {
      setGmailError(error.message);
    } finally {
      setGmailLoading(false);
    }
  };

  const handleGmailDisconnect = async () => {
    setGmailLoading(true);
    setGmailError(null);

    try {
      await signOutFromGoogle();
      setGmailConnected(false);
      setGmailEmail("");
    } catch (error) {
      setGmailError(error.message);
    } finally {
      setGmailLoading(false);
    }
  };

  const cardStyle = {
    background: "#1E293B",
    border: "1px solid #334155",
    borderRadius: 14,
    padding: 24,
    marginBottom: 24
  };

  const labelStyle = {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 8,
    display: "block"
  };

  const inputStyle = {
    background: "#0F172A",
    border: "1px solid #334155",
    color: "#E2E8F0",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
    fontFamily: "'DM Mono', monospace",
    width: "100%",
    boxSizing: "border-box"
  };

  const textareaStyle = {
    ...inputStyle,
    resize: "vertical",
    lineHeight: 1.6
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 28,
        fontWeight: 800,
        color: "#F8FAFC",
        marginBottom: 8
      }}>
        ⚙️ Settings
      </h2>
      <p style={{ color: "#94A3B8", fontSize: 15, marginBottom: 32 }}>
        Configure AI and email settings for follow-up automation
      </p>

      {saved && (
        <div style={{
          background: "#DCFCE7",
          border: "1px solid #22C55E",
          color: "#14532D",
          padding: 14,
          borderRadius: 10,
          marginBottom: 20,
          fontSize: 14,
          fontWeight: 600
        }}>
          ✓ Settings saved successfully!
        </div>
      )}

      {/* API Key Section */}
      <div style={cardStyle}>
        <h3 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 18,
          fontWeight: 800,
          color: "#F8FAFC",
          marginTop: 0,
          marginBottom: 16
        }}>
          🔑 Groq API Key
        </h3>

        <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
          Get your free API key from{" "}
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#60A5FA", textDecoration: "none" }}
          >
            console.groq.com/keys
          </a>
          {" "}(free tier: 14,400 requests/day)
        </p>

        <label style={labelStyle}>API Key</label>
        <div style={{ position: "relative" }}>
          <input
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="gsk_..."
            style={inputStyle}
          />
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              color: "#94A3B8",
              cursor: "pointer",
              fontSize: 14
            }}
          >
            {showApiKey ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>

        <div style={{
          marginTop: 12,
          padding: 12,
          background: "#0F172A",
          border: "1px solid #334155",
          borderRadius: 8,
          fontSize: 12,
          color: "#64748B",
          lineHeight: 1.6
        }}>
          <div style={{ marginBottom: 8 }}>
            💡 <strong style={{ color: "#94A3B8" }}>Storage Options:</strong>
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong style={{ color: "#60A5FA" }}>1. Enter here (localStorage):</strong> Stored in your browser only
          </div>
          <div>
            <strong style={{ color: "#60A5FA" }}>2. Add to .env file:</strong> Add <code style={{ background: "#1E293B", padding: "2px 6px", borderRadius: 4 }}>VITE_GROQ_API_KEY=your_key</code> to .env
          </div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #334155", fontSize: 11, color: "#475569" }}>
            ⚠️ <strong>Note:</strong> In frontend apps, .env variables are visible in browser. For production, use a backend server.
          </div>
        </div>
      </div>

      {/* Gmail Integration Section */}
      <div style={cardStyle}>
        <h3 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 18,
          fontWeight: 800,
          color: "#F8FAFC",
          marginTop: 0,
          marginBottom: 16
        }}>
          📧 Gmail Integration (Optional)
        </h3>

        <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
          Connect Gmail to automatically read your previous emails and send emails directly
        </p>

        {gmailError && (
          <div style={{
            background: "#FEE2E2",
            border: "1px solid #F87171",
            color: "#991B1B",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13
          }}>
            {gmailError}
          </div>
        )}

        {/* Connection Status */}
        {gmailConnected ? (
          <div style={{
            background: "#DCFCE7",
            border: "1px solid #22C55E",
            borderRadius: 10,
            padding: 16,
            marginBottom: 16
          }}>
            <div style={{ color: "#14532D", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
              ✓ Connected to Gmail
            </div>
            <div style={{ color: "#166534", fontSize: 13 }}>
              {gmailEmail}
            </div>
          </div>
        ) : (
          <div style={{
            background: "#0F172A",
            border: "1px solid #334155",
            borderRadius: 10,
            padding: 16,
            marginBottom: 16
          }}>
            <div style={{ color: "#94A3B8", fontSize: 13 }}>
              Not connected - Using contact notes only
            </div>
          </div>
        )}

        {/* Connect/Disconnect Button */}
        <div>
          {gmailConnected ? (
            <button
              onClick={handleGmailDisconnect}
              disabled={gmailLoading}
              style={{
                background: "transparent",
                border: "1px solid #F87171",
                color: "#F87171",
                borderRadius: 8,
                padding: "10px 20px",
                cursor: gmailLoading ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "'Syne', sans-serif",
                opacity: gmailLoading ? 0.5 : 1
              }}
            >
              {gmailLoading ? "Disconnecting..." : "Disconnect Gmail"}
            </button>
          ) : (
            <button
              onClick={handleGmailConnect}
              disabled={gmailLoading}
              style={{
                background: "linear-gradient(135deg, #059669, #0284C7)",
                border: "none",
                color: "#fff",
                borderRadius: 8,
                padding: "10px 20px",
                cursor: gmailLoading ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "'Syne', sans-serif",
                opacity: gmailLoading ? 0.5 : 1
              }}
            >
              {gmailLoading ? "Connecting..." : "Connect Gmail"}
            </button>
          )}
        </div>

        <div style={{
          marginTop: 16,
          padding: 14,
          background: "#0F172A",
          border: "1px solid #334155",
          borderRadius: 10,
          fontSize: 12,
          color: "#64748B",
          lineHeight: 1.6
        }}>
          <strong style={{ color: "#94A3B8", display: "block", marginBottom: 6 }}>
            How it works:
          </strong>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 4 }}>Searches your Gmail for previous emails to each contact</li>
            <li style={{ marginBottom: 4 }}>Reads the email content for AI context</li>
            <li style={{ marginBottom: 4 }}>AI generates follow-ups that reference your specific message</li>
            <li>Much better than using just notes!</li>
          </ul>
        </div>
      </div>

      {/* Prompt Template Section */}
      <div style={cardStyle}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16
        }}>
          <h3 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 800,
            color: "#F8FAFC",
            margin: 0
          }}>
            ✍️ Email Prompt Template
          </h3>
          <button
            onClick={handleReset}
            style={{
              background: "transparent",
              border: "1px solid #334155",
              color: "#94A3B8",
              borderRadius: 7,
              padding: "7px 14px",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700
            }}
          >
            Reset to Default
          </button>
        </div>

        <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
          Customize how AI generates your follow-up emails. Use these placeholders:
          <code style={{ color: "#60A5FA", background: "#0F172A", padding: "2px 6px", borderRadius: 4, margin: "0 4px" }}>
            {"{contact_name}"}
          </code>
          <code style={{ color: "#60A5FA", background: "#0F172A", padding: "2px 6px", borderRadius: 4, margin: "0 4px" }}>
            {"{company}"}
          </code>
          <code style={{ color: "#60A5FA", background: "#0F172A", padding: "2px 6px", borderRadius: 4, margin: "0 4px" }}>
            {"{days_since}"}
          </code>
          <code style={{ color: "#60A5FA", background: "#0F172A", padding: "2px 6px", borderRadius: 4, margin: "0 4px" }}>
            {"{contact_role}"}
          </code>
          <code style={{ color: "#60A5FA", background: "#0F172A", padding: "2px 6px", borderRadius: 4, margin: "0 4px" }}>
            {"{original_notes}"}
          </code>
        </p>

        <label style={labelStyle}>Prompt Template</label>
        <textarea
          value={promptTemplate}
          onChange={(e) => setPromptTemplate(e.target.value)}
          rows={12}
          style={textareaStyle}
          placeholder="Enter your custom prompt..."
        />
      </div>

      {/* Email Signature Section */}
      <div style={cardStyle}>
        <h3 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 18,
          fontWeight: 800,
          color: "#F8FAFC",
          marginTop: 0,
          marginBottom: 16
        }}>
          ✉️ Email Signature
        </h3>

        <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 16 }}>
          This signature will be automatically added to all follow-up emails
        </p>

        <label style={labelStyle}>Signature (Optional)</label>
        <textarea
          value={emailSignature}
          onChange={(e) => setEmailSignature(e.target.value)}
          rows={4}
          style={textareaStyle}
          placeholder={`Best regards,\nViraj\nCS @ Ohio University | May 2026\nlinkedin.com/in/yourprofile`}
        />
      </div>

      {/* Save Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 40 }}>
        <button
          onClick={handleSave}
          style={{
            background: "linear-gradient(135deg, #2563EB, #7C3AED)",
            border: "none",
            color: "#fff",
            borderRadius: 10,
            padding: "14px 32px",
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "'Syne', sans-serif",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
          }}
        >
          💾 Save Settings
        </button>
      </div>

      {/* Email Method Info */}
      <div style={{
        background: "#0F172A",
        border: "1px solid #334155",
        borderRadius: 14,
        padding: 20,
        fontSize: 13,
        color: "#64748B",
        lineHeight: 1.8,
        marginBottom: 20
      }}>
        <strong style={{ color: "#94A3B8", display: "block", marginBottom: 12, fontSize: 15 }}>
          📨 How Emails Are Sent
        </strong>

        <div style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: 10,
          padding: 14,
          marginBottom: 12
        }}>
          <div style={{ color: "#E2E8F0", fontWeight: 700, marginBottom: 6 }}>
            ✅ Current Method: mailto: (Default Email Client)
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, color: "#94A3B8" }}>
            <li>Click "Send" → Opens Gmail/Outlook</li>
            <li>You review and send manually</li>
            <li>Simple, secure, no setup required</li>
            <li>Maximum privacy (nothing automated)</li>
          </ul>
        </div>

        <div style={{
          background: "#1E293B",
          border: "1px solid #475569",
          borderRadius: 10,
          padding: 14
        }}>
          <div style={{ color: "#94A3B8", fontWeight: 700, marginBottom: 6 }}>
            🚀 Future: Gmail API (Coming Soon)
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, color: "#64748B" }}>
            <li>Send directly from the app</li>
            <li>Auto-detect when contacts reply</li>
            <li>Email threading support</li>
            <li>Requires OAuth setup (20 min)</li>
          </ul>
          <div style={{ marginTop: 10, fontSize: 11, color: "#64748B" }}>
            📖 See <code style={{ background: "#0F172A", padding: "2px 6px", borderRadius: 4 }}>GMAIL_API_SETUP.md</code> for setup instructions
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div style={{
        background: "#0F172A",
        border: "1px solid #334155",
        borderRadius: 14,
        padding: 20,
        fontSize: 13,
        color: "#64748B",
        lineHeight: 1.8
      }}>
        <strong style={{ color: "#94A3B8", display: "block", marginBottom: 8 }}>
          📚 How Follow-Ups Work:
        </strong>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>
            AI reads your original outreach notes and generates personalized follow-ups
          </li>
          <li style={{ marginBottom: 6 }}>
            You can edit any message before sending
          </li>
          <li style={{ marginBottom: 6 }}>
            Attach files like resume or portfolio (optional)
          </li>
          <li style={{ marginBottom: 6 }}>
            Click "Send" → Opens your default email client (Gmail, Outlook, etc.)
          </li>
          <li>
            Contact dates are auto-updated after sending
          </li>
        </ul>
      </div>
    </div>
  );
}
