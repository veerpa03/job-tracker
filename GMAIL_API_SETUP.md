# 📧 Gmail API Integration Guide

## Why Gmail API?

**Current (mailto:):**
- ❌ Doesn't read sent emails
- ❌ Doesn't detect replies
- ❌ Can't send directly
- ✅ Simple, no setup

**With Gmail API:**
- ✅ Reads your sent emails automatically
- ✅ Detects when contacts reply
- ✅ Sends directly from your app
- ✅ Threading support (sends as reply)
- ✅ Auto-updates contact status
- ⚠️ Requires setup (20 minutes)

---

## 🚀 Setup Instructions

### Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Click **"Create Project"** (top right)
3. Name: "Job Tracker Email"
4. Click **Create**

### Step 2: Enable Gmail API

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Gmail API"**
3. Click on it
4. Click **"Enable"**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure OAuth consent screen:
   - User Type: **External**
   - App name: **Job Tracker**
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `gmail.send`, `gmail.readonly`, `gmail.modify`
   - Test users: Add your email
   - Click **Save and Continue**

4. Back to Credentials:
   - Application type: **Web application**
   - Name: **Job Tracker Web Client**
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://localhost:3000`
     - Your production URL (if deployed)
   - Authorized redirect URIs:
     - `http://localhost:5173`
     - Your production URL (if deployed)
   - Click **Create**

5. **Copy the Client ID** (looks like: `xxxx.apps.googleusercontent.com`)

### Step 4: Add Client ID to .env

```bash
# Add this to your .env file
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

### Step 5: Restart Dev Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

---

## 🎯 How It Works

### 1. User Authentication
```
User clicks "Connect Gmail" → Google OAuth popup →
User approves → Access token stored → Ready to send!
```

### 2. Sending Follow-Up Emails
```
1. App searches Gmail for original email to contact
2. If found: Sends as reply (threaded)
3. If not found: Sends as new email
4. Contact auto-updated in database
5. Status changed to "Message Sent"
```

### 3. Reply Detection
```
1. App checks Gmail for emails FROM contact
2. If found: Updates status to "Responded ✅"
3. Notifies you: "John Doe replied!"
4. Auto-updates follow-up date
```

### 4. Email Threading
```
Original Email (You → Contact)
  └─ Follow-Up #1 (You → Contact) [in same thread]
    └─ Their Reply (Contact → You)
      └─ Follow-Up #2 (You → Contact) [in same thread]
```

---

## 🔒 Security & Privacy

### What Access Does the App Get?

**Scopes Requested:**
- `gmail.send` - Send emails on your behalf
- `gmail.readonly` - Read your sent emails
- `gmail.modify` - Mark emails as read/unread

**What We DON'T Access:**
- ❌ Your inbox (except to check replies)
- ❌ Your contacts list
- ❌ Any other Google services
- ❌ Ability to delete emails

**Where Is Your Token Stored?**
- In your browser's localStorage (local only)
- Never sent to any server (except Google)
- You can revoke access anytime at https://myaccount.google.com/permissions

### Revoking Access

1. Go to https://myaccount.google.com/permissions
2. Find "Job Tracker"
3. Click "Remove Access"
4. Done!

---

## 💰 Cost

**Gmail API Quota:**
- **FREE** for personal use
- 1 billion quota units/day
- 1 email = ~25 quota units
- **= 40 million emails/day** 😅

You'll never hit the limit!

---

## 🔄 Comparison: mailto: vs Gmail API

| Feature | mailto: | Gmail API |
|---------|---------|-----------|
| Setup Time | 0 min | 20 min |
| Send Directly | ❌ (opens client) | ✅ |
| Read Sent Emails | ❌ | ✅ |
| Detect Replies | ❌ | ✅ |
| Email Threading | ❌ | ✅ |
| Auto-Update Status | ❌ | ✅ |
| Attachments | Manual | Automatic |
| Cost | Free | Free |
| Privacy | Best (nothing shared) | Good (Google only) |

---

## 🎨 UI Changes with Gmail API

### Settings Tab
```
⚙️ Email Configuration

○ Simple Mode (mailto:) - Opens your email client
● Gmail API Mode - Send directly from app

[Connect with Gmail] ← New button
✓ Connected as: your.email@gmail.com
[Disconnect]
```

### Follow-Ups Tab
```
📧 Follow-Up Cards

Status: Sending... ⏳
✓ Sent directly via Gmail!
✓ Found in thread with original email
✓ Contact updated
```

### Auto-Reply Detection
```
🔔 New: 3 contacts replied!

John Doe (OpenAI) replied 2 days ago
Jane Smith (Google) replied yesterday
...

[Update All Statuses]
```

---

## 🐛 Troubleshooting

### "Failed to authenticate"
→ Check that Client ID is correct in .env
→ Make sure you added your email as test user
→ Try in incognito mode

### "Invalid redirect URI"
→ Add `http://localhost:5173` to authorized URIs
→ Restart dev server after changing .env

### "Access denied"
→ Check OAuth consent screen scopes
→ Make sure Gmail API is enabled
→ Add yourself as test user

### "Quota exceeded"
→ You've hit the free tier limit (unlikely!)
→ Wait 24 hours for reset
→ Or upgrade to paid tier (if needed)

---

## 📊 Feature Comparison Table

### Current Implementation (mailto:)
```javascript
// How it works now:
1. Generate email with AI ✓
2. User clicks "Send"
3. mailto: link opens Gmail/Outlook
4. User manually sends
5. Contact updated in DB ✓
```

### With Gmail API
```javascript
// How it would work:
1. Generate email with AI ✓
2. User clicks "Send"
3. App searches Gmail for original email ✓
4. App sends directly (threaded) ✓
5. App detects replies ✓
6. Auto-updates status ✓
7. Contact updated in DB ✓
```

---

## 🚀 Implementation Options

### Option 1: Keep Current (Recommended for Now)
- ✅ Works great
- ✅ No setup needed
- ✅ Most private
- ✅ User stays in control
- ⚠️ Manual sending

### Option 2: Add Gmail API (Optional Enhancement)
- ✅ Fully automated
- ✅ Reply detection
- ✅ Threading support
- ⚠️ 20 min setup
- ⚠️ Requires OAuth

### Option 3: Hybrid (Best of Both)
- ✅ Support both modes
- ✅ User chooses in Settings
- ✅ Fallback to mailto: if not connected
- ✅ Most flexible

---

## 🎯 Next Steps

**Want Gmail API integration?**

1. Follow setup steps above
2. I'll add:
   - "Connect Gmail" button in Settings
   - OAuth flow
   - Direct sending
   - Reply detection
   - Auto-status updates
   - Email threading

**Happy with current mailto: approach?**

- That's totally fine!
- It works great for most use cases
- Zero setup, maximum privacy
- You stay in full control

---

## 💡 My Recommendation

**For MVP (now):** Stick with mailto: - it's simple and works!

**For v2.0 (later):** Add Gmail API as optional premium feature

**Reasoning:**
- mailto: is good enough for 80% of users
- Gmail API is complex setup
- Better to validate the feature first
- Can always add API later

What do you think? 🤔
