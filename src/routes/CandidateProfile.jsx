import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";

export default function CandidateProfile() {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");

  useEffect(()=>{ load() }, [id]);
  async function load(){
    const res = await api.getCandidates({ page: 1, pageSize: 1 });
    // quick fetch for candidate record
    const full = await api.getCandidates({ page: 1, pageSize: 2000 });
    setCandidate(full.items.find(c => c.id === id) || null);
    const tl = await api.getCandidateTimeline(id);
    setTimeline(tl.items || []);
    const ns = await api.getNotes(id);
    setNotes(ns.items || []);
  }

  const mentionSuggestions = useMemo(() => [
    "@recruiter_amy", "@recruiter_bob", "@hiring_manager", "@tech_lead", "@hr_ops"
  ], []);

  async function addNote(){
    if (!noteText.trim()) return;
    await api.addNote({ candidateId: id, text: noteText });
    setNoteText("");
    const ns = await api.getNotes(id);
    setNotes(ns.items || []);
  }

  return (
    <div style={{maxWidth: 900, margin: "0 auto"}}>
      <div className="card" style={{marginBottom: 16}}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap: 12}}>
          <div>
            <h3 style={{margin:0}}>👤 Candidate Profile</h3>
            <div className="small" style={{marginTop:4}}>
              <Link to="/candidates" className="small" style={{textDecoration:"none", color:"var(--accent)"}}>← Back to Candidates</Link>
            </div>
          </div>
          {candidate && (
            <span className={`stage-badge stage-${candidate.stage}`} style={{textTransform:"capitalize"}}>
              {candidate.stage}
            </span>
          )}
        </div>
        {candidate ? (
          <div style={{marginTop: 12}}>
            <div style={{fontWeight:600}}>{candidate.name}</div>
            <div className="small">{candidate.email}</div>
          </div>
        ) : (
          <div className="small">Loading...</div>
        )}
      </div>

      <div className="grid" style={{gridTemplateColumns:"1fr 360px"}}>
        <div className="card">
          <h4 style={{marginTop:0}}>🕒 Timeline</h4>
          {timeline.length === 0 && <div className="small">No events yet.</div>}
          <div style={{display:"grid", gap: 12}}>
            {timeline.map((t)=> (
              <div key={t.id || t.at} className="list-item" style={{alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600, fontSize:14}}>
                    {t.action === "created" && "Profile created"}
                    {t.action === "stage_change" && (
                      <>
                        Stage moved to <span className={`stage-badge stage-${t.toStage}`} style={{marginLeft:6}}>{t.toStage}</span>
                      </>
                    )}
                  </div>
                  <div className="small">{new Date(t.at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h4 style={{marginTop:0}}>📝 Notes</h4>
          <div className="small" style={{marginBottom:8}}>Use @mentions (suggestions shown below)</div>
          <textarea className="input" rows={4} value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Type a note with @mentions..." />
          <div style={{display:"flex", gap:6, flexWrap:"wrap", margin:"8px 0 12px"}}>
            {mentionSuggestions.map((m)=> (
              <button key={m} className="btn-muted" onClick={()=> setNoteText((v)=> (v + (v.endsWith(" ") || v.length===0 ? "" : " ") + m + " "))}>{m}</button>
            ))}
          </div>
          <div style={{display:"flex", justifyContent:"flex-end"}}>
            <button className="btn" onClick={addNote}>Add Note</button>
          </div>
          <div style={{marginTop:12, display:"grid", gap:8}}>
            {notes.map((n)=> (
              <div key={n.id} className="list-item">
                <div style={{flex:1}}>
                  <div style={{whiteSpace:"pre-wrap"}} dangerouslySetInnerHTML={{ __html: renderMentions(n.text) }} />
                  <div className="small" style={{marginTop:4}}>{new Date(n.at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderMentions(text) {
  if (!text) return "";
  return text.replace(/(@[a-zA-Z0-9_]+)/g, '<span style="background:#eef2ff;color:#3730a3;padding:2px 6px;border-radius:6px;font-weight:600">$1<\/span>');
}
