import React from "react";
import { api } from "../../lib/api";

export default function CandidateCard({ candidate, onRefresh }) {
  const promote = async () => {
    const order = ["applied","screen","tech","offer","hired"];
    const idx = order.indexOf(candidate.stage);
    if (idx < 0 || idx === order.length-1) return;
    await api.patchCandidate(candidate.id, { stage: order[idx+1] });
    onRefresh && onRefresh();
  };
  
  const canPromote = () => {
    const order = ["applied","screen","tech","offer","hired"];
    const idx = order.indexOf(candidate.stage);
    return idx >= 0 && idx < order.length-1;
  };
  
  return (
    <div className="list-item fade-in">
      <div>
        <div style={{marginBottom:6, display:"flex", alignItems:"center", gap:8}}>
          <strong style={{fontSize:16}}>👤 {candidate.name}</strong>
          <span className={`stage-badge stage-${candidate.stage}`}>
            {candidate.stage}
          </span>
        </div>
        <div className="small">✉️ {candidate.email}</div>
      </div>
      <div>
        <button 
          className="btn-muted" 
          onClick={promote} 
          disabled={!canPromote()}
          style={{whiteSpace:"nowrap"}}
        >
          ⬆️ Promote
        </button>
      </div>
    </div>
  );
}
