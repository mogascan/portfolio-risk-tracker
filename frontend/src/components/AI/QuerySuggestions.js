// frontend/src/components/AI/QuerySuggestions.js
import React from 'react';
import './AI.css';

const QuerySuggestions = ({ onSelect }) => {
  const suggestions = [
    "What's my best performing coin this month?",
    "How is my portfolio diversified?",
    "Should I rebalance my portfolio?",
    "What's my total profit/loss?",
    "Analyze my BTC position",
    "What tax implications should I consider?",
    "How does my portfolio compare to the market?"
  ];
  
  return (
    <div className="query-suggestions">
      <p className="suggestions-title">Try asking:</p>
      <div className="suggestions-list">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="suggestion-button"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuerySuggestions;