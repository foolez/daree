export function Page3Ranking(props: {
  rank: number;
  memberCount: number;
  points: number;
}) {
  const rankColor =
    props.rank === 1 ? "#FFD700" : props.rank === 2 ? "#C0C0C0" : props.rank === 3 ? "#CD7F32" : "#9CA3AF";
  const ratio = Math.max(0, Math.min(1, (props.memberCount - props.rank + 1) / Math.max(1, props.memberCount)));

  return (
    <section className="flex h-full flex-col items-center justify-center px-6 text-center">
      <h2 className="text-3xl font-bold">Where you landed</h2>
      <p className="mt-8 text-7xl font-black" style={{ color: rankColor }}>
        #{props.rank}
      </p>
      <p className="mt-2 text-sm text-[#A3A3A3]">Out of {props.memberCount} members</p>
      <p className="mt-1 text-lg">{props.points} total points</p>
      <div className="mt-6 h-2 w-56 rounded-full bg-white/15">
        <div className="h-2 rounded-full bg-[#00FF88]" style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
    </section>
  );
}
