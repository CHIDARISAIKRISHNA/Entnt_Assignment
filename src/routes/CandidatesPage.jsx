import React from "react";
import CandidatesList from "../components/Candidates/CandidatesList";

export default function CandidatesPage() {
  return (
    <div style={{maxWidth:1400, margin:"0 auto"}}>
      <div className="card">
        <div style={{marginBottom:24}}>
          <h3 style={{margin:0}}>👥 Candidates</h3>
          <p className="small" style={{margin:"4px 0 0 0"}}>Manage candidate pipeline and track progress</p>
        </div>
        <CandidatesList />
      </div>
    </div>
  );
}
