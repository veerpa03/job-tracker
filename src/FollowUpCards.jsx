// ══════════════════════════════════════════════════════════════════════════════
// Follow-Up Cards Component - Tinder-style email swiper
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { generateFollowUpEmail, getApiKey } from "./aiService";
import { isGmailConnected, findPreviousEmail } from "./gmailBackendService";

function daysSince(dateStr) {
  if (!dateStr) return 0;
  const today = new Date();
  const past = new Date(dateStr);
  return Math.floor((today - past) / (1000 * 60 * 60 * 24));
}

export default function FollowUpCards({ contacts, onSend, onSkip, onUpdateContact }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [generatedEmails, setGeneratedEmails] = useState({});
  const [editedEmails, setEditedEmails] = useState({});
  const [attachments, setAttachments] = useState({});

  // New: Selection screen
  const [showSelection, setShowSelection] = useState(true);
  const [selectedCount, setSelectedCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedContacts, setSelectedContacts] = useState([]);

  const currentContact = selectedContacts[currentIndex];
  const hasMore = currentIndex < selectedContacts.length - 1;
  const progress = selectedContacts.length > 0 ? ((currentIndex + 1) / selectedContacts.length) * 100 : 0;

  // Batch generate emails for selected contacts
  const handleBatchGenerate = async () => {
    setGenerating(true);
    setError(null);
    setGenerationProgress(0);

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        setError("⚠️ Please set your Groq API key in Settings first!");
        setGenerating(false);
        return;
      }

      // Select contacts to generate
      const contactsToGenerate = contacts.slice(0, selectedCount);
      setSelectedContacts(contactsToGenerate);

      const gmailEnabled = isGmailConnected();
      const emails = {};

      // Generate one by one with progress
      for (let i = 0; i < contactsToGenerate.length; i++) {
        const contact = contactsToGenerate[i];

        try {
          // Try to fetch previous email from Gmail if connected
          let previousEmail = null;
          if (gmailEnabled && contact.email) {
            try {
              previousEmail = await findPreviousEmail(contact.email);
            } catch (gmailErr) {
              console.warn(`Couldn't fetch Gmail for ${contact.email}:`, gmailErr);
              // Continue with notes only
            }
          }

          // Generate email with context
          const email = await generateFollowUpEmail(contact, apiKey, previousEmail);
          emails[contact.id] = email;
          setGenerationProgress(((i + 1) / contactsToGenerate.length) * 100);

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
          console.error(`Failed to generate for ${contact.name}:`, err);
          emails[contact.id] = `[Error generating email: ${err.message}]`;
        }
      }

      setGeneratedEmails(emails);
      setShowSelection(false); // Go to cards view
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Generate email for current contact (if not already generated)
  useEffect(() => {
    if (showSelection) return; // Don't generate during selection
    if (!currentContact) return;
    if (generatedEmails[currentContact.id]) return; // Already generated

    const generate = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiKey = getApiKey();
        if (!apiKey) {
          setError("⚠️ Please set your Groq API key in Settings first!");
          return;
        }

        const email = await generateFollowUpEmail(currentContact, apiKey);
        setGeneratedEmails(prev => ({ ...prev, [currentContact.id]: email }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [currentContact, generatedEmails, showSelection]);

  const handleNext = () => {
    if (hasMore) {
      setCurrentIndex(prev => prev + 1);
      setError(null);
    }
  };

  const handleSkip = () => {
    if (onSkip) onSkip(currentContact);
    handleNext();
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);

    try {
      const emailBody = editedEmails[currentContact.id] || generatedEmails[currentContact.id];
      const files = attachments[currentContact.id] || [];

      // Call parent send function
      await onSend(currentContact, emailBody, files);

      // Move to next card
      handleNext();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleEditEmail = (contactId, newText) => {
    setEditedEmails(prev => ({ ...prev, [contactId]: newText }));
  };

  const handleFileUpload = (contactId, files) => {
    setAttachments(prev => ({ ...prev, [contactId]: Array.from(files) }));
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiKey = getApiKey();
      const email = await generateFollowUpEmail(currentContact, apiKey);
      setGeneratedEmails(prev => ({ ...prev, [currentContact.id]: email }));
      // Clear any edits
      setEditedEmails(prev => {
        const newEdited = { ...prev };
        delete newEdited[currentContact.id];
        return newEdited;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Selection Screen
  if (showSelection) {
    const quickOptions = [5, 10, 15, 20, contacts.length];

    return (
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{
          background: "#1E293B",
          border: "2px solid #334155",
          borderRadius: 20,
          padding: 40,
          textAlign: "center"
        }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>📧</div>

          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 28,
            fontWeight: 800,
            color: "#F8FAFC",
            marginBottom: 12
          }}>
            {contacts.length} Contacts Need Follow-Up
          </h2>

          <p style={{ color: "#94A3B8", fontSize: 15, marginBottom: 16, lineHeight: 1.6 }}>
            Select how many follow-up emails you want to generate with AI
          </p>

          {/* Gmail Status Indicator */}
          {isGmailConnected() ? (
            <div style={{
              background: "#DCFCE7",
              border: "1px solid #22C55E",
              borderRadius: 10,
              padding: 12,
              marginBottom: 24,
              fontSize: 13,
              color: "#14532D",
              textAlign: "left"
            }}>
              ✓ <strong>Gmail connected</strong> - AI will read your previous emails for better context
            </div>
          ) : (
            <div style={{
              background: "#FEF9C3",
              border: "1px solid #F59E0B",
              borderRadius: 10,
              padding: 12,
              marginBottom: 24,
              fontSize: 13,
              color: "#92400E",
              textAlign: "left"
            }}>
              ⚠️ <strong>Gmail not connected</strong> - Using contact notes only. Connect in Settings for better AI context.
            </div>
          )}

          {error && (
            <div style={{
              background: "#FEE2E2",
              border: "1px solid #F87171",
              color: "#991B1B",
              padding: 12,
              borderRadius: 10,
              marginBottom: 24,
              fontSize: 13
            }}>
              {error}
            </div>
          )}

          {/* Quick Select Buttons */}
          <div style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: 24
          }}>
            {quickOptions.map(num => (
              <button
                key={num}
                onClick={() => setSelectedCount(Math.min(num, contacts.length))}
                disabled={generating || num > contacts.length}
                style={{
                  background: selectedCount === num
                    ? "linear-gradient(135deg, #2563EB, #7C3AED)"
                    : "#0F172A",
                  border: selectedCount === num ? "none" : "2px solid #334155",
                  color: selectedCount === num ? "#fff" : "#94A3B8",
                  borderRadius: 10,
                  padding: "12px 24px",
                  cursor: generating || num > contacts.length ? "not-allowed" : "pointer",
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: "'Syne', sans-serif",
                  opacity: num > contacts.length ? 0.4 : 1,
                  transition: "all 0.2s"
                }}
              >
                {num === contacts.length ? "All" : num}
              </button>
            ))}
          </div>

          {/* Custom Input */}
          <div style={{ marginBottom: 32 }}>
            <label style={{
              color: "#94A3B8",
              fontSize: 13,
              display: "block",
              marginBottom: 8
            }}>
              Or enter custom amount:
            </label>
            <input
              type="number"
              min="1"
              max={contacts.length}
              value={selectedCount}
              onChange={(e) => setSelectedCount(Math.min(Math.max(1, parseInt(e.target.value) || 1), contacts.length))}
              disabled={generating}
              style={{
                background: "#0F172A",
                border: "2px solid #334155",
                color: "#E2E8F0",
                borderRadius: 10,
                padding: "12px 16px",
                fontSize: 16,
                width: 120,
                textAlign: "center",
                fontFamily: "'DM Mono', monospace",
                outline: "none"
              }}
            />
          </div>

          {/* Generate Button */}
          {!generating && (
            <button
              onClick={handleBatchGenerate}
              disabled={!selectedCount || selectedCount < 1}
              style={{
                background: "linear-gradient(135deg, #2563EB, #7C3AED)",
                border: "none",
                color: "#fff",
                borderRadius: 12,
                padding: "16px 48px",
                cursor: selectedCount < 1 ? "not-allowed" : "pointer",
                fontSize: 17,
                fontWeight: 700,
                fontFamily: "'Syne', sans-serif",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.4)",
                opacity: selectedCount < 1 ? 0.5 : 1
              }}
            >
              🚀 Generate {selectedCount} Follow-Up{selectedCount !== 1 ? "s" : ""}
            </button>
          )}

          {/* Generation Progress */}
          {generating && (
            <div style={{ marginTop: 20 }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
                color: "#94A3B8",
                fontSize: 13
              }}>
                <span>Generating emails...</span>
                <span>{Math.round(generationProgress)}%</span>
              </div>
              <div style={{
                background: "#0F172A",
                height: 10,
                borderRadius: 99,
                overflow: "hidden"
              }}>
                <div style={{
                  background: "linear-gradient(90deg, #22C55E, #10B981)",
                  height: "100%",
                  width: `${generationProgress}%`,
                  transition: "width 0.3s ease"
                }} />
              </div>
              <p style={{ color: "#64748B", fontSize: 12, marginTop: 12 }}>
                This may take a minute... Please don't close this tab!
              </p>
            </div>
          )}

          {/* Info */}
          <div style={{
            marginTop: 32,
            padding: 16,
            background: "#0F172A",
            border: "1px solid #334155",
            borderRadius: 12,
            fontSize: 12,
            color: "#64748B",
            textAlign: "left",
            lineHeight: 1.6
          }}>
            <strong style={{ color: "#94A3B8" }}>💡 How it works:</strong>
            <ul style={{ margin: "8px 0 0 0", paddingLeft: 20 }}>
              <li>AI generates personalized emails for each contact</li>
              <li>You can edit any message before sending</li>
              <li>Add file attachments if needed</li>
              <li>Swipe through Tinder-style cards</li>
              <li>Send or skip each one</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!currentContact) {
    return (
      <div style={{
        background: "#1E293B",
        border: "1px solid #334155",
        borderRadius: 20,
        padding: 60,
        textAlign: "center",
        minHeight: 500,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 28,
          fontWeight: 800,
          color: "#F8FAFC",
          marginBottom: 12
        }}>
          All Done!
        </h2>
        <p style={{ color: "#94A3B8", fontSize: 16 }}>
          No more follow-ups pending. Great work! 💪
        </p>
        <button
          onClick={() => {
            setShowSelection(true);
            setCurrentIndex(0);
            setSelectedContacts([]);
            setGeneratedEmails({});
          }}
          style={{
            marginTop: 24,
            background: "linear-gradient(135deg, #2563EB, #7C3AED)",
            border: "none",
            color: "#fff",
            borderRadius: 10,
            padding: "12px 24px",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'Syne', sans-serif"
          }}
        >
          ← Back to Selection
        </button>
      </div>
    );
  }

  const days = daysSince(currentContact.outreachDate);
  const emailText = editedEmails[currentContact.id] || generatedEmails[currentContact.id] || "";
  const currentAttachments = attachments[currentContact.id] || [];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* Back Button */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => {
            if (confirm("Go back to selection? Your progress will be lost.")) {
              setShowSelection(true);
              setCurrentIndex(0);
              setSelectedContacts([]);
              setGeneratedEmails({});
              setEditedEmails({});
              setAttachments({});
            }
          }}
          style={{
            background: "transparent",
            border: "1px solid #334155",
            color: "#94A3B8",
            borderRadius: 8,
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: 13,
            fontFamily: "'DM Mono', monospace"
          }}
        >
          ← Back to Selection
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
          color: "#94A3B8",
          fontSize: 13
        }}>
          <span>Follow-up {currentIndex + 1} of {selectedContacts.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div style={{
          background: "#0F172A",
          height: 8,
          borderRadius: 99,
          overflow: "hidden"
        }}>
          <div style={{
            background: "linear-gradient(90deg, #2563EB, #7C3AED)",
            height: "100%",
            width: `${progress}%`,
            transition: "width 0.3s ease"
          }} />
        </div>
      </div>

      {/* Main Card */}
      <div style={{
        background: "#1E293B",
        border: "2px solid #334155",
        borderRadius: 20,
        padding: 28,
        position: "relative",
        boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
      }}>
        {/* Contact Info Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12
          }}>
            <div>
              <h3 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 22,
                fontWeight: 800,
                color: "#F8FAFC",
                margin: 0,
                marginBottom: 6
              }}>
                {currentContact.name}
              </h3>
              <div style={{ color: "#94A3B8", fontSize: 15 }}>
                {currentContact.role} @ <span style={{ color: "#60A5FA" }}>{currentContact.company}</span>
              </div>
            </div>
            <div style={{
              background: "#FEF9C3",
              color: "#92400E",
              padding: "6px 14px",
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 700
            }}>
              {days} days ago
            </div>
          </div>

          {/* Contact Details */}
          <div style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            fontSize: 13,
            color: "#64748B"
          }}>
            {currentContact.email && (
              <span style={{ color: "#94A3B8" }}>📧 {currentContact.email}</span>
            )}
            {currentContact.linkedin && (
              <a
                href={currentContact.linkedin}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#60A5FA", textDecoration: "none" }}
              >
                🔗 LinkedIn
              </a>
            )}
          </div>

          {/* Original Notes */}
          {currentContact.notes && (
            <div style={{
              marginTop: 14,
              background: "#0F172A",
              border: "1px solid #334155",
              borderRadius: 10,
              padding: 12,
              fontSize: 13,
              color: "#94A3B8"
            }}>
              <div style={{ color: "#64748B", fontSize: 11, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Original Outreach Notes
              </div>
              {currentContact.notes}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: "#FEE2E2",
            border: "1px solid #F87171",
            color: "#991B1B",
            padding: 12,
            borderRadius: 10,
            marginBottom: 16,
            fontSize: 13
          }}>
            {error}
          </div>
        )}

        {/* Email Editor */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10
          }}>
            <label style={{
              color: "#94A3B8",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase"
            }}>
              Follow-Up Email
            </label>
            <button
              onClick={handleRegenerate}
              disabled={loading}
              style={{
                background: "transparent",
                border: "1px solid #334155",
                color: "#94A3B8",
                borderRadius: 7,
                padding: "6px 12px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 12,
                fontFamily: "'DM Mono', monospace",
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? "⏳ Generating..." : "🔄 Regenerate"}
            </button>
          </div>

          <textarea
            value={loading ? "Generating your follow-up email..." : emailText}
            onChange={(e) => handleEditEmail(currentContact.id, e.target.value)}
            disabled={loading}
            rows={8}
            style={{
              background: "#0F172A",
              border: "2px solid #334155",
              color: "#E2E8F0",
              borderRadius: 12,
              padding: 16,
              fontSize: 14,
              fontFamily: "'DM Mono', monospace",
              width: "100%",
              boxSizing: "border-box",
              resize: "vertical",
              lineHeight: 1.6,
              outline: "none"
            }}
            placeholder="AI will generate your follow-up email here..."
          />
        </div>

        {/* File Attachments */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            color: "#94A3B8",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            display: "block",
            marginBottom: 10
          }}>
            Attachments (Optional)
          </label>

          <input
            type="file"
            multiple
            onChange={(e) => handleFileUpload(currentContact.id, e.target.files)}
            style={{ display: "none" }}
            id={`file-upload-${currentContact.id}`}
          />

          <label
            htmlFor={`file-upload-${currentContact.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#0F172A",
              border: "2px dashed #334155",
              borderRadius: 10,
              padding: "12px 16px",
              cursor: "pointer",
              fontSize: 13,
              color: "#94A3B8",
              fontFamily: "'DM Mono', monospace"
            }}
          >
            📎 Attach Files
          </label>

          {currentAttachments.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {currentAttachments.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#0F172A",
                    border: "1px solid #334155",
                    borderRadius: 8,
                    padding: "8px 12px",
                    marginBottom: 6,
                    fontSize: 12
                  }}
                >
                  <span style={{ color: "#E2E8F0" }}>
                    📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    onClick={() => {
                      const newFiles = currentAttachments.filter((_, i) => i !== idx);
                      setAttachments(prev => ({ ...prev, [currentContact.id]: newFiles }));
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#F87171",
                      cursor: "pointer",
                      fontSize: 14,
                      padding: 4
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          gap: 14,
          justifyContent: "center",
          marginTop: 24
        }}>
          <button
            onClick={handleSkip}
            disabled={sending}
            style={{
              background: "transparent",
              border: "2px solid #334155",
              color: "#94A3B8",
              borderRadius: 12,
              padding: "14px 32px",
              cursor: sending ? "not-allowed" : "pointer",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "'Syne', sans-serif",
              opacity: sending ? 0.5 : 1,
              transition: "all 0.2s"
            }}
          >
            Skip ⏭️
          </button>

          <button
            onClick={handleSend}
            disabled={loading || sending || !emailText}
            style={{
              background: loading || !emailText
                ? "#334155"
                : "linear-gradient(135deg, #2563EB, #7C3AED)",
              border: "none",
              color: "#fff",
              borderRadius: 12,
              padding: "14px 40px",
              cursor: loading || sending || !emailText ? "not-allowed" : "pointer",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "'Syne', sans-serif",
              opacity: loading || !emailText ? 0.5 : 1,
              transition: "all 0.2s",
              boxShadow: loading || !emailText ? "none" : "0 4px 12px rgba(37, 99, 235, 0.3)"
            }}
          >
            {sending ? "Sending..." : "Send 📧"}
          </button>
        </div>
      </div>

      {/* Card Counter */}
      <div style={{
        textAlign: "center",
        marginTop: 16,
        color: "#64748B",
        fontSize: 13
      }}>
        {hasMore ? `${selectedContacts.length - currentIndex - 1} more to review` : "Last one! 🎯"}
      </div>
    </div>
  );
}
