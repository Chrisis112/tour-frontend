import React from 'react';

export default function GoldLoadingAnimation() {
  return (
    <div className="loading-container">
      <div className="gold-loader" />
      <style jsx>{`
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #ffffff; /* Белый фон */
        }

        .gold-loader {
          width: 120px;
          height: 12px;
          border-radius: 6px;
          background: #f3f1e7;
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
        }

        .gold-loader::before {
          content: '';
          position: absolute;
          top: 0;
          left: -40%;
          height: 100%;
          width: 40%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 215, 0, 0.8),
            transparent
          );
          animation: shimmer 1.5s infinite;
          filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.7));
          border-radius: 6px;
        }

        @keyframes shimmer {
          0% {
            left: -40%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
}
