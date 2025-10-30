import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { FixedSizeList as List } from "react-window";
import CandidateCard from "./CandidateCard";
import SearchInput from "../UI/SearchInput";
import KanbanBoard from "./KanbanBoard";

export default function CandidatesList() {
  const [candidates, setCandidates] = useState([]);
  const [search,setSearch] = useState("");
  const [stageFilter,setStageFilter] = useState("");
  const [listHeight, setListHeight] = useState(500);

  useEffect(()=>{ load() }, []);

  async function load(){
    const res = await api.getCandidates({search, stage: stageFilter, page:1});
    setCandidates(res.items);
  }

  useEffect(()=>{ load() }, [search, stageFilter]);

  // Calculate dynamic height based on viewport
  useEffect(() => {
    const updateHeight = () => {
      const viewportHeight = window.innerHeight;
      const calculatedHeight = Math.max(400, Math.min(600, viewportHeight * 0.45));
      setListHeight(calculatedHeight);
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const Row = ({ index, style }) => {
    const c = candidates[index];
    return <div style={style}><CandidateCard key={c.id} candidate={c} onRefresh={load} /></div>;
  };

  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:16, flexWrap:"wrap"}}>
        <div style={{flex:1, minWidth:200}}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search name or email" />
        </div>
        <select className="input" value={stageFilter} onChange={e=>setStageFilter(e.target.value)} style={{minWidth:180}}>
          <option value="">All stages</option>
          <option value="applied">📨 Applied</option>
          <option value="screen">🔍 Screen</option>
          <option value="tech">💻 Tech</option>
          <option value="offer">💰 Offer</option>
          <option value="hired">✅ Hired</option>
          <option value="rejected">❌ Rejected</option>
        </select>
      </div>

      <div style={{borderRadius:12, border:"1px solid var(--border)", padding:8, background:"var(--card)"}}>
        <div style={{height:listHeight, overflow:"hidden"}}>
          <List height={listHeight} itemCount={candidates.length} itemSize={78} width="100%">
            {Row}
          </List>
        </div>
      </div>

      <div style={{marginTop:24}}>
        <div style={{marginBottom:16}}>
          <h4 style={{margin:0}}>📊 Pipeline Visualization</h4>
          <p className="small" style={{margin:"4px 0 0 0"}}>Drag candidates between stages to update their status</p>
        </div>
        <KanbanBoard />
      </div>
    </div>
  );
}
