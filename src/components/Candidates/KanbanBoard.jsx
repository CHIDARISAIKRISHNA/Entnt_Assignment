import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { api } from "../../lib/api";

const STAGES = ["applied","screen","tech","offer","hired","rejected"];

export default function KanbanBoard(){
  const [columns,setColumns] = useState({});

  useEffect(()=>{ load() }, []);

  async function load(){
    const all = await api.getCandidates({page:1, pageSize:1000});
    const grouped = STAGES.reduce((acc,s)=>({...acc,[s]: all.items.filter(c=>c.stage===s)}),{});
    setColumns(grouped);
  }

  async function onDragEnd(result){
    if (!result.destination) return;
    const fromStage = result.source.droppableId;
    const toStage = result.destination.droppableId;
    const candidateId = result.draggableId;
    if (fromStage === toStage) return;
    // optimistic UI
    const prev = columns;
    const moved = prev[fromStage].filter(c=>c.id!==candidateId);
    const item = prev[fromStage].find(c=>c.id===candidateId);
    const next = {...prev, [fromStage]: moved, [toStage]: [item, ...prev[toStage]]};
    setColumns(next);
    try {
      await api.patchCandidate(candidateId, { stage: toStage });
    } catch (e) {
      setColumns(prev); // rollback
    }
  }

  const stageIcons = {
    applied: "📨",
    screen: "🔍", 
    tech: "💻",
    offer: "💰",
    hired: "✅",
    rejected: "❌"
  };

  return (
    <div style={{
      display:"flex",
      gap:16,
      overflowX:"auto",
      paddingTop:8,
      paddingBottom:8,
      minHeight:300,
      marginBottom:16
    }}>
      <DragDropContext onDragEnd={onDragEnd}>
        {STAGES.map(stage => (
          <Droppable droppableId={stage} key={stage}>
            {(provided)=>(
              <div 
                ref={provided.innerRef} 
                {...provided.droppableProps} 
                style={{
                  minWidth:220,
                  maxWidth:280,
                  flex: "0 0 auto",
                  background: "var(--card)",
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: "var(--shadow)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <div style={{marginBottom:12, paddingBottom:12, borderBottom:"2px solid var(--border)"}}>
                  <h4 style={{margin:0, fontSize:14, fontWeight:600, display:"flex", alignItems:"center", gap:8}}>
                    <span>{stageIcons[stage]}</span>
                    <span style={{textTransform:"capitalize"}}>{stage}</span>
                    {columns[stage]?.length > 0 && (
                      <span style={{
                        background: "var(--accent)",
                        color: "white",
                        borderRadius: 12,
                        padding: "2px 8px",
                        fontSize: 12,
                        fontWeight: 500,
                        marginLeft: "auto"
                      }}>{columns[stage].length}</span>
                    )}
                  </h4>
                </div>
                <div style={{flex:1, overflowY:"auto", maxHeight:450}}>
                  {columns[stage]?.map((c,idx)=>(
                    <Draggable draggableId={c.id} index={idx} key={c.id}>
                      {(prov)=>(
                        <div 
                          ref={prov.innerRef} 
                          {...prov.draggableProps} 
                          {...prov.dragHandleProps} 
                          style={{
                            background: "#f8fafc",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 8,
                            cursor: "grab",
                            transition: "all 0.2s",
                            boxShadow: "var(--shadow-sm)"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                        >
                          <div>
                            <strong style={{fontSize:14, display:"block", marginBottom:4}}>{c.name}</strong>
                            <div className="small" style={{wordBreak:"break-word"}}>{c.email}</div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </DragDropContext>
    </div>
  );
}
