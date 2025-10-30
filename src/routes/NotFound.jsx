import React from "react";
import { Link } from "react-router-dom";

export default function NotFound(){
  return (
    <div className="card" style={{textAlign:"center", padding:"60px 40px"}}>
      <div style={{fontSize:64, marginBottom:20}}>🔍</div>
      <h3 style={{marginBottom:12}}>404 — Page not found</h3>
      <p className="small" style={{marginBottom:24}}>The page you're looking for doesn't exist.</p>
      <Link to="/jobs" className="btn" style={{textDecoration:"none", display:"inline-block"}}>
        🏠 Go to Home
      </Link>
    </div>
  )
}
