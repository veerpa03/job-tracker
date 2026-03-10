import { useState, useEffect } from "react";

const STORAGE_KEY = "viraj_jobs_v1";
const CONTACTS_KEY = "viraj_contacts_v1";

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
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0F172A; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
  input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
  select option { background: #1E293B; }

  /* Layout */
  .app-wrap { background:#0F172A; min-height:100vh; font-family:'DM Mono',monospace; color:#E2E8F0; padding-bottom:60px; }
  .header-bar { background:linear-gradient(135deg,#0F172A 0%,#1E1B4B 100%); border-bottom:1px solid #1E293B; }
  .header-inner { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; padding:16px 20px; max-width:1100px; margin:0 auto; }
  .header-title { font-family:'Syne',sans-serif; font-size:20px; font-weight:800; background:linear-gradient(90deg,#60A5FA,#A78BFA); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .header-sub { color:#475569; font-size:10px; letter-spacing:0.08em; margin-top:2px; }
  .nav-group { display:flex; gap:8px; flex-wrap:wrap; }
  .main-content { max-width:1100px; margin:0 auto; padding:20px; }

  /* Stats */
  .stats-row { display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
  .stat-card { flex:1; min-width:120px; background:#1E293B; border:1px solid #334155; border-radius:12px; padding:16px 18px; }

  /* Filter bar */
  .filter-row { display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap; align-items:center; }
  .search-input { background:#1E293B; border:1px solid #334155; color:#E2E8F0; border-radius:7px; padding:8px 12px; font-size:13px; outline:none; font-family:'DM Mono',monospace; width:200px; }

  /* Form grids */
  .form-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .form-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }

  /* Job card */
  .job-card-body { display:flex; align-items:flex-start; gap:12px; }
  .job-card-meta { display:flex; flex-direction:column; gap:6px; align-items:flex-end; min-width:180px; flex-shrink:0; }

  /* Contact card */
  .contact-card-body { display:flex; gap:12px; align-items:flex-start; }
  .contact-card-meta { display:flex; flex-direction:column; gap:6px; align-items:flex-end; flex-shrink:0; }

  /* Dashboard */
  .dashboard-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }

  /* Buttons */
  .btn-add { background:linear-gradient(135deg,#2563EB,#7C3AED); border:none; color:#fff; border-radius:8px; padding:9px 18px; cursor:pointer; font-size:13px; font-weight:700; font-family:'Syne',sans-serif; white-space:nowrap; }
  .btn-add-contact { background:linear-gradient(135deg,#059669,#0284C7); border:none; color:#fff; border-radius:8px; padding:9px 18px; cursor:pointer; font-size:13px; font-weight:700; font-family:'Syne',sans-serif; white-space:nowrap; }

  /* ── Tablet ── */
  @media (max-width:768px) {
    .header-inner { padding:14px 14px; }
    .main-content { padding:14px 12px; }
    .form-grid-2, .form-grid-3 { grid-template-columns:1fr; }
    .job-card-body { flex-wrap:wrap; }
    .job-card-meta { align-items:flex-start; min-width:unset; width:100%; flex-direction:row; flex-wrap:wrap; }
    .contact-card-body { flex-wrap:wrap; }
    .contact-card-meta { align-items:flex-start; width:100%; flex-direction:row; flex-wrap:wrap; }
    .dashboard-grid { grid-template-columns:1fr; }
    .search-input { width:100%; }
    .stat-card { min-width:calc(50% - 6px); }
    .filter-row { gap:6px; }
  }

  /* ── Mobile ── */
  @media (max-width:480px) {
    .header-inner { padding:12px 10px; gap:8px; }
    .main-content { padding:10px 8px; }
    .stat-card { min-width:calc(50% - 4px); padding:12px 10px !important; }
    .stat-card .stat-val { font-size:22px !important; }
    .nav-group button { padding:6px 10px !important; font-size:11px !important; }
    .btn-add, .btn-add-contact { font-size:12px; padding:8px 14px; }
    .search-input { font-size:12px; }
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

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background:"#0F172A", border:"1px solid #334155", color:"#E2E8F0",
        borderRadius:6, padding:"6px 10px", fontSize:13, cursor:"pointer",
        outline:"none", fontFamily:"'DM Mono', monospace", maxWidth:"100%", width:"100%"
      }}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Badge({ children, style }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700,
      letterSpacing:"0.03em", ...style
    }}>
      {children}
    </span>
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
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{
        background:"#0F172A", border:"1px solid #334155", color:"#E2E8F0",
        borderRadius:6, padding:"7px 10px", fontSize:13, outline:"none",
        fontFamily:"'DM Mono', monospace", width:"100%", boxSizing:"border-box", ...style
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 2 }) {
  return (
    <textarea
      value={value} placeholder={placeholder} rows={rows}
      onChange={e => onChange(e.target.value)}
      style={{
        background:"#0F172A", border:"1px solid #334155", color:"#E2E8F0",
        borderRadius:6, padding:"7px 10px", fontSize:13, outline:"none",
        fontFamily:"'DM Mono', monospace", width:"100%", boxSizing:"border-box",
        resize:"vertical"
      }}
    />
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-val" style={{ fontSize:26, fontWeight:800, color, fontFamily:"'Syne', sans-serif" }}>{value}</div>
      <div style={{ fontSize:11, color:"#94A3B8", fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:"#475569", marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function QuickAddForm({ onAdd, onCancel, initial }) {
  const [form, setForm] = useState(initial || emptyJob());
  const set = k => v => {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === "dateApplied") next.followUp = addDays(v, 7);
      return next;
    });
  };

  const label = { color:"#94A3B8", fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:3, display:"block" };
  const field = { marginBottom:12 };

  return (
    <div style={{ background:"#1E293B", border:"1px solid #334155", borderRadius:12, padding:"20px 16px", marginBottom:24 }}>
      <h3 style={{ color:"#F8FAFC", fontFamily:"'Syne', sans-serif", fontSize:16, fontWeight:800, marginBottom:20, marginTop:0 }}>
        {initial ? "✏️ Edit Application" : "➕ Add New Application"}
      </h3>

      <div className="form-grid-2">
        <div style={field}>
          <label style={label}>Company *</label>
          <Input value={form.company} onChange={set("company")} placeholder="e.g. OpenAI" />
        </div>
        <div style={field}>
          <label style={label}>Role Title *</label>
          <Input value={form.role} onChange={set("role")} placeholder="e.g. AI Engineer, New Grad" />
        </div>
      </div>

      <div style={field}>
        <label style={label}>Job Posting URL</label>
        <Input value={form.url} onChange={set("url")} placeholder="Paste full URL — auto-shortened in tracker" />
      </div>

      <div className="form-grid-3">
        <div style={field}>
          <label style={label}>Date Applied</label>
          <Input type="date" value={form.dateApplied} onChange={set("dateApplied")} />
        </div>
        <div style={field}>
          <label style={label}>Follow-Up <span style={{color:"#3B82F6"}}>(auto)</span></label>
          <Input type="date" value={form.followUp} onChange={set("followUp")} />
        </div>
        <div style={field}>
          <label style={label}>Priority</label>
          <Select value={form.priority} onChange={set("priority")} options={PRIORITY_OPTIONS} />
        </div>
      </div>

      <div className="form-grid-3">
        <div style={field}>
          <label style={label}>Method</label>
          <Select value={form.method} onChange={set("method")} options={METHOD_OPTIONS} />
        </div>
        <div style={field}>
          <label style={label}>Status</label>
          <Select value={form.status} onChange={set("status")} options={STATUS_OPTIONS} />
        </div>
        <div style={field}>
          <label style={label}>Resume Version</label>
          <Select value={form.resume} onChange={set("resume")} options={RESUME_OPTIONS} />
        </div>
      </div>

      <div className="form-grid-2">
        <div style={field}>
          <label style={label}>H-1B Sponsor?</label>
          <Select value={form.h1b} onChange={set("h1b")} options={H1B_OPTIONS} />
        </div>
        <div style={field}>
          <label style={label}>E-Verify? <span style={{color:"#EF4444"}}>(critical!)</span></label>
          <Select value={form.eVerify} onChange={set("eVerify")} options={H1B_OPTIONS} />
        </div>
      </div>

      <div style={field}>
        <label style={label}>Notes</label>
        <Textarea value={form.notes} onChange={set("notes")} placeholder="Interview questions, recruiter name, next steps…" />
      </div>

      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", flexWrap:"wrap" }}>
        {onCancel && (
          <button onClick={onCancel} style={{
            background:"transparent", border:"1px solid #334155", color:"#94A3B8",
            borderRadius:7, padding:"8px 20px", cursor:"pointer", fontSize:13
          }}>Cancel</button>
        )}
        <button
          onClick={() => { if (form.company && form.role) onAdd(form); }}
          style={{
            background:"linear-gradient(135deg,#2563EB,#7C3AED)", border:"none",
            color:"#fff", borderRadius:7, padding:"8px 24px", cursor:"pointer",
            fontSize:13, fontWeight:700, fontFamily:"'Syne', sans-serif"
          }}
        >
          {initial ? "Save Changes" : "Add Application ✓"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("apps");
  const [jobs, setJobs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [contacts, setContacts] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CONTACTS_KEY)) || []; } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [editContact, setEditContact] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs)); }, [jobs]);
  useEffect(() => { localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts)); }, [contacts]);

  const addJob = (form) => {
    if (editJob) {
      setJobs(j => j.map(x => x.id === editJob.id ? { ...form, id: editJob.id } : x));
      setEditJob(null);
    } else {
      setJobs(j => [form, ...j]);
      setShowForm(false);
    }
  };

  const deleteJob = id => setJobs(j => j.filter(x => x.id !== id));
  const updateStatus = (id, status) => setJobs(j => j.map(x => x.id === id ? { ...x, status } : x));

  const addContact = (form) => {
    if (editContact) {
      setContacts(c => c.map(x => x.id === editContact.id ? { ...form, id: editContact.id } : x));
      setEditContact(null);
    } else {
      setContacts(c => [form, ...c]);
      setShowContactForm(false);
    }
  };
  const deleteContact = id => setContacts(c => c.filter(x => x.id !== id));

  const filteredJobs = jobs.filter(j => {
    if (filterStatus !== "All" && j.status !== filterStatus) return false;
    if (filterPriority !== "All" && j.priority !== filterPriority) return false;
    if (search && !`${j.company} ${j.role}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
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
      borderRadius:7, padding:"7px 14px", cursor:"pointer", fontSize:12,
      fontWeight:700, fontFamily:"'Syne', sans-serif", transition:"all 0.15s",
      whiteSpace:"nowrap"
    }}>{label}</button>
  );

  return (
    <div className="app-wrap">
      <style>{RESPONSIVE_CSS}</style>

      {/* Header */}
      <div className="header-bar">
        <div className="header-inner">
          <div>
            <div className="header-title">Viraj&apos;s Job Hunt 2026</div>
            <div className="header-sub">F1 OPT · CS @ Ohio University · May 2026</div>
          </div>
          <div className="nav-group">
            {navBtn("apps","📋 Applications")}
            {navBtn("contacts","👥 Contacts")}
            {navBtn("dashboard","📊 Dashboard")}
          </div>
        </div>
      </div>

      <div className="main-content">

        {/* APPLICATIONS TAB */}
        {tab === "apps" && (
          <>
            <div className="stats-row">
              <StatCard label="Total Applied" value={stats.total} color="#60A5FA" />
              <StatCard label="Active" value={stats.active} color="#34D399" />
              <StatCard label="Offers" value={stats.offers} color="#22C55E" sub={stats.offers > 0 ? "🎉" : ""} />
              <StatCard label="🔴 Hot" value={stats.hot} color="#F87171" />
              <StatCard label="Follow-Ups" value={stats.followUps} color={stats.followUps > 0 ? "#FBBF24" : "#94A3B8"}
                sub={stats.followUps > 0 ? "⚠️ Due" : "All clear"} />
            </div>

            <div className="filter-row">
              <button
                onClick={() => { setShowForm(!showForm); setEditJob(null); }}
                className="btn-add"
              >{showForm ? "✕ Cancel" : "➕ Add Application"}</button>

              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍 Search company or role…"
                className="search-input" />

              <Select value={filterStatus} onChange={setFilterStatus} options={["All", ...STATUS_OPTIONS]} />
              <Select value={filterPriority} onChange={setFilterPriority} options={["All", ...PRIORITY_OPTIONS]} />
            </div>

            {showForm && !editJob && (
              <QuickAddForm onAdd={addJob} onCancel={() => setShowForm(false)} />
            )}
            {editJob && (
              <QuickAddForm initial={editJob} onAdd={addJob} onCancel={() => setEditJob(null)} />
            )}

            {filteredJobs.length === 0 && (
              <div style={{ textAlign:"center", color:"#334155", padding:"60px 20px", fontSize:14 }}>
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
                    borderRadius:10, padding:"12px 14px",
                    borderLeft:`4px solid ${fuOverdue ? "#EF4444" : job.priority === "🔴 Hot" ? "#EF4444" : job.priority === "🟡 Warm" ? "#F59E0B" : "#3B82F6"}`
                  }}>
                    <div className="job-card-body">
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:6 }}>
                          <span style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:14, color:"#F8FAFC" }}>{job.company}</span>
                          <PriorityBadge priority={job.priority} />
                          {fuOverdue && <Badge style={{background:"#FEE2E2",color:"#991B1B"}}>⚠️ Follow up!</Badge>}
                        </div>
                        <div style={{ color:"#94A3B8", fontSize:13, marginBottom:6 }}>{job.role}</div>
                        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                          <StatusBadge status={job.status} />
                          <Badge style={{background:"#1E293B",color:"#64748B",border:"1px solid #334155"}}>{job.resume}</Badge>
                          {job.url && (
                            <a href={job.url} target="_blank" rel="noreferrer" style={{
                              color:"#60A5FA", fontSize:11, textDecoration:"none", fontFamily:"'DM Mono', monospace"
                            }}>🔗 {shortUrl(job.url)}</a>
                          )}
                        </div>
                        {job.notes && (
                          <div style={{ color:"#64748B", fontSize:11, marginTop:8, background:"#0F172A", borderRadius:5, padding:"5px 8px" }}>
                            {job.notes}
                          </div>
                        )}
                      </div>

                      <div className="job-card-meta">
                        <Select value={job.status} onChange={v => updateStatus(job.id, v)} options={STATUS_OPTIONS} />
                        <div style={{ color:"#475569", fontSize:11 }}>
                          Applied {dSince === 0 ? "today" : `${dSince}d ago`} · {job.method}
                        </div>
                        {job.followUp && (
                          <div style={{ fontSize:11, color: fuOverdue ? "#F87171" : "#94A3B8" }}>
                            {fuOverdue
                              ? `⚠️ ${Math.abs(dFU)}d overdue`
                              : dFU === 0 ? "⏰ Follow up today!"
                              : `Follow up in ${dFU}d`}
                          </div>
                        )}
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={() => { setEditJob(job); setShowForm(false); window.scrollTo(0,0); }}
                            style={{ background:"#0F172A", border:"1px solid #334155", color:"#94A3B8", borderRadius:5, padding:"4px 10px", cursor:"pointer", fontSize:11 }}>Edit</button>
                          <button onClick={() => deleteJob(job.id)}
                            style={{ background:"#0F172A", border:"1px solid #334155", color:"#F87171", borderRadius:5, padding:"4px 10px", cursor:"pointer", fontSize:11 }}>Delete</button>
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
            <div className="filter-row">
              <button onClick={() => { setShowContactForm(!showContactForm); setEditContact(null); }}
                className="btn-add-contact">
                {showContactForm ? "✕ Cancel" : "➕ Add Contact"}
              </button>
              <div style={{ color:"#475569", fontSize:12 }}>{contacts.length} contacts tracked</div>
            </div>

            {(showContactForm || editContact) && (
              <ContactForm
                initial={editContact}
                onAdd={addContact}
                onCancel={() => { setShowContactForm(false); setEditContact(null); }}
              />
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {contacts.length === 0 && (
                <div style={{ textAlign:"center", color:"#334155", padding:"60px", fontSize:14 }}>
                  No contacts yet. Add recruiters, alumni, and hiring managers here!
                </div>
              )}
              {contacts.map(c => (
                <div key={c.id} style={{
                  background:"#1E293B", border:"1px solid #334155", borderRadius:10, padding:"12px 14px"
                }}>
                  <div className="contact-card-body">
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:14, color:"#F8FAFC", marginBottom:4 }}>{c.name || "—"}</div>
                      <div style={{ color:"#94A3B8", fontSize:12, marginBottom:6 }}>
                        {c.role} @ <span style={{color:"#60A5FA"}}>{c.company}</span>
                      </div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        <Badge style={{background:"#1E293B",border:"1px solid #334155",color:"#94A3B8"}}>{c.type}</Badge>
                        {c.linkedin && <a href={c.linkedin} target="_blank" rel="noreferrer" style={{color:"#60A5FA",fontSize:11,textDecoration:"none"}}>🔗 LinkedIn</a>}
                        {c.email && <span style={{color:"#94A3B8",fontSize:11}}>{c.email}</span>}
                      </div>
                      {c.notes && <div style={{color:"#475569",fontSize:11,marginTop:6}}>{c.notes}</div>}
                    </div>
                    <div className="contact-card-meta">
                      <ContactStatusBadge status={c.status} />
                      <div style={{color:"#475569",fontSize:11}}>Reached out: {c.outreachDate}</div>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={() => { setEditContact(c); setShowContactForm(false); }}
                          style={{ background:"#0F172A", border:"1px solid #334155", color:"#94A3B8", borderRadius:5, padding:"4px 10px", cursor:"pointer", fontSize:11 }}>Edit</button>
                        <button onClick={() => deleteContact(c.id)}
                          style={{ background:"#0F172A", border:"1px solid #334155", color:"#F87171", borderRadius:5, padding:"4px 10px", cursor:"pointer", fontSize:11 }}>Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* DASHBOARD TAB */}
        {tab === "dashboard" && (
          <Dashboard jobs={jobs} contacts={contacts} />
        )}
      </div>
    </div>
  );
}

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

function ContactForm({ initial, onAdd, onCancel }) {
  const [form, setForm] = useState(initial || emptyContact());
  const set = k => v => setForm(f => ({ ...f, [k]: v }));
  const label = { color:"#94A3B8", fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:3, display:"block" };

  return (
    <div style={{ background:"#1E293B", border:"1px solid #334155", borderRadius:12, padding:"20px 16px", marginBottom:20 }}>
      <h3 style={{ color:"#F8FAFC", fontFamily:"'Syne', sans-serif", fontSize:16, fontWeight:800, marginBottom:16, marginTop:0 }}>
        {initial ? "✏️ Edit Contact" : "➕ Add Contact"}
      </h3>
      <div className="form-grid-2">
        <div><label style={label}>Name</label><Input value={form.name} onChange={set("name")} placeholder="Full name" /></div>
        <div><label style={label}>Company</label><Input value={form.company} onChange={set("company")} placeholder="Company" /></div>
        <div><label style={label}>Their Role</label><Input value={form.role} onChange={set("role")} placeholder="e.g. Senior Recruiter" /></div>
        <div><label style={label}>Type</label><Select value={form.type} onChange={set("type")} options={CONTACT_TYPE_OPTIONS} /></div>
        <div><label style={label}>LinkedIn</label><Input value={form.linkedin} onChange={set("linkedin")} placeholder="Profile URL" /></div>
        <div><label style={label}>Email</label><Input value={form.email} onChange={set("email")} placeholder="email@company.com" /></div>
        <div><label style={label}>Outreach Date</label><Input type="date" value={form.outreachDate} onChange={set("outreachDate")} /></div>
        <div><label style={label}>Status</label><Select value={form.status} onChange={set("status")} options={CONTACT_STATUS_OPTIONS} /></div>
      </div>
      <div style={{ marginTop:12 }}>
        <label style={label}>Notes</label>
        <Textarea value={form.notes} onChange={set("notes")} placeholder="Met at career fair, OU alumni, offered referral…" />
      </div>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:14, flexWrap:"wrap" }}>
        <button onClick={onCancel} style={{ background:"transparent", border:"1px solid #334155", color:"#94A3B8", borderRadius:7, padding:"7px 18px", cursor:"pointer", fontSize:13 }}>Cancel</button>
        <button onClick={() => onAdd(form)} style={{ background:"linear-gradient(135deg,#059669,#0284C7)", border:"none", color:"#fff", borderRadius:7, padding:"7px 22px", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"'Syne', sans-serif" }}>
          {initial ? "Save" : "Add Contact ✓"}
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
        <div style={{ background:"#1E293B", border:"1px solid #334155", borderRadius:12, padding:20 }}>
          <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:14, color:"#F8FAFC", marginBottom:14 }}>Status Breakdown</div>
          {byStatus.map(({ label, count }) => count > 0 && (
            <div key={label} style={{ marginBottom:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ fontSize:11, color:"#94A3B8" }}>{label}</span>
                <span style={{ fontSize:11, fontWeight:700, color:"#E2E8F0" }}>{count}</span>
              </div>
              <div style={{ background:"#0F172A", borderRadius:4, height:6, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:4, width:`${(count/maxStatus)*100}%`, background: STATUS_STYLES[label]?.dot || "#3B82F6", transition:"width 0.3s" }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:"#1E293B", border:"1px solid #334155", borderRadius:12, padding:20 }}>
          <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:14, color:"#F8FAFC", marginBottom:14 }}>Application Method</div>
          {byMethod.map(({ label, count }) => count > 0 && (
            <div key={label} style={{ marginBottom:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ fontSize:11, color:"#94A3B8" }}>{label}</span>
                <span style={{ fontSize:11, fontWeight:700, color:"#E2E8F0" }}>{count}</span>
              </div>
              <div style={{ background:"#0F172A", borderRadius:4, height:6, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:4, width:`${(count/maxMethod)*100}%`, background:"linear-gradient(90deg,#2563EB,#7C3AED)", transition:"width 0.3s" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {jobs.filter(j => !["Offer","Rejected","Withdrew"].includes(j.status) && daysDiff(j.followUp) <= 0).length > 0 && (
        <div style={{ background:"#1E293B", border:"1px solid #F87171", borderRadius:12, padding:20, marginTop:16 }}>
          <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:14, color:"#F87171", marginBottom:12 }}>⚠️ Overdue Follow-Ups</div>
          {jobs.filter(j => !["Offer","Rejected","Withdrew"].includes(j.status) && daysDiff(j.followUp) <= 0).map(j => (
            <div key={j.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #0F172A", fontSize:13, flexWrap:"wrap", gap:4 }}>
              <span style={{ color:"#E2E8F0" }}>{j.company} — {j.role}</span>
              <span style={{ color:"#F87171" }}>{Math.abs(daysDiff(j.followUp))}d overdue</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
