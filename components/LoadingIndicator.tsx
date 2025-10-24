import React from "react";

const LoadingIndicator: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="book">
        <div className="inner">
          <div className="left"></div>
          <div className="middle"></div>
          <div className="right"></div>
        </div>
        <ul>
          {Array.from({ length: 18 }, (_, i) => (
            <li key={i}></li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LoadingIndicator;
