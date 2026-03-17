import React from 'react';

export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-sm font-medium text-neutral-700">{label}</label>}
      <input className="input-field" {...props} />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
