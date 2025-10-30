import React, { useEffect, useState } from "react";
import Modal from "../UI/Modal";
import { api } from "../../lib/api";
import { slugify } from "../../utils/slugify";

export default function JobEditor({ job, onClose }) {
  const [title,setTitle] = useState(job?.title || "");
  const [tags,setTags] = useState((job?.tags || []).join(","));
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  useEffect(()=>{ setTitle(job?.title || ""); setTags((job?.tags||[]).join(",")) }, [job]);

  const save = async () => {
    setError("");
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    const payload = { title, slug: slugify(title), tags: tags.split(",").map(t=>t.trim()).filter(Boolean) };
    try {
      if (job?.id) await api.patchJob(job.id, payload);
      else await api.createJob(payload);
    } catch (e) {
      setError(e.message || "Failed to save");
      setSaving(false);
      return;
    }
    setSaving(false);
    onClose();
  };

  return (
    <Modal onClose={onClose} title={job?.id ? "✏️ Edit Job" : "✨ Create Job"}>
      <div style={{display:"grid",gap:16}}>
        <div>
          <label>Job Title</label>
          <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Senior Frontend Developer" />
          {error && <div className="small" style={{ color: "var(--danger)", marginTop: 6 }}>{error}</div>}
        </div>
        <div>
          <label>Tags (comma separated)</label>
          <input className="input" value={tags} onChange={e=>setTags(e.target.value)} placeholder="e.g. React, JavaScript, Remote" />
          <div className="small" style={{marginTop:4}}>Separate multiple tags with commas</div>
        </div>
        <div style={{display:"flex",gap:12,justifyContent:"flex-end",marginTop:8}}>
          <button className="btn-muted" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={save} disabled={saving}>
            {saving ? "⏳ Saving..." : "💾 Save Job"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
