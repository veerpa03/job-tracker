import { useState, useEffect } from "react";
import { supabase, jobToDb, dbToJob, contactToDb, dbToContact } from "./supabase";
import FollowUpCards from "./FollowUpCards";
import Settings from "./Settings";
import { openEmailClient, downloadAttachments, getUpdatedContactData } from "./emailService";
import { isGmailConnected, sendEmailViaGmail } from "./gmailBackendService";

const STATUS_OPTIONS = ["Applied","Phone Screen","Technical Round","Take-Home","Onsite / Final","Offer","Rejected","No Response","Withdrew"];
const METHOD_OPTIONS = ["Cold Apply","Referral","Alumni Network","Recruiter Outreach","Work at a Startup","Handshake","LinkedIn","Career Fair","Other"];
const PRIORITY_OPTIONS = ["🔴 Hot","🟡 Warm","🟢 Cold"];
const RESUME_OPTIONS = ["AI/ML Engineer","SWE / Backend","Full-Stack","Data Engineer"];
const H1B_OPTIONS = ["Yes","No","Unknown"];
const CONTACT_TYPE_OPTIONS = ["Recruiter","Engineering Lead","Hiring Manager","Alumni (OU)","Alumni (Other)","Professor","Other"];
const CONTACT_STATUS_OPTIONS = ["Not Contacted","Message Sent","No Response","Responded ✅","Referral Submitted 🎯","Meeting Scheduled","Meeting Done"];

const STATUS_STYLES = {
  "Applied":        { bg:"#F1F5F9", text:"#475569", dot:"#94A3B8" },
  "Phone Screen":   { bg:"#FEF3C7", text:"#92400E", dot:"#F59E0B" },
  "Technical Round":{ bg:"#DBEAFE", text:"#1E40AF", dot:"#3B82F6" },
  "Take-Home":      { bg:"#EDE9FE", text:"#5B21B6", dot:"#8B5CF6" },
  "Onsite / Final": { bg:"#F0ABFC", text:"#701A75", dot:"#D946EF" },
  "Offer":          { bg:"#DCFCE7", text:"#14532D", dot:"#22C55E" },
  "Rejected":       { bg:"#FEE2E2", text:"#991B1B", dot:"#EF4444" },
  "No Response":    { bg:"#FEE2E2", text:"#991B1B", dot:"#EF4444" },
  "Withdrew":       { bg:"#F8FAFC", text:"#64748B", dot:"#CBD5E1" },
};

const PRIORITY_STYLES = {
  "🔴 Hot":  { bg:"#FEE2E2", text:"#991B1B" },
  "🟡 Warm": { bg:"#FEF9C3", text:"#92400E" },
  "🟢 Cold": { bg:"#DCFCE7", text:"#14532D" },
};

