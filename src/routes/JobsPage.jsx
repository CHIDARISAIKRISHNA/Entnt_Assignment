import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import JobsList from "../components/Jobs/JobsList";
import JobEditor from "../components/Jobs/JobEditor";
import { api } from "../lib/api";

export default function JobsPage() {
  const [selectedJob, setSelectedJob] = useState(null);
  const { jobId } = useParams();

  useEffect(() => {
    let active = true;
    async function loadById() {
      if (!jobId) return;
      try {
        const res = await api.getJobs({ page: 1, pageSize: 1000 });
        const found = res.items.find((j) => j.id === jobId);
        if (active) setSelectedJob(found || null);
      } catch (_) {}
    }
    loadById();
    return () => { active = false; };
  }, [jobId]);

  return (
    <div className="grid jobs-grid">
      <div className="card jobs-list">
        <div style={{marginBottom:16}}>
          <h3 style={{margin:0}}>📋 Job Listings</h3>
          <p className="small" style={{margin:"4px 0 0 0"}}>Manage your job postings</p>
        </div>
        <JobsList onEdit={(j)=>setSelectedJob(j)} />
      </div>
      <div className="card">
        <div style={{marginBottom:16}}>
          <h3 style={{margin:0}}>⚡ Quick Actions</h3>
          <p className="small" style={{margin:"4px 0 0 0"}}>Create or edit jobs quickly</p>
        </div>
        <button className="btn" onClick={()=>setSelectedJob({})} style={{width:"100%",marginBottom:12}}>✨ Create New Job</button>
        <div className="small" style={{color:"var(--muted)"}}>
          💡 Tip: Click on a job in the list to edit it, or use the search to filter results.
        </div>
        {selectedJob && (
          <JobEditor job={selectedJob} onClose={()=>setSelectedJob(null)} />
        )}
      </div>
    </div>
  );
}
