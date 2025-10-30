import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import JobCard from "./JobCard";
import SearchInput from "../UI/SearchInput";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

export default function JobsList({ onEdit }) {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [total, setTotal] = useState(0);

  const load = async () => {
    const res = await api.getJobs({search, status, page, pageSize: 25});
    setJobs(res.items);
    setTotal(res.total || 0);
  };

  useEffect(()=>{ load() }, [search, page, status]);

  async function onDragEnd(result){
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;
    const prev = jobs;
    const next = Array.from(prev);
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setJobs(next); // optimistic
    try {
      await api.reorderJob(moved.id, (page - 1) * 25 + to + 1);
    } catch (e) {
      setJobs(prev); // rollback
    }
  }

  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:16, flexWrap:"wrap"}}>
        <div style={{flex:1}}>
          <SearchInput value={search} onChange={setSearch} placeholder="Filter jobs (title, tags...)" />
        </div>
        <select className="input" value={status} onChange={e=>setStatus(e.target.value)} style={{minWidth:180}}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <button className="btn" onClick={()=>onEdit({})}>✨ New Job</button>
      </div>
      <div style={{minHeight:400}}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="jobs-list">
            {(provided)=> (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {jobs.map((j, idx) => (
                  <Draggable draggableId={j.id} index={idx} key={j.id}>
                    {(prov)=>(
                      <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                        <JobCard job={j} onEdit={()=>onEdit(j)} onRefresh={load}/>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      <div className="pagination">
        <button className="btn-muted" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>
          ← Prev
        </button>
        <span style={{margin:"0 12px", color:"var(--muted)", fontWeight:500}}>Page {page}</span>
        <button className="btn-muted" onClick={()=>setPage(p=>p+1)} disabled={page*25 >= total}>
          Next →
        </button>
      </div>
    </div>
  );
}
