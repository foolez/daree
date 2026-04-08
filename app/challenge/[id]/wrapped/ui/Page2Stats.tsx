"use client";

import { useEffect, useState } from "react";

function useCount(target: number) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let i = 0;
    const step = Math.max(1, Math.ceil(target / 20));
    const id = setInterval(() => {
      i += step;
      if (i >= target) {
        setCount(target);
        clearInterval(id);
      } else setCount(i);
    }, 50);
    return () => clearInterval(id);
  }, [target]);
  return count;
}

export function Page2Stats(props: {
  totalPosts: number;
  daysCompleted: number;
  longestStreak: number;
}) {
  const posts = useCount(props.totalPosts);
  const days = useCount(props.daysCompleted);
  const streak = useCount(props.longestStreak);

  return (
    <section className="flex h-full flex-col items-center justify-center px-6 text-center">
      <h2 className="text-3xl font-bold">Your dare in numbers</h2>
      <p className="mt-6 text-6xl font-black text-[#00FF88]">{posts}</p>
      <p className="mt-1 text-sm text-[#A3A3A3]">Total proofs posted</p>
      <div className="mt-8 space-y-2 text-lg">
        <p>{days} days completed</p>
        <p>{streak} day longest streak 🔥</p>
      </div>
    </section>
  );
}
