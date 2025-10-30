import React, { useMemo, useState } from "react";
import { api } from "../../lib/api";

export default function AssessmentForm({ metadata, readOnly, jobId, candidateId }) {
  if (!metadata) return <div className="small">No assessment data</div>;

  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const flatQuestions = useMemo(()=> (metadata.sections || []).flatMap(s => s.questions || []), [metadata]);

  function setAns(qId, val){
    setAnswers(a => ({...a, [qId]: val}));
  }

  function validate(){
    // required
    for (const q of flatQuestions) {
      if (q.required && !shouldShow(q)) continue; // skip hidden required
      if (q.required && (answers[q.id] === undefined || answers[q.id] === "")) {
        return `Please answer: ${q.label}`;
      }
      if (q.type === "number") {
        const val = answers[q.id];
        if (val !== undefined && val !== "") {
          const num = Number(val);
          if (Number.isNaN(num)) return `${q.label}: must be a number`;
          if (q.min !== undefined && num < q.min) return `${q.label}: must be ≥ ${q.min}`;
          if (q.max !== undefined && num > q.max) return `${q.label}: must be ≤ ${q.max}`;
        }
      }
      if ((q.type === "short" || q.type === "long") && q.maxLength) {
        const val = answers[q.id] || "";
        if (val.length > q.maxLength) return `${q.label}: max length ${q.maxLength}`;
      }
    }
    return "";
  }

  function shouldShow(q){
    if (!q.showIf) return true;
    const { questionId, equals } = q.showIf;
    return answers[questionId] === equals;
  }

  async function submit(){
    const v = validate();
    if (v) { setError(v); return; }
    setError("");
    if (!readOnly && jobId) {
      await api.submitAssessment(jobId, { candidateId, payload: answers });
      alert("Submitted");
    }
  }

  return (
    <div>
      {metadata.sections.map(sec => (
        <div key={sec.id} className="card" style={{marginBottom:12}}>
          <h4>{sec.title}</h4>
          {sec.questions.map(q => shouldShow(q) && (
            <div key={q.id} style={{marginBottom:8}}>
              <label className="small">{q.label} {q.required ? "*" : ""}</label>
              {q.type === "short" && <input className="input" value={answers[q.id]||""} maxLength={q.maxLength ?? undefined} onChange={e=>setAns(q.id,e.target.value)} disabled={readOnly}/>}
              {q.type === "long" && <textarea className="input" value={answers[q.id]||""} maxLength={q.maxLength ?? undefined} onChange={e=>setAns(q.id,e.target.value)} disabled={readOnly}></textarea>}
              {q.type === "number" && <input type="number" className="input" value={answers[q.id]||""} onChange={e=>setAns(q.id,e.target.value)} disabled={readOnly} min={q.min ?? undefined} max={q.max ?? undefined}/>}
              {q.type === "single" && (
                <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                  {(q.options || []).map(opt => (
                    <label key={opt.id} className="small" style={{display:"inline-flex", alignItems:"center", gap:6}}>
                      <input type="radio" name={q.id} checked={answers[q.id]===opt.label} onChange={()=>setAns(q.id,opt.label)} disabled={readOnly} /> {opt.label}
                    </label>
                  ))}
                </div>
              )}
              {q.type === "multi" && (
                <div style={{display:"grid", gap:6}}>
                  {(q.options || []).map(opt => {
                    const cur = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                    const checked = cur.includes(opt.label);
                    return (
                      <label key={opt.id} className="small" style={{display:"inline-flex", alignItems:"center", gap:6}}>
                        <input type="checkbox" checked={checked} onChange={(e)=>{
                          const next = new Set(cur);
                          if (e.target.checked) next.add(opt.label); else next.delete(opt.label);
                          setAns(q.id, Array.from(next));
                        }} disabled={readOnly} /> {opt.label}
                      </label>
                    );
                  })}
                </div>
              )}
              {q.type === "file" && (
                <input type="file" className="input" onChange={(e)=> setAns(q.id, e.target.files?.[0]?.name || "") } disabled={readOnly} />
              )}
            </div>
          ))}
        </div>
      ))}
      {error && <div className="small" style={{ color: "var(--danger)", margin: "8px 0" }}>{error}</div>}
      {!readOnly && <button className="btn" onClick={submit}>Submit</button>}
    </div>
  );
}