const RESPONSIVE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: #0F172A; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
  input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
  select option { background: #1E293B; }

  .app-wrap { background:#0F172A; min-height:100vh; font-family:'DM Mono',monospace; color:#E2E8F0; padding-bottom:60px; font-size:14px; }
  .header-bar { background:linear-gradient(135deg,#0F172A 0%,#1E1B4B 100%); border-bottom:1px solid #1E293B; }
  .header-inner { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; padding:20px 24px; max-width:1200px; margin:0 auto; }
  .header-title { font-family:'Syne',sans-serif; font-size:24px; font-weight:800; background:linear-gradient(90deg,#60A5FA,#A78BFA); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .header-sub { color:#475569; font-size:11px; letter-spacing:0.08em; margin-top:4px; }
  .nav-group { display:flex; gap:10px; flex-wrap:wrap; }
  .main-content { max-width:1200px; margin:0 auto; padding:24px; }

  .stats-row { display:flex; gap:14px; margin-bottom:24px; flex-wrap:wrap; }
  .stat-card { flex:1; min-width:140px; background:#1E293B; border:1px solid #334155; border-radius:14px; padding:20px 22px; }
  .filter-row { display:flex; gap:10px; margin-bottom:18px; flex-wrap:wrap; align-items:center; }
  .search-input { background:#1E293B; border:1px solid #334155; color:#E2E8F0; border-radius:8px; padding:10px 14px; font-size:14px; outline:none; font-family:'DM Mono',monospace; width:220px; }

  .form-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .form-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }

  .job-card-body { display:flex; align-items:flex-start; gap:16px; }
  .job-card-meta { display:flex; flex-direction:column; gap:8px; align-items:flex-end; min-width:200px; flex-shrink:0; }

  .contact-card-body { display:flex; gap:16px; align-items:flex-start; }
  .contact-card-meta { display:flex; flex-direction:column; gap:8px; align-items:flex-end; flex-shrink:0; }

  .dashboard-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }

  .btn-add { background:linear-gradient(135deg,#2563EB,#7C3AED); border:none; color:#fff; border-radius:9px; padding:11px 22px; cursor:pointer; font-size:14px; font-weight:700; font-family:'Syne',sans-serif; white-space:nowrap; }
  .btn-add-contact { background:linear-gradient(135deg,#059669,#0284C7); border:none; color:#fff; border-radius:9px; padding:11px 22px; cursor:pointer; font-size:14px; font-weight:700; font-family:'Syne',sans-serif; white-space:nowrap; }

  .loading-wrap { display:flex; align-items:center; justify-content:center; padding:80px 20px; gap:14px; color:#475569; font-size:15px; }
  .spinner { width:24px; height:24px; border:3px solid #334155; border-top-color:#60A5FA; border-radius:50%; animation:spin 0.7s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }

  .error-banner { background:#FEE2E2; border:1px solid #F87171; border-radius:10px; padding:14px 18px; color:#991B1B; font-size:14px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center; gap:10px; }

  @media (max-width:768px) {
    .header-inner { padding:18px 16px; }
    .main-content { padding:18px 14px; }
    .form-grid-2, .form-grid-3 { grid-template-columns:1fr; }
    .job-card-body { flex-wrap:wrap; }
    .job-card-meta { align-items:flex-start; min-width:unset; width:100%; flex-direction:row; flex-wrap:wrap; }
    .contact-card-body { flex-wrap:wrap; }
    .contact-card-meta { align-items:flex-start; width:100%; flex-direction:row; flex-wrap:wrap; }
    .dashboard-grid { grid-template-columns:1fr; }
    .search-input { width:100%; }
    .stat-card { min-width:calc(50% - 8px); }
    .filter-row { gap:8px; }
  }

  @media (max-width:480px) {
    .header-inner { padding:14px 12px; gap:10px; }
    .main-content { padding:14px 10px; }
    .stat-card { min-width:calc(50% - 6px); padding:16px 14px !important; }
    .stat-card .stat-val { font-size:24px !important; }
    .nav-group button { padding:8px 12px !important; font-size:12px !important; }
    .btn-add, .btn-add-contact { font-size:13px; padding:10px 16px; }
    .search-input { font-size:13px; }
  }
`;

function today() {
  return new Date().toISOString().split("T")[0];
}
function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}
function daysDiff(dateStr) {
  if (!dateStr) return null;
  return Math.round((new Date(dateStr) - new Date(today())) / 86400000);
}
function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.round((new Date(today()) - new Date(dateStr)) / 86400000);
}
function shortUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "") + (u.pathname.length > 20 ? u.pathname.slice(0,20)+"…" : u.pathname);
  } catch { return url; }
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

const emptyJob = () => ({
  id: uid(), company: "", role: "", url: "",
  dateApplied: today(), followUp: addDays(today(), 7),
  method: "Cold Apply", priority: "🟢 Cold", status: "Applied",
  h1b: "Unknown", eVerify: "Unknown", resume: "AI/ML Engineer",
  notes: "", contacts: "",
});

const emptyContact = () => ({
  id: uid(), company: "", name: "", role: "", type: "Recruiter",
  linkedin: "", email: "", outreachDate: today(),
  followUp: addDays(today(), 7), status: "Not Contacted", notes: "",
});

// ── UI primitives ────────────────────────────────────────────────────────────

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      background:"#0F172A", border:"1px solid #334155", color:"#E2E8F0",
      borderRadius:7, padding:"8px 12px", fontSize:14, cursor:"pointer",
      outline:"none", fontFamily:"'DM Mono', monospace", maxWidth:"100%", width:"100%"
    }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Badge({ children, style }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding:"4px 12px", borderRadius:99, fontSize:12, fontWeight:700,
      letterSpacing:"0.03em", ...style
    }}>{children}</span>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES["Applied"];
  return (
    <Badge style={{ background: s.bg, color: s.text }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:s.dot, display:"inline-block" }} />
      {status}
    </Badge>
  );
}

function PriorityBadge({ priority }) {
  const s = PRIORITY_STYLES[priority] || PRIORITY_STYLES["🟢 Cold"];
  return <Badge style={{ background: s.bg, color: s.text }}>{priority}</Badge>;
}

function Input({ value, onChange, placeholder, type = "text", style = {} }) {
  return (
    <input type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)} style={{
        background:"#0F172A", border:"1px solid #334155", color:"#E2E8F0",
        borderRadius:7, padding:"9px 12px", fontSize:14, outline:"none",
        fontFamily:"'DM Mono', monospace", width:"100%", boxSizing:"border-box", ...style
      }} />
  );
}

function Textarea({ value, onChange, placeholder, rows = 2 }) {
  return (
    <textarea value={value} placeholder={placeholder} rows={rows}
      onChange={e => onChange(e.target.value)} style={{
        background:"#0F172A", border:"1px solid #334155", color:"#E2E8F0",
        borderRadius:7, padding:"9px 12px", fontSize:14, outline:"none",
        fontFamily:"'DM Mono', monospace", width:"100%", boxSizing:"border-box", resize:"vertical"
      }} />
  );
}

function Autocomplete({ value, onChange, placeholder, suggestions = [] }) {
  const [focused, setFocused] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  useEffect(() => {
    if (value && focused) {
      const filtered = suggestions
        .filter(s => s.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5); // Limit to 5 suggestions
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, [value, focused, suggestions]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        style={{
          background:"#0F172A", border:"1px solid #334155", color:"#E2E8F0",
          borderRadius:7, padding:"9px 12px", fontSize:14, outline:"none",
          fontFamily:"'DM Mono', monospace", width:"100%", boxSizing:"border-box"
        }}
      />
      {filteredSuggestions.length > 0 && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: 8,
          marginTop: 6,
          maxHeight: 220,
          overflowY: "auto",
          zIndex: 1000,
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.3)"
        }}>
          {filteredSuggestions.map((suggestion, idx) => (
            <div
              key={idx}
              onClick={() => {
                onChange(suggestion);
                setFocused(false);
              }}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: 14,
                color: "#E2E8F0",
                borderBottom: idx < filteredSuggestions.length - 1 ? "1px solid #334155" : "none",
                transition: "background 0.15s"
              }}
              onMouseEnter={e => e.target.style.background = "#334155"}
              onMouseLeave={e => e.target.style.background = "transparent"}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-val" style={{ fontSize:30, fontWeight:800, color, fontFamily:"'Syne', sans-serif" }}>{value}</div>
      <div style={{ fontSize:12, color:"#94A3B8", fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", marginTop:4 }}>{label}</div>
      {sub && <div style={{ fontSize:12, color:"#475569", marginTop:5 }}>{sub}</div>}
    </div>
  );
}

// ── Forms ────────────────────────────────────────────────────────────────────

function QuickAddForm({ onAdd, onCancel, initial, saving }) {
  const [form, setForm] = useState(initial || emptyJob());
  const set = k => v => setForm(f => {
    const next = { ...f, [k]: v };
    if (k === "dateApplied") next.followUp = addDays(v, 7);
    return next;
  });

  const lbl = { color:"#94A3B8", fontSize:12, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5, display:"block" };
  const fld = { marginBottom:14 };

  return (
    <div style={{ background:"#1E293B", border:"1px solid #334155", borderRadius:14, padding:"24px 20px", marginBottom:26 }}>
      <h3 style={{ color:"#F8FAFC", fontFamily:"'Syne', sans-serif", fontSize:18, fontWeight:800, marginBottom:22, marginTop:0 }}>
        {initial ? "✏️ Edit Application" : "➕ Add New Application"}
      </h3>

      <div className="form-grid-2">
        <div style={fld}><label style={lbl}>Company *</label><Input value={form.company} onChange={set("company")} placeholder="e.g. OpenAI" /></div>
        <div style={fld}><label style={lbl}>Role Title *</label><Input value={form.role} onChange={set("role")} placeholder="e.g. AI Engineer, New Grad" /></div>
      </div>
      <div style={fld}><label style={lbl}>Job Posting URL</label><Input value={form.url} onChange={set("url")} placeholder="Paste full URL" /></div>
      <div className="form-grid-3">
        <div style={fld}><label style={lbl}>Date Applied</label><Input type="date" value={form.dateApplied} onChange={set("dateApplied")} /></div>
        <div style={fld}><label style={lbl}>Follow-Up <span style={{color:"#3B82F6"}}>(auto)</span></label><Input type="date" value={form.followUp} onChange={set("followUp")} /></div>
        <div style={fld}><label style={lbl}>Priority</label><Select value={form.priority} onChange={set("priority")} options={PRIORITY_OPTIONS} /></div>
      </div>
      <div className="form-grid-3">
        <div style={fld}><label style={lbl}>Method</label><Select value={form.method} onChange={set("method")} options={METHOD_OPTIONS} /></div>
        <div style={fld}><label style={lbl}>Status</label><Select value={form.status} onChange={set("status")} options={STATUS_OPTIONS} /></div>
        <div style={fld}><label style={lbl}>Resume Version</label><Select value={form.resume} onChange={set("resume")} options={RESUME_OPTIONS} /></div>
      </div>
      <div className="form-grid-2">
        <div style={fld}><label style={lbl}>H-1B Sponsor?</label><Select value={form.h1b} onChange={set("h1b")} options={H1B_OPTIONS} /></div>
        <div style={fld}><label style={lbl}>E-Verify? <span style={{color:"#EF4444"}}>(critical!)</span></label><Select value={form.eVerify} onChange={set("eVerify")} options={H1B_OPTIONS} /></div>
      </div>
      <div style={fld}><label style={lbl}>Notes</label><Textarea value={form.notes} onChange={set("notes")} placeholder="Interview questions, recruiter name, next steps…" /></div>

      <div style={{ display:"flex", gap:12, justifyContent:"flex-end", flexWrap:"wrap" }}>
        {onCancel && (
          <button onClick={onCancel} disabled={saving} style={{
            background:"transparent", border:"1px solid #334155", color:"#94A3B8",
            borderRadius:8, padding:"10px 22px", cursor:"pointer", fontSize:14
          }}>Cancel</button>
        )}
        <button onClick={() => { if (form.company && form.role) onAdd(form); }} disabled={saving} style={{
          background:"linear-gradient(135deg,#2563EB,#7C3AED)", border:"none",
          color:"#fff", borderRadius:8, padding:"10px 26px", cursor:saving?"not-allowed":"pointer",
          fontSize:14, fontWeight:700, fontFamily:"'Syne', sans-serif", opacity:saving?0.7:1
        }}>
          {saving ? "Saving…" : initial ? "Save Changes" : "Add Application ✓"}
        </button>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("apps");
  const [emailSendSuccess, setEmailSendSuccess] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [editContact, setEditContact] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [search, setSearch] = useState("");
  const [contactsToShow, setContactsToShow] = useState(15); // Pagination for contacts

  // Contact filters
  const [contactSearch, setContactSearch] = useState("");
  const [filterContactStatus, setFilterContactStatus] = useState("All");
  const [filterContactType, setFilterContactType] = useState("All");
  const [filterContactCompany, setFilterContactCompany] = useState("All");
  const [filterFollowUp, setFilterFollowUp] = useState("All"); // All, Overdue, Upcoming, None

  // ── Load data from Supabase on mount ──────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [{ data: jobRows, error: jErr }, { data: contactRows, error: cErr }] = await Promise.all([
          supabase.from("applications").select("*").order("created_at", { ascending: false }),
          supabase.from("contacts").select("*").order("created_at", { ascending: false }),
        ]);
        if (jErr) throw jErr;
        if (cErr) throw cErr;
        setJobs(jobRows.map(dbToJob));
        setContacts(contactRows.map(dbToContact));
      } catch (e) {
        setError(e.message || "Failed to load data from Supabase.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Jobs CRUD ─────────────────────────────────────────────────────────────
  const addJob = async (form) => {
    setSaving(true);
    setError(null);
    try {
      if (editJob) {
        const { error: e } = await supabase.from("applications").update(jobToDb(form)).eq("id", editJob.id);
        if (e) throw e;
        setJobs(j => j.map(x => x.id === editJob.id ? { ...form, id: editJob.id } : x));
        setEditJob(null);
      } else {
        const { error: e } = await supabase.from("applications").insert(jobToDb(form));
        if (e) throw e;
        setJobs(j => [form, ...j]);
        setShowForm(false);
      }
    } catch (e) {
      setError(e.message || "Failed to save application.");
    } finally {
      setSaving(false);
    }
  };

  const deleteJob = async (id) => {
    setError(null);
    try {
      const { error: e } = await supabase.from("applications").delete().eq("id", id);
      if (e) throw e;
      setJobs(j => j.filter(x => x.id !== id));
    } catch (e) {
      setError(e.message || "Failed to delete application.");
    }
  };

  const updateStatus = async (id, status) => {
    setError(null);
    try {
      const { error: e } = await supabase.from("applications").update({ status }).eq("id", id);
      if (e) throw e;
      setJobs(j => j.map(x => x.id === id ? { ...x, status } : x));
    } catch (e) {
      setError(e.message || "Failed to update status.");
    }
  };

  // ── Contacts CRUD ─────────────────────────────────────────────────────────
  const addContact = async (form) => {
    setSaving(true);
    setError(null);
    try {
      // Auto-update follow-up date when status changes to completed/active states
      const activeStatuses = ["Responded ✅", "Meeting Scheduled", "Referral Submitted 🎯"];
      if (editContact && activeStatuses.includes(form.status) && editContact.status !== form.status) {
        // If status changed to an active state, set follow-up to 7 days from now
        form.followUp = addDays(today(), 7);
      }

      if (editContact) {
        const { error: e } = await supabase.from("contacts").update(contactToDb(form)).eq("id", editContact.id);
        if (e) throw e;
        setContacts(c => c.map(x => x.id === editContact.id ? { ...form, id: editContact.id } : x));
        setEditContact(null);
      } else {
        const { error: e } = await supabase.from("contacts").insert(contactToDb(form));
        if (e) throw e;
        setContacts(c => [form, ...c]);
        setShowContactForm(false);
      }
    } catch (e) {
      setError(e.message || "Failed to save contact.");
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = async (id) => {
    setError(null);
    try {
      const { error: e } = await supabase.from("contacts").delete().eq("id", id);
      if (e) throw e;
      setContacts(c => c.filter(x => x.id !== id));
    } catch (e) {
      setError(e.message || "Failed to delete contact.");
    }
  };

  // ── Follow-up Email Handlers ──────────────────────────────────────────────
  const handleSendFollowUp = async (contact, emailBody, attachmentFiles, previousEmail) => {
    setError(null);
    try {
      // Check if Gmail is connected
      const gmailEnabled = isGmailConnected();

      if (gmailEnabled) {
        // Send via Gmail API
        if (attachmentFiles && attachmentFiles.length > 0) {
          alert('⚠️ Gmail API doesn\'t support attachments yet. They will be downloaded separately.');
          downloadAttachments(attachmentFiles);
        }

        await sendEmailViaGmail(contact, emailBody, previousEmail);
        alert('✅ Email sent via Gmail!');
      } else {
        // Fall back to opening email client (mailto:)
        const result = openEmailClient(contact, emailBody, attachmentFiles);

        if (result.warning) {
          alert(result.warning);
        }

        // Download attachments if any
        if (attachmentFiles && attachmentFiles.length > 0) {
          downloadAttachments(attachmentFiles);
        }
      }

      // Update contact in database
      const updatedData = getUpdatedContactData();
      const updatedContact = { ...contact, ...updatedData };

      const { error: e } = await supabase.from("contacts").update(contactToDb(updatedContact)).eq("id", contact.id);
      if (e) throw e;

      setContacts(c => c.map(x => x.id === contact.id ? updatedContact : x));
      setEmailSendSuccess(true);
      setTimeout(() => setEmailSendSuccess(false), 3000);

      return { success: true };
    } catch (e) {
      setError(e.message || "Failed to process follow-up.");
      throw e;
    }
  };

  const handleSkipFollowUp = (contact) => {
    // Just skip, don't update anything
    console.log("Skipped follow-up for", contact.name);
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const filteredJobs = jobs.filter(j => {
    if (filterStatus !== "All" && j.status !== filterStatus) return false;
    if (filterPriority !== "All" && j.priority !== filterPriority) return false;
    if (search && !`${j.company} ${j.role}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredContacts = contacts.filter(c => {
    if (filterContactStatus !== "All" && c.status !== filterContactStatus) return false;
    if (filterContactType !== "All" && c.type !== filterContactType) return false;
    if (filterContactCompany !== "All" && c.company !== filterContactCompany) return false;
    if (contactSearch && !`${c.name} ${c.company} ${c.role}`.toLowerCase().includes(contactSearch.toLowerCase())) return false;

    // Follow-up filter
    if (filterFollowUp !== "All") {
      const dFU = daysDiff(c.followUp);
      const fuOverdue = dFU !== null && dFU <= 0 && !["Meeting Done", "No Response"].includes(c.status);
      const fuUpcoming = dFU !== null && dFU > 0;
      const noFollowUp = !c.followUp || c.followUp === "";

      if (filterFollowUp === "Overdue" && !fuOverdue) return false;
      if (filterFollowUp === "Upcoming" && !fuUpcoming) return false;
      if (filterFollowUp === "None" && !noFollowUp) return false;
    }

    return true;
  });

  // Contacts that need follow-up (for Follow-Ups tab)
  const contactsNeedingFollowUp = contacts.filter(c => {
    // Must have email address
    if (!c.email) return false;

    // Must have sent a message before
    if (c.status === "Not Contacted") return false;

    // Ignore completed/dead statuses
    if (["Meeting Done", "No Response", "Referral Submitted 🎯"].includes(c.status)) return false;

    // Check if follow-up is overdue or due today
    const dFU = daysDiff(c.followUp);
    return dFU !== null && dFU <= 0;
  });

  const stats = {
    total: jobs.length,
    active: jobs.filter(j => ["Phone Screen","Technical Round","Take-Home","Onsite / Final"].includes(j.status)).length,
    offers: jobs.filter(j => j.status === "Offer").length,
    hot: jobs.filter(j => j.priority === "🔴 Hot").length,
    followUps: jobs.filter(j => {
      const d = daysDiff(j.followUp);
      return d !== null && d <= 0 && !["Offer","Rejected","Withdrew"].includes(j.status);
    }).length,
  };

  const navBtn = (id, label) => (
    <button onClick={() => setTab(id)} style={{
      background: tab === id ? "linear-gradient(135deg,#2563EB,#7C3AED)" : "transparent",
      border: tab === id ? "none" : "1px solid #334155",
      color: tab === id ? "#fff" : "#94A3B8",
      borderRadius:8, padding:"9px 16px", cursor:"pointer", fontSize:13,
      fontWeight:700, fontFamily:"'Syne', sans-serif", transition:"all 0.15s", whiteSpace:"nowrap"
    }}>{label}</button>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-wrap">
      <style>{RESPONSIVE_CSS}</style>

      <div className="header-bar">
        <div className="header-inner">
          <div>
            <div className="header-title">Viraj&apos;s Job Hunt 2026</div>
            <div className="header-sub">F1 OPT · CS @ Ohio University · May 2026</div>
          </div>
          <div className="nav-group">
            {navBtn("apps","📋 Applications")}
            {navBtn("contacts","👥 Contacts")}
            {navBtn("followups",`📧 Follow-Ups${contactsNeedingFollowUp.length > 0 ? ` (${contactsNeedingFollowUp.length})` : ""}`)}
            {navBtn("dashboard","📊 Dashboard")}
            {navBtn("settings","⚙️ Settings")}
          </div>
        </div>
      </div>

      <div className="main-content">

        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#991B1B", fontWeight:700, fontSize:16 }}>✕</button>
          </div>
        )}

        {loading ? (
          <div className="loading-wrap">
            <div className="spinner" />
            Loading your data…
          </div>
        ) : (
          <>
            {/* APPLICATIONS TAB */}
            {tab === "apps" && (
              <>
                <div className="stats-row">
                  <StatCard label="Total Applied" value={stats.total} color="#60A5FA" />
                  <StatCard label="Active" value={stats.active} color="#34D399" />
                  <StatCard label="Offers" value={stats.offers} color="#22C55E" sub={stats.offers > 0 ? "🎉" : ""} />
                  <StatCard label="🔴 Hot" value={stats.hot} color="#F87171" />
                  <StatCard label="Follow-Ups" value={stats.followUps} color={stats.followUps > 0 ? "#FBBF24" : "#94A3B8"} sub={stats.followUps > 0 ? "⚠️ Due" : "All clear"} />
                </div>

                <div className="filter-row">
                  <button onClick={() => { setShowForm(!showForm); setEditJob(null); }} className="btn-add">
                    {showForm ? "✕ Cancel" : "➕ Add Application"}
                  </button>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="🔍 Search company or role…" className="search-input" />
                  <Select value={filterStatus} onChange={setFilterStatus} options={["All", ...STATUS_OPTIONS]} />
                  <Select value={filterPriority} onChange={setFilterPriority} options={["All", ...PRIORITY_OPTIONS]} />
                </div>

                {showForm && !editJob && (
                  <QuickAddForm onAdd={addJob} onCancel={() => setShowForm(false)} saving={saving} />
                )}
                {editJob && (
                  <QuickAddForm initial={editJob} onAdd={addJob} onCancel={() => setEditJob(null)} saving={saving} />
                )}

                {filteredJobs.length === 0 && (
                  <div style={{ textAlign:"center", color:"#334155", padding:"60px 20px", fontSize:15 }}>
                    {jobs.length === 0 ? "No applications yet — add your first one above! 🚀" : "No results for current filters."}
                  </div>
                )}

                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {filteredJobs.map(job => {
                    const dSince = daysSince(job.dateApplied);
                    const dFU = daysDiff(job.followUp);
                    const fuOverdue = dFU !== null && dFU <= 0 && !["Offer","Rejected","Withdrew"].includes(job.status);
                    return (
                      <div key={job.id} style={{
                        background:"#1E293B",
                        border:`1px solid ${fuOverdue ? "#F87171" : "#334155"}`,
                        borderRadius:12, padding:"16px 18px",
                        borderLeft:`4px solid ${fuOverdue ? "#EF4444" : job.priority === "🔴 Hot" ? "#EF4444" : job.priority === "🟡 Warm" ? "#F59E0B" : "#3B82F6"}`
                      }}>
                        <div className="job-card-body">
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:8 }}>
                              <span style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:16, color:"#F8FAFC" }}>{job.company}</span>
                              <PriorityBadge priority={job.priority} />
                              {fuOverdue && <Badge style={{background:"#FEE2E2",color:"#991B1B"}}>⚠️ Follow up!</Badge>}
                            </div>
                            <div style={{ color:"#94A3B8", fontSize:14, marginBottom:8 }}>{job.role}</div>
                            <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                              <StatusBadge status={job.status} />
                              <Badge style={{background:"#1E293B",color:"#64748B",border:"1px solid #334155"}}>{job.resume}</Badge>
                              {job.url && (
                                <a href={job.url} target="_blank" rel="noreferrer" style={{ color:"#60A5FA", fontSize:11, textDecoration:"none" }}>
                                  🔗 {shortUrl(job.url)}
                                </a>
                              )}
                            </div>
                            {job.notes && (
                              <div style={{ color:"#64748B", fontSize:13, marginTop:10, background:"#0F172A", borderRadius:6, padding:"8px 10px" }}>
                                {job.notes}
                              </div>
                            )}
                          </div>

                          <div className="job-card-meta">
                            <Select value={job.status} onChange={v => updateStatus(job.id, v)} options={STATUS_OPTIONS} />
                            <div style={{ color:"#475569", fontSize:12 }}>
                              Applied {dSince === 0 ? "today" : `${dSince}d ago`} · {job.method}
                            </div>
                            {job.followUp && (
                              <div style={{ fontSize:12, color: fuOverdue ? "#F87171" : "#94A3B8" }}>
                                {fuOverdue ? `⚠️ ${Math.abs(dFU)}d overdue` : dFU === 0 ? "⏰ Follow up today!" : `Follow up in ${dFU}d`}
                              </div>
                            )}
                            <div style={{ display:"flex", gap:8 }}>
                              <button onClick={() => { setEditJob(job); setShowForm(false); window.scrollTo(0,0); }}
                                style={{ background:"#0F172A", border:"1px solid #334155", color:"#94A3B8", borderRadius:6, padding:"6px 12px", cursor:"pointer", fontSize:12 }}>Edit</button>
                              <button onClick={() => deleteJob(job.id)}
                                style={{ background:"#0F172A", border:"1px solid #334155", color:"#F87171", borderRadius:6, padding:"6px 12px", cursor:"pointer", fontSize:12 }}>Delete</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* CONTACTS TAB */}
            {tab === "contacts" && (
              <>
                <div className="stats-row">
                  <StatCard
                    label="Total Contacts"
                    value={contacts.length}
                    color="#A78BFA"
                  />
                  <StatCard
                    label="Active Outreach"
                    value={contacts.filter(c => !["No Response", "Meeting Done"].includes(c.status)).length}
                    color="#34D399"
                  />
                  <StatCard
                    label="Responded"
                    value={contacts.filter(c => c.status === "Responded ✅").length}
                    color="#22C55E"
                  />
                  <StatCard
                    label="Follow-Ups Due"
                    value={contacts.filter(c => {
                      const d = daysDiff(c.followUp);
                      return d !== null && d <= 0 && !["Meeting Done", "No Response"].includes(c.status);
                    }).length}
                    color="#FBBF24"
                    sub={contacts.filter(c => {
                      const d = daysDiff(c.followUp);
                      return d !== null && d <= 0 && !["Meeting Done", "No Response"].includes(c.status);
                    }).length > 0 ? "⚠️ Action needed" : "All clear"}
                  />
                </div>

                <div style={{ marginBottom:20 }}>
                  <button onClick={() => { setShowContactForm(!showContactForm); setEditContact(null); }} className="btn-add-contact">
                    {showContactForm ? "✕ Cancel" : "➕ Add Contact"}
                  </button>
                </div>

                <div style={{ background:"#1E293B", border:"1px solid #334155", borderRadius:12, padding:"20px", marginBottom:20 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
                    <h3 style={{ fontFamily:"'Syne', sans-serif", fontSize:16, fontWeight:800, color:"#F8FAFC", margin:0 }}>
                      🔍 Filters
                    </h3>
                    {(contactSearch || filterContactStatus !== "All" || filterContactType !== "All" || filterContactCompany !== "All" || filterFollowUp !== "All") && (
                      <button onClick={() => {
                        setContactSearch("");
                        setFilterContactStatus("All");
                        setFilterContactType("All");
                        setFilterContactCompany("All");
                        setFilterFollowUp("All");
                      }} style={{
                        background:"transparent", border:"1px solid #334155", color:"#94A3B8",
                        borderRadius:7, padding:"7px 14px", cursor:"pointer", fontSize:12,
                        fontFamily:"'Syne', sans-serif", fontWeight:700
                      }}>Clear All</button>
                    )}
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:14 }}>
                    <div>
                      <label style={{ display:"block", color:"#94A3B8", fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>
                        Search
                      </label>
                      <input value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                        placeholder="Name, company, role..."
                        style={{
                          background:"#0F172A", border:"1px solid #334155", color:"#E2E8F0",
                          borderRadius:7, padding:"9px 12px", fontSize:14, outline:"none",
                          fontFamily:"'DM Mono', monospace", width:"100%", boxSizing:"border-box"
                        }} />
                    </div>

                    <div>
                      <label style={{ display:"block", color:"#94A3B8", fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>
                        Status
                      </label>
                      <Select value={filterContactStatus} onChange={setFilterContactStatus} options={["All", ...CONTACT_STATUS_OPTIONS]} />
                    </div>

                    <div>
                      <label style={{ display:"block", color:"#94A3B8", fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>
                        Type
                      </label>
                      <Select value={filterContactType} onChange={setFilterContactType} options={["All", ...CONTACT_TYPE_OPTIONS]} />
                    </div>

                    <div>
                      <label style={{ display:"block", color:"#94A3B8", fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>
                        Company
                      </label>
                      <Select value={filterContactCompany} onChange={setFilterContactCompany}
                        options={["All", ...[...new Set(contacts.map(c => c.company).filter(Boolean))].sort()]} />
                    </div>

                    <div>
                      <label style={{ display:"block", color:"#94A3B8", fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>
                        Follow-Up
                      </label>
                      <Select value={filterFollowUp} onChange={setFilterFollowUp}
                        options={["All", "Overdue", "Upcoming", "None"]} />
                    </div>
                  </div>

                  <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid #334155", color:"#64748B", fontSize:13 }}>
                    Showing <span style={{color:"#60A5FA", fontWeight:700}}>{filteredContacts.length}</span> of <span style={{color:"#E2E8F0", fontWeight:700}}>{contacts.length}</span> contacts
                  </div>
                </div>

                {(showContactForm || editContact) && (
                  <ContactForm
                    initial={editContact}
                    onAdd={addContact}
                    onCancel={() => { setShowContactForm(false); setEditContact(null); }}
                    saving={saving}
                    allContacts={contacts}
                  />
                )}

                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {filteredContacts.length === 0 && contacts.length === 0 && (
                    <div style={{ textAlign:"center", color:"#334155", padding:"60px", fontSize:15 }}>
                      No contacts yet. Add recruiters, alumni, and hiring managers here!
                    </div>
                  )}
                  {filteredContacts.length === 0 && contacts.length > 0 && (
                    <div style={{ textAlign:"center", color:"#334155", padding:"60px", fontSize:15 }}>
                      No contacts match your filters. Try adjusting your search criteria.
                    </div>
                  )}
                  {filteredContacts.slice(0, contactsToShow).map(c => {
                    const dFU = daysDiff(c.followUp);
                    const fuOverdue = dFU !== null && dFU <= 0 && !["Meeting Done", "No Response"].includes(c.status);
                    return (
                      <div key={c.id} style={{
                        background:"#1E293B",
                        border:`1px solid ${fuOverdue ? "#F87171" : "#334155"}`,
                        borderRadius:12,
                        padding:"16px 18px",
                        borderLeft:`4px solid ${fuOverdue ? "#EF4444" : "#A78BFA"}`
                      }}>
                        <div className="contact-card-body">
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:6 }}>
                              <span style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:16, color:"#F8FAFC" }}>{c.name || "—"}</span>
                              {fuOverdue && <Badge style={{background:"#FEE2E2",color:"#991B1B"}}>⚠️ Follow up!</Badge>}
                            </div>
                            <div style={{ color:"#94A3B8", fontSize:14, marginBottom:8 }}>
                              {c.role} @ <span style={{color:"#60A5FA"}}>{c.company}</span>
                            </div>
                            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                              <Badge style={{background:"#1E293B",border:"1px solid #334155",color:"#94A3B8"}}>{c.type}</Badge>
                              {c.linkedin && <a href={c.linkedin} target="_blank" rel="noreferrer" style={{color:"#60A5FA",fontSize:12,textDecoration:"none"}}>🔗 LinkedIn</a>}
                              {c.email && <span style={{color:"#94A3B8",fontSize:12}}>{c.email}</span>}
                            </div>
                            {c.notes && <div style={{color:"#475569",fontSize:13,marginTop:8}}>{c.notes}</div>}
                          </div>
                          <div className="contact-card-meta">
                            <ContactStatusBadge status={c.status} />
                            <div style={{color:"#475569",fontSize:12}}>Reached out: {c.outreachDate}</div>
                            {c.followUp && (
                              <div style={{ fontSize:12, color: fuOverdue ? "#F87171" : "#94A3B8" }}>
                                {fuOverdue ? `⚠️ ${Math.abs(dFU)}d overdue` : dFU === 0 ? "⏰ Follow up today!" : `Follow up in ${dFU}d`}
                              </div>
                            )}
                            <div style={{ display:"flex", gap:8 }}>
                              <button onClick={() => { setEditContact(c); setShowContactForm(false); }}
                                style={{ background:"#0F172A", border:"1px solid #334155", color:"#94A3B8", borderRadius:6, padding:"6px 12px", cursor:"pointer", fontSize:12 }}>Edit</button>
                              <button onClick={() => deleteContact(c.id)}
                                style={{ background:"#0F172A", border:"1px solid #334155", color:"#F87171", borderRadius:6, padding:"6px 12px", cursor:"pointer", fontSize:12 }}>Delete</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredContacts.length > contactsToShow && (
                  <div style={{ display:"flex", justifyContent:"center", marginTop:20 }}>
                    <button onClick={() => setContactsToShow(prev => prev + 15)}
                      style={{
                        background:"linear-gradient(135deg,#059669,#0284C7)", border:"none",
                        color:"#fff", borderRadius:8, padding:"10px 24px", cursor:"pointer",
                        fontSize:13, fontWeight:700, fontFamily:"'Syne', sans-serif"
                      }}>
                      Load More ({filteredContacts.length - contactsToShow} remaining)
                    </button>
                  </div>
                )}

                {filteredContacts.length > 15 && contactsToShow >= filteredContacts.length && (
                  <div style={{ display:"flex", justifyContent:"center", marginTop:20 }}>
                    <button onClick={() => setContactsToShow(15)}
                      style={{
                        background:"transparent", border:"1px solid #334155",
                        color:"#94A3B8", borderRadius:8, padding:"10px 24px", cursor:"pointer",
                        fontSize:13, fontWeight:700, fontFamily:"'Syne', sans-serif"
                      }}>
                      Show Less
                    </button>
                  </div>
                )}
              </>
            )}

            {/* DASHBOARD TAB */}
            {tab === "dashboard" && (
              <Dashboard jobs={jobs} contacts={contacts} />
            )}

            {/* FOLLOW-UPS TAB */}
            {tab === "followups" && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#F8FAFC",
                    marginBottom: 8
                  }}>
                    📧 Follow-Up Emails
                  </h2>
                  <p style={{ color: "#94A3B8", fontSize: 15, marginBottom: 20 }}>
                    AI-generated follow-ups for contacts you've reached out to
                  </p>

                  {emailSendSuccess && (
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
                      ✓ Email opened in your mail client! Contact updated.
                    </div>
                  )}
                </div>

                {contactsNeedingFollowUp.length === 0 ? (
                  <div style={{
                    background: "#1E293B",
                    border: "1px solid #334155",
                    borderRadius: 20,
                    padding: 60,
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>✨</div>
                    <h3 style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#F8FAFC",
                      marginBottom: 8
                    }}>
                      All Caught Up!
                    </h3>
                    <p style={{ color: "#94A3B8", fontSize: 15 }}>
                      No follow-ups needed right now. Check back later!
                    </p>
                  </div>
                ) : (
                  <FollowUpCards
                    contacts={contactsNeedingFollowUp}
                    onSend={handleSendFollowUp}
                    onSkip={handleSkipFollowUp}
                  />
                )}
              </>
            )}

            {/* SETTINGS TAB */}
            {tab === "settings" && (
              <Settings />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Supporting components ────────────────────────────────────────────────────

function ContactStatusBadge({ status }) {
  const styles = {
    "Not Contacted":        { bg:"#F1F5F9", text:"#475569" },
    "Message Sent":         { bg:"#FEF9C3", text:"#92400E" },
    "No Response":          { bg:"#FEE2E2", text:"#991B1B" },
    "Responded ✅":         { bg:"#DCFCE7", text:"#14532D" },
    "Referral Submitted 🎯":{ bg:"#EDE9FE", text:"#5B21B6" },
    "Meeting Scheduled":    { bg:"#DBEAFE", text:"#1E40AF" },
    "Meeting Done":         { bg:"#DBEAFE", text:"#1E40AF" },
  };
  const s = styles[status] || styles["Not Contacted"];
  return <Badge style={{ background: s.bg, color: s.text }}>{status}</Badge>;
}

function ContactForm({ initial, onAdd, onCancel, saving, allContacts = [] }) {
  const [form, setForm] = useState(initial || emptyContact());
  const set = k => v => setForm(f => ({ ...f, [k]: v }));
  const lbl = { color:"#94A3B8", fontSize:12, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5, display:"block" };

  // Get unique company names from existing contacts
  const uniqueCompanies = [...new Set(allContacts.map(c => c.company).filter(Boolean))];

  return (
    <div style={{ background:"#1E293B", border:"1px solid #334155", borderRadius:14, padding:"24px 20px", marginBottom:22 }}>
      <h3 style={{ color:"#F8FAFC", fontFamily:"'Syne', sans-serif", fontSize:18, fontWeight:800, marginBottom:18, marginTop:0 }}>
        {initial ? "✏️ Edit Contact" : "➕ Add Contact"}
      </h3>
      <div className="form-grid-2">
        <div><label style={lbl}>Name</label><Input value={form.name} onChange={set("name")} placeholder="Full name" /></div>
        <div><label style={lbl}>Company</label><Autocomplete value={form.company} onChange={set("company")} placeholder="Company" suggestions={uniqueCompanies} /></div>
        <div><label style={lbl}>Their Role</label><Input value={form.role} onChange={set("role")} placeholder="e.g. Senior Recruiter" /></div>
        <div><label style={lbl}>Type</label><Select value={form.type} onChange={set("type")} options={CONTACT_TYPE_OPTIONS} /></div>
        <div><label style={lbl}>LinkedIn</label><Input value={form.linkedin} onChange={set("linkedin")} placeholder="Profile URL" /></div>
        <div><label style={lbl}>Email</label><Input value={form.email} onChange={set("email")} placeholder="email@company.com" /></div>
        <div><label style={lbl}>Outreach Date</label><Input type="date" value={form.outreachDate} onChange={set("outreachDate")} /></div>
        <div><label style={lbl}>Status</label><Select value={form.status} onChange={set("status")} options={CONTACT_STATUS_OPTIONS} /></div>
      </div>
      <div style={{ marginTop:14 }}>
        <label style={lbl}>Follow-Up Date</label>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <Input type="date" value={form.followUp} onChange={set("followUp")} />
          <button onClick={() => setForm(f => ({ ...f, followUp: addDays(today(), 7) }))} type="button"
            style={{ background:"#334155", border:"none", color:"#94A3B8", borderRadius:6, padding:"9px 14px", cursor:"pointer", fontSize:12, whiteSpace:"nowrap" }}>
            +7d
          </button>
          <button onClick={() => setForm(f => ({ ...f, followUp: "" }))} type="button"
            style={{ background:"#334155", border:"none", color:"#F87171", borderRadius:6, padding:"9px 14px", cursor:"pointer", fontSize:12 }}>
            Clear
          </button>
        </div>
      </div>
      <div style={{ marginTop:14 }}>
        <label style={lbl}>Notes</label>
        <Textarea value={form.notes} onChange={set("notes")} placeholder="Met at career fair, OU alumni, offered referral…" />
      </div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:16, flexWrap:"wrap" }}>
        <button onClick={onCancel} disabled={saving} style={{ background:"transparent", border:"1px solid #334155", color:"#94A3B8", borderRadius:8, padding:"9px 20px", cursor:"pointer", fontSize:14 }}>Cancel</button>
        <button onClick={() => onAdd(form)} disabled={saving} style={{ background:"linear-gradient(135deg,#059669,#0284C7)", border:"none", color:"#fff", borderRadius:8, padding:"9px 24px", cursor:saving?"not-allowed":"pointer", fontSize:14, fontWeight:700, fontFamily:"'Syne', sans-serif", opacity:saving?0.7:1 }}>
          {saving ? "Saving…" : initial ? "Save" : "Add Contact ✓"}
        </button>
      </div>
    </div>
  );
}

function Dashboard({ jobs, contacts }) {
  const byStatus = STATUS_OPTIONS.map(s => ({ label: s, count: jobs.filter(j => j.status === s).length }));
  const byMethod = METHOD_OPTIONS.map(m => ({ label: m, count: jobs.filter(j => j.method === m).length }));
  const maxStatus = Math.max(...byStatus.map(x => x.count), 1);
  const maxMethod = Math.max(...byMethod.map(x => x.count), 1);
  const responseRate = jobs.length > 0
    ? Math.round((jobs.filter(j => !["Applied","No Response"].includes(j.status)).length / jobs.length) * 100)
    : 0;

  return (
    <div>
      <div className="stats-row">
        <StatCard label="Total Applied" value={jobs.length} color="#60A5FA" />
        <StatCard label="Response Rate" value={`${responseRate}%`} color="#34D399" sub="Avg: 5-10%" />
        <StatCard label="Offers" value={jobs.filter(j=>j.status==="Offer").length} color="#22C55E" />
        <StatCard label="Contacts" value={contacts.length} color="#A78BFA" />
      </div>

      <div className="dashboard-grid">
        <div style={{ background:"#1E293B", border:"1px solid #334155", borderRadius:14, padding:24 }}>
          <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:16, color:"#F8FAFC", marginBottom:16 }}>Status Breakdown</div>
          {byStatus.map(({ label, count }) => count > 0 && (
            <div key={label} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:13, color:"#94A3B8" }}>{label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:"#E2E8F0" }}>{count}</span>
              </div>
              <div style={{ background:"#0F172A", borderRadius:5, height:8, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:5, width:`${(count/maxStatus)*100}%`, background: STATUS_STYLES[label]?.dot || "#3B82F6", transition:"width 0.3s" }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:"#1E293B", border:"1px solid #334155", borderRadius:14, padding:24 }}>
          <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:16, color:"#F8FAFC", marginBottom:16 }}>Application Method</div>
          {byMethod.map(({ label, count }) => count > 0 && (
            <div key={label} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:13, color:"#94A3B8" }}>{label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:"#E2E8F0" }}>{count}</span>
              </div>
              <div style={{ background:"#0F172A", borderRadius:5, height:8, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:5, width:`${(count/maxMethod)*100}%`, background:"linear-gradient(90deg,#2563EB,#7C3AED)", transition:"width 0.3s" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {jobs.filter(j => !["Offer","Rejected","Withdrew"].includes(j.status) && daysDiff(j.followUp) <= 0).length > 0 && (
        <div style={{ background:"#1E293B", border:"1px solid #F87171", borderRadius:14, padding:24, marginTop:18 }}>
          <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:16, color:"#F87171", marginBottom:14 }}>⚠️ Overdue Application Follow-Ups</div>
          {jobs.filter(j => !["Offer","Rejected","Withdrew"].includes(j.status) && daysDiff(j.followUp) <= 0).map(j => (
            <div key={j.id} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #0F172A", fontSize:14, flexWrap:"wrap", gap:6 }}>
              <span style={{ color:"#E2E8F0" }}>{j.company} — {j.role}</span>
              <span style={{ color:"#F87171" }}>{Math.abs(daysDiff(j.followUp))}d overdue</span>
            </div>
          ))}
        </div>
      )}

      {contacts.filter(c => !["Meeting Done", "No Response"].includes(c.status) && daysDiff(c.followUp) <= 0).length > 0 && (
        <div style={{ background:"#1E293B", border:"1px solid #A78BFA", borderRadius:14, padding:24, marginTop:18 }}>
          <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:16, color:"#A78BFA", marginBottom:14 }}>👥 Overdue Contact Follow-Ups</div>
          {contacts.filter(c => !["Meeting Done", "No Response"].includes(c.status) && daysDiff(c.followUp) <= 0).map(c => (
            <div key={c.id} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #0F172A", fontSize:14, flexWrap:"wrap", gap:6 }}>
              <span style={{ color:"#E2E8F0" }}>{c.name} @ {c.company}</span>
              <span style={{ color:"#A78BFA" }}>{Math.abs(daysDiff(c.followUp))}d overdue</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
