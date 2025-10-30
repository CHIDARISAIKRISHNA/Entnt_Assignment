import React from "react";

export default function Modal({ children, onClose, title }) {
  return (
    <div style={{
      position:"fixed",left:0,top:0,right:0,bottom:0,display:"flex",
      alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.5)",
      zIndex:1000
    }} onClick={onClose}>
      <div 
        style={{
          width:600,maxWidth:"95%",padding:24,background:"white",
          borderRadius:16,boxShadow:"0 20px 25px -5px rgba(0,0,0,0.1)",
          maxHeight:"90vh",overflow:"auto"
        }}
        onClick={(e)=>e.stopPropagation()}
      >
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{margin:0}}>{title}</h3>
          <button onClick={onClose} className="btn-muted" style={{padding:"6px 12px",fontSize:16}}>
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
