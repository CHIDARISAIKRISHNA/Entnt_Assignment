import React, { useState } from "react";
import { api } from "../../lib/api";

export default function JobCard({ job, onEdit, onRefresh }) {
  const [loading,setLoading] = useState(false);
  const toggleArchive = async () => {
    setLoading(true);
    await api.patchJob(job.id, { status: job.status === "active" ? "archived" : "active" });
    setLoading(false);
    onRefresh && onRefresh();
  };
  return (
    <div className="list-item fade-in" style={{marginBottom:10}}>
      <div style={{flex:1}}>
        <div style={{marginBottom:8, display:"flex", alignItems:"center", gap:8}}>
          <strong style={{fontSize:16}}>{job.title}</strong>
          <span className={`status-badge status-${job.status}`}>
            {job.status}
          </span>
        </div>
        <div className="small" style={{marginBottom:4}}>
          <span style={{color:"var(--muted)"}}>/{job.slug}</span>
        </div>
        {job.tags && job.tags.length > 0 && (
          <div className="tags">
            {job.tags.map((tag, idx) => (
              <span key={idx} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div style={{display:"flex",gap:8}}>
        <button className="btn-muted" onClick={onEdit} style={{whiteSpace:"nowrap"}}>
          ✏️ Edit
        </button>
        <button className="btn-muted" onClick={toggleArchive} disabled={loading} style={{whiteSpace:"nowrap"}}>
          {loading ? "⏳" : job.status==="active" ? "📦 Archive" : "📤 Unarchive"}
        </button>
      </div>
    </div>
  );
}
