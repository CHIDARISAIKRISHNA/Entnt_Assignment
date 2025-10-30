import React, { useEffect, useRef, useState } from "react";
import AssessmentBuilder from "../components/Assessments/AssessmentBuilder";
import AssessmentPreview from "../components/Assessments/AssessmentPreview";
import { api } from "../lib/api";

export default function AssessmentsPage() {
  const [state, setState] = useState(null); // builder state
  const [jobId, setJobId] = useState("");
  const [jobs, setJobs] = useState([]);
  const [counts, setCounts] = useState({}); // jobId -> question count
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const debounceRef = useRef(null);

  useEffect(()=>{ (async ()=>{
    const res = await api.getJobs({ page:1, pageSize: 1000 });
    const items = res.items || [];
    // fetch assessments and counts for each job
    const assessments = await Promise.all(items.map(async (j)=>{
      const a = await api.getAssessment(j.id);
      const count = (a?.sections||[]).reduce((sum,s)=> sum + (s.questions?.length||0), 0);
      return { job: j, count };
    }));
    // keep only jobs that have assessments with >= 10 questions; limit to 3
    const filtered = assessments.filter(x=> x.count >= 10).slice(0,3);
    setJobs(filtered.map(x=> x.job));
    setCounts(Object.fromEntries(filtered.map(x=> [x.job.id, x.count])));
    // preselect the first if none selected
    if (!jobId && filtered.length) setJobId(filtered[0].job.id);
  })() }, []);

  useEffect(()=>{ (async ()=>{
    if (!jobId) return;
    const a = await api.getAssessment(jobId);
    setState(a || { sections: [] });
  })() }, [jobId]);

  async function save(){
    if (!jobId || !state) return;
    await api.putAssessment(jobId, state);
    setSavedAt(Date.now());
    // refresh count for this job
    const count = (state.sections||[]).reduce((sum,s)=> sum + (s.questions?.length||0), 0);
    setCounts(c => ({...c, [jobId]: count }));
  }

  // Debounced autosave when builder changes
  useEffect(() => {
    if (!jobId) return;
    if (!state) return;
    setSaving(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await api.putAssessment(jobId, state);
        setSavedAt(Date.now());
      } finally {
        setSaving(false);
      }
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [jobId, state]);
  return (
    <div className="grid" style={{gridTemplateColumns:"1fr 450px", gap:20}}>
      <div className="card" style={{padding: 24}}>
        <div style={{marginBottom:24, paddingBottom:20, borderBottom:"2px solid var(--border)"}}>
          <h3 style={{margin:0, marginBottom:4}}>📝 Assessment Builder</h3>
          <p className="small" style={{margin:0}}>Create custom assessment questions</p>
          <div className="small" style={{marginTop:12}}>Select an assessment:</div>
          <div className="grid" style={{gridTemplateColumns:"repeat(3, 1fr)", gap: 12, marginTop: 8}}>
            {jobs.map(j => (
              <button key={j.id} onClick={()=>setJobId(j.id)} className="btn-muted" style={{
                textAlign: "left",
                padding: 16,
                borderRadius: 12,
                border: jobId===j.id ? "2px solid var(--accent)" : "1px solid var(--border)",
                background: jobId===j.id ? "#eff6ff" : "var(--card)",
                cursor: "pointer"
              }}>
                <div style={{fontWeight:600, marginBottom:6}}>{j.title}</div>
                <div className="small">{(counts[j.id] ?? 0)} {((counts[j.id] ?? 0) === 1 ? "question" : "questions")}</div>
              </button>
            ))}
          </div>
          <div style={{display:"flex", justifyContent:"flex-end", marginTop:12}}>
            <button className="btn" onClick={save} disabled={!jobId}>💾 Save</button>
          </div>
          <div className="small" style={{marginTop:8, color: saving ? "var(--muted)" : "var(--muted)"}}>
            {saving ? "Saving…" : savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString()}` : ""}
          </div>
        </div>
        <AssessmentBuilder value={state} onChange={setState} />
      </div>
      <div className="card" style={{padding: 24}}>
        <div style={{marginBottom:24, paddingBottom:20, borderBottom:"2px solid var(--border)"}}>
          <h4 style={{margin:0, marginBottom:4}}>👁️ Live Preview</h4>
          <p className="small" style={{margin:0}}>See how your assessment looks</p>
        </div>
        <AssessmentPreview metadata={state} jobId={jobId} />
      </div>
    </div>
  );
}
