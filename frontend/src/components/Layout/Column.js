// frontend/src/components/Layout/Column.js
import React from 'react';

/**
 * Column component for the multi-column layout
 * 
 * @param {string} title - Column title
 * @param {ReactNode} children - Column content
 * @param {number} width - Width percentage of the column
 * @param {Function} onClose - Function to call when closing the column
 * @param {string} className - Additional CSS class names
 */
const Column = ({ title, children, width, onClose, className }) => {
  return (
    <div className={`column ${className || ''}`} style={{ width: `${width}%` }}>
      <div className="column-header">
        <h2>{title}</h2>
        <button className="column-close" onClick={onClose}>&times;</button>
      </div>
      <div className="column-content">
        {children}
      </div>
    </div>
  );
};
