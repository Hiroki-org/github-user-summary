import React from 'react';

export default function AnimatedWrapper({
  delay,
  children,
}: {
  delay: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-slide-up" style={{ animationDelay: delay }}>
      {children}
    </div>
  );
}
