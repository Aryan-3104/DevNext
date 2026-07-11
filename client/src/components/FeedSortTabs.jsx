import React from 'react';
import './FeedSortTabs.css';

export default function FeedSortTabs({ sort, window, onChange }) {
  const handleSortChange = (newSort) => {
    if (newSort === sort) return;
    onChange({ sort: newSort, window: newSort === 'top' ? (window || 'all') : undefined });
  };

  const handleWindowChange = (e) => {
    onChange({ sort: 'top', window: e.target.value });
  };

  return (
    <div className="feed-sort-container glass">
      <div className="feed-sort-tabs">
        <button
          className={`sort-tab ${sort === 'hot' ? 'active' : ''}`}
          onClick={() => handleSortChange('hot')}
        >
          🔥 Hot
        </button>
        <button
          className={`sort-tab ${sort === 'new' ? 'active' : ''}`}
          onClick={() => handleSortChange('new')}
        >
          ✨ New
        </button>
        <button
          className={`sort-tab ${sort === 'top' ? 'active' : ''}`}
          onClick={() => handleSortChange('top')}
        >
          🏆 Top
        </button>
      </div>
      
      {sort === 'top' && (
        <div className="window-select-container">
          <select 
            value={window || 'all'} 
            onChange={handleWindowChange}
            className="window-select"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      )}
    </div>
  );
}
