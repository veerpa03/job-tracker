import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── camelCase ↔ snake_case mappers ──────────────────────────────────────────

export function jobToDb(job) {
  return {
    id:           job.id,
    company:      job.company,
    role:         job.role,
    url:          job.url,
    date_applied: job.dateApplied   || null,
    follow_up:    job.followUp      || null,
    method:       job.method,
    priority:     job.priority,
    status:       job.status,
    h1b:          job.h1b,
    e_verify:     job.eVerify,
    resume:       job.resume,
    notes:        job.notes,
  };
}

export function dbToJob(row) {
  return {
    id:          row.id,
    company:     row.company      || "",
    role:        row.role         || "",
    url:         row.url          || "",
    dateApplied: row.date_applied || "",
    followUp:    row.follow_up    || "",
    method:      row.method       || "Cold Apply",
    priority:    row.priority     || "🟢 Cold",
    status:      row.status       || "Applied",
    h1b:         row.h1b          || "Unknown",
    eVerify:     row.e_verify     || "Unknown",
    resume:      row.resume       || "AI/ML Engineer",
    notes:       row.notes        || "",
    contacts:    "",
  };
}

export function contactToDb(c) {
  return {
    id:            c.id,
    company:       c.company,
    name:          c.name,
    role:          c.role,
    type:          c.type,
    linkedin:      c.linkedin,
    email:         c.email,
    outreach_date: c.outreachDate || null,
    follow_up:     c.followUp     || null,
    status:        c.status,
    notes:         c.notes,
  };
}

export function dbToContact(row) {
  return {
    id:           row.id,
    company:      row.company       || "",
    name:         row.name          || "",
    role:         row.role          || "",
    type:         row.type          || "Recruiter",
    linkedin:     row.linkedin      || "",
    email:        row.email         || "",
    outreachDate: row.outreach_date || "",
    followUp:     row.follow_up     || "",
    status:       row.status        || "Not Contacted",
    notes:        row.notes         || "",
  };
}
