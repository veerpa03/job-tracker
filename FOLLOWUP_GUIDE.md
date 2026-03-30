# 📧 Follow-Up Email Feature Guide

## Overview

The Follow-Up feature uses AI to automatically generate personalized follow-up emails for your job search contacts. It's **100% free** and uses **zero database storage** - everything happens in real-time!

## 🚀 Quick Start

### 1. Get Your Free Groq API Key

1. Visit [console.groq.com/keys](https://console.groq.com/keys)
2. Sign up for a free account (no credit card required)
3. Create a new API key
4. Copy the key (starts with `gsk_...`)

**Free tier limits:** 14,400 requests/day (more than enough!)

### 2. Configure Settings

1. Click **⚙️ Settings** tab
2. Paste your Groq API key
3. Customize the email prompt (optional)
4. Add your email signature (optional)
5. Click **💾 Save Settings**

### 3. Use Follow-Ups

1. Go to **📧 Follow-Ups** tab
2. You'll see contacts that need follow-up (based on follow-up dates)
3. AI generates a personalized email for each contact
4. Edit the message if you want
5. Attach files (resume, portfolio, etc.) - optional
6. Click **Send** - opens your default email client
7. Send from your email app!

## ✨ Features

### Tinder-Style Card Interface
- Swipe through contacts one by one
- See all context: name, company, role, days since last contact
- View your original outreach notes
- Progress bar shows how many left

### AI Email Generation
- Reads your original outreach notes
- Personalized for each contact
- Professional and concise (2-3 sentences)
- References the original message naturally
- Shows continued interest without being desperate

### File Attachments
- Upload multiple files
- Preview before sending
- Downloads automatically when you send
- Resume, portfolio, references, etc.

### Customizable Prompts
- Full control over AI behavior
- Use placeholders: `{contact_name}`, `{company}`, `{days_since}`, etc.
- Reset to default anytime
- Stored locally in your browser

### Auto-Update Contacts
- After sending, contact dates are updated automatically
- Outreach date → today
- Follow-up date → +7 days
- Status updated if needed

## 🎯 How It Works

### Zero Database Storage!
- **No emails stored** in database
- **No attachments stored** (temporary in browser only)
- **Prompt stored** in localStorage (your browser)
- **API key stored** in localStorage (never sent anywhere except Groq)
- **Only tracking data** saved: "Email sent on X date"

### Database Impact
- Current: ~250KB for 500 contacts
- After: **Still ~250KB** (no change!)
- Can handle **10,000+ contacts** on free tier

### Privacy & Security
- Your API key never leaves your browser (except to Groq)
- Emails generated on-demand, not pre-stored
- Attachments never uploaded to any server
- Everything happens client-side

## 📝 Customizing Prompts

### Available Placeholders
- `{contact_name}` - Contact's name
- `{contact_role}` - Their job title
- `{company}` - Company name
- `{days_since}` - Days since last email
- `{original_notes}` - Your outreach notes

### Example Custom Prompt
```
You are writing a friendly follow-up email.

Context:
- Reaching out to {contact_name} ({contact_role}) at {company}
- It's been {days_since} days since my last email
- Original message: {original_notes}

Write a casual, enthusiastic 2-sentence follow-up that:
1. References our previous conversation
2. Asks if they had a chance to review my application
3. Sounds natural and friendly (not formal)

Just write the body text, no subject or signature.
```

## 🛠️ Workflow Example

1. **Add Contact** → Name, email, company, role, notes about what you sent
2. **Set Follow-up Date** → 7 days from now
3. **Wait...** ⏰
4. **Follow-Up Tab Shows Badge** → (3) contacts need follow-up
5. **Click Follow-Ups Tab** → See cards
6. **AI Generates Email** → Based on your notes
7. **Edit if Needed** → Or use as-is
8. **Attach Files** → Resume, etc. (optional)
9. **Send** → Opens email client
10. **Contact Auto-Updated** → Ready for next follow-up cycle!

## 💡 Pro Tips

### 1. Write Good Original Notes
The better your notes in the contact, the better the AI-generated follow-up!

**Good:**
> "Reached out via LinkedIn about SWE internship. Mentioned my ML project and Ohio connection. Asked for referral."

**Bad:**
> "Sent message"

### 2. Customize for Your Style
Adjust the prompt to match your personality:
- Formal? Keep it professional
- Casual? Make it friendly
- Technical? Reference specific tech

### 3. Use Attachments Strategically
- Updated resume for specific role
- Portfolio link document
- Reference letters
- Relevant project write-ups

### 4. Don't Over-Follow-Up
- Skip contacts who explicitly said no
- Space out follow-ups (7+ days)
- Max 2-3 follow-ups per contact

## 🔧 Technical Details

### Tech Stack
- **AI:** Groq API (Llama 3.1 70B)
- **Storage:** localStorage (browser)
- **Database:** Supabase (minimal usage)
- **Email:** Default mail client (mailto:)

### File Size Limits
- No server upload → No limits!
- Limited only by your email provider
- Gmail: 25MB per email
- Outlook: 20MB per email

### Browser Compatibility
- Chrome ✓
- Firefox ✓
- Safari ✓
- Edge ✓

### Offline Mode
- Settings and prompts work offline (stored locally)
- AI generation requires internet (Groq API)
- Email sending uses your mail client

## 🐛 Troubleshooting

### "Please set your Groq API key in Settings"
→ Go to Settings tab and add your API key

### Email doesn't open in client
→ Check your browser's default mail app settings

### AI generates weird responses
→ Customize the prompt in Settings to be more specific

### Attachments not included in email
→ `mailto:` links can't include attachments - they download automatically, attach them manually in your email client

### Contact not showing in Follow-Ups
→ Check:
- Has email address?
- Status is not "Not Contacted"?
- Follow-up date is today or past?
- Status is not "Meeting Done" or "No Response"?

## 🎨 Future Enhancements (Coming Soon)

- [ ] Gmail API integration (send directly)
- [ ] Email templates library
- [ ] Bulk email generation
- [ ] A/B test different prompts
- [ ] Response tracking
- [ ] Email scheduling

## 📊 Cost Breakdown

- Groq API: **FREE** (14,400 requests/day)
- Supabase: **FREE** (500MB, we use <1MB)
- Email Sending: **FREE** (your own email)
- File Storage: **FREE** (browser only)

**Total Monthly Cost: $0** 🎉

---

Need help? Check the in-app info section in Settings! Happy job hunting! 💼✨
