import React from 'react';

const Confetti: React.FC = () => {
  const confettiCount = 150;
  const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];

  const confetti = Array.from({ length: confettiCount }).map((_, index) => {
    const style: React.CSSProperties = {
      left: `${Math.random() * 100}%`,
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      animationDelay: `${Math.random() * 4}s`,
      animationDuration: `${2 + Math.random() * 2}s`,
    };
    return <div key={index} className="confetti-piece" style={style} />;
  });

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-50">
      {confetti}
    </div>
  );
};

export default Confetti;
