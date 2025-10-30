import React from "react";

export default function SearchInput({value,onChange,placeholder}) {
  return (
    <div className="search-container">
      <span className="search-icon">🔍</span>
      <input 
        className="input" 
        value={value} 
        onChange={e=>onChange(e.target.value)} 
        placeholder={placeholder || "Search..."} 
      />
    </div>
  )
}
