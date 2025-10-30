import React from "react";
import { v4 as uuid } from "uuid";

const emptyQuestion = () => ({ id: uuid(), type: "short", label: "New question", required: false });

export default function AssessmentBuilder({ value, onChange }) {
  const sections = value?.sections || [];

  function ensureChange(nextSections){
    onChange && onChange({ sections: nextSections });
  }

  function addSection(){
    const next = [...sections, { id: uuid(), title: `Section ${sections.length+1}`, questions: [] }];
    ensureChange(next);
  }

  function addQuestion(secId){
    const next = sections.map(sec => sec.id === secId ? {...sec, questions: [...(sec.questions||[]), emptyQuestion()]} : sec);
    ensureChange(next);
  }

  function updateQuestion(secId, qId, patch){
    const next = sections.map(sec => sec.id === secId ? {...sec, questions: (sec.questions||[]).map(q => q.id === qId ? {...q, ...patch} : q)} : sec);
    ensureChange(next);
  }

  const rendered = sections.length ? sections : [{ id: "tmp", title: "Section 1", questions: [] }];

  return (
    <div>
      {rendered.map((sec, idx) => (
        <div key={sec.id} style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          boxShadow: "var(--shadow)",
          transition: "all 0.2s"
        }}>
          {/* Section Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: "2px solid var(--border)"
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--accent)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: 14
            }}>
              {idx + 1}
            </div>
            <input 
              className="input" 
              value={sec.title} 
              onChange={e=>{
                const next = sections.map(x=> x.id===sec.id ? {...x, title: e.target.value} : x);
                ensureChange(next);
              }}
              placeholder="Section title..."
              style={{
                flex: 1,
                fontWeight: 600,
                fontSize: 16,
                padding: "8px 12px"
              }}
            />
          </div>

          {/* Questions */}
          <div style={{display: "grid", gap: 16}}>
            {(sec.questions||[]).map((q, qIdx) => (
              <div key={q.id} style={{
                background: "#f8fafc",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: 16,
                display: "grid",
                gap: 12
              }}>
                <div style={{display: "flex", alignItems: "center", gap: 8}}>
                  <span style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    fontWeight: 500
                  }}>
                    Question {qIdx + 1}
                  </span>
                  <div style={{flex: 1}} />
                  {q.required && (
                    <span style={{
                      background: "#fef3c7",
                      color: "#92400e",
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 6
                    }}>
                      Required
                    </span>
                  )}
                </div>
                
                <input 
                  className="input" 
                  value={q.label} 
                  onChange={e=>updateQuestion(sec.id,q.id,{label:e.target.value})}
                  placeholder="Enter question text..."
                />
                
                <select 
                  className="input" 
                  value={q.type} 
                  onChange={e=>updateQuestion(sec.id,q.id,{type:e.target.value})}
                  style={{fontSize: 14}}
                >
                  <option value="short">📝 Short Text</option>
                  <option value="long">📄 Long Text</option>
                  <option value="single">🔘 Single Choice</option>
                  <option value="multi">☑️ Multi Choice</option>
                  <option value="number">🔢 Numeric</option>
                  <option value="file">📎 File Upload (stub)</option>
                </select>
                
                {(q.type === "single" || q.type === "multi") && (
                  <div>
                    <label>Options (comma separated)</label>
                    <input className="input" value={(q.options||[]).map(o=>o.label).join(", ")} onChange={e=>{
                      const vals = e.target.value.split(",").map(v=>v.trim()).filter(Boolean);
                      updateQuestion(sec.id,q.id,{ options: vals.map(v=>({ id: uuid(), label: v })) });
                    }} placeholder="e.g. Yes, No, Maybe" />
                  </div>
                )}

                {q.type === "number" && (
                  <div style={{display:"flex", gap:8}}>
                    <div style={{flex:1}}>
                      <label>Min</label>
                      <input type="number" className="input" value={q.min ?? ""} onChange={e=>updateQuestion(sec.id,q.id,{ min: e.target.value === "" ? undefined : Number(e.target.value) })} />
                    </div>
                    <div style={{flex:1}}>
                      <label>Max</label>
                      <input type="number" className="input" value={q.max ?? ""} onChange={e=>updateQuestion(sec.id,q.id,{ max: e.target.value === "" ? undefined : Number(e.target.value) })} />
                    </div>
                  </div>
                )}

                {(q.type === "short" || q.type === "long") && (
                  <div>
                    <label>Max length (optional)</label>
                    <input type="number" className="input" value={q.maxLength ?? ""} onChange={e=>updateQuestion(sec.id,q.id,{ maxLength: e.target.value === "" ? undefined : Number(e.target.value) })} />
                  </div>
                )}

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  paddingTop: 4
                }}>
                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    fontSize: 14,
                    color: "#475569"
                  }}>
                    <input 
                      type="checkbox" 
                      checked={q.required} 
                      onChange={e=>updateQuestion(sec.id,q.id,{required:e.target.checked})}
                      style={{width: 18, height: 18, cursor: "pointer"}}
                    />
                    <span>Required field</span>
                  </label>
                </div>

                <div style={{display:"grid", gap:8}}>
                  <label className="small">Conditional display</label>
                  <div className="small" style={{color:"var(--muted)"}}>Optionally show this question only if another question equals a value.</div>
                  <div style={{display:"flex", gap:8}}>
                    <input className="input" placeholder="Depends on Question ID" value={q.showIf?.questionId || ""} onChange={e=>updateQuestion(sec.id,q.id,{ showIf: { ...(q.showIf||{}), questionId: e.target.value || undefined } })} />
                    <input className="input" placeholder="Equals value (e.g. Yes)" value={q.showIf?.equals || ""} onChange={e=>updateQuestion(sec.id,q.id,{ showIf: { ...(q.showIf||{}), equals: e.target.value || undefined } })} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Question Button */}
          <button 
            className="btn-muted" 
            onClick={()=>addQuestion(sec.id)}
            style={{width: "100%", marginTop: 16}}
          >
            ➕ Add Question
          </button>
        </div>
      ))}
      
      {/* Add Section Button */}
      <div style={{display: "flex", justifyContent: "center", marginTop: 12}}>
        <button className="btn" onClick={addSection} style={{minWidth: 200}}>
          ➕ Add New Section
        </button>
      </div>
    </div>
  );
}
