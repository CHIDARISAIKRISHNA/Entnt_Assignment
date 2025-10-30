import React, { useEffect } from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import JobsPage from "./routes/JobsPage";
import CandidatesPage from "./routes/CandidatesPage";
import CandidateProfile from "./routes/CandidateProfile";
import AssessmentsPage from "./routes/AssessmentsPage";
import NotFound from "./routes/NotFound";

export default function App() {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    const body = document.body;
    const themes = ["theme-jobs","theme-candidates","theme-assessments"];
    body.classList.remove(...themes);
    if (path.startsWith("/candidates")) body.classList.add("theme-candidates");
    else if (path.startsWith("/assessments")) body.classList.add("theme-assessments");
    else body.classList.add("theme-jobs");
  }, [location.pathname]);
  return (
    <div className="app-shell">
      <header className="header">
        <div>
          <h1>🎯 Talentflow</h1>
          <div className="small">A Mini Hiring Platform — Front-end assignment</div>
        </div>
        <nav className="nav">
          <NavLink 
            to="/jobs" 
            style={({ isActive }) => ({
              backgroundColor: isActive ? '#eff6ff' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--muted)'
            })}
          >
            💼 Jobs
          </NavLink>
          <NavLink 
            to="/candidates"
            style={({ isActive }) => ({
              backgroundColor: isActive ? '#eff6ff' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--muted)'
            })}
          >
            👥 Candidates
          </NavLink>
          <NavLink 
            to="/assessments"
            style={({ isActive }) => ({
              backgroundColor: isActive ? '#eff6ff' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--muted)'
            })}
          >
            📝 Assessments
          </NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<JobsPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:jobId" element={<JobsPage />} />
        <Route path="/candidates" element={<CandidatesPage />} />
        <Route path="/candidates/:id" element={<CandidateProfile />} />
        <Route path="/assessments" element={<AssessmentsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
