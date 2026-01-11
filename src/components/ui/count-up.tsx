import { useEffect, useState } from "react";

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  className?: string;
  decimals?: number;
}

export function CountUp({ 
  end, 
  duration = 2000, 
  suffix = "", 
  className = "",
  decimals = 0
}: CountUpProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Ease out quart
      const ease = 1 - Math.pow(1 - percentage, 4);
      
      setCount(ease * end);

      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return (
    <span className={className}>
      {count.toFixed(decimals)}{suffix}
    </span>
  );
}
