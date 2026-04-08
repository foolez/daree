export function Page4Winner(props: {
  winner: { name: string; avatarUrl: string | null; points: number; isYou: boolean };
}) {
  return (
    <section className="flex h-full flex-col items-center justify-center px-6 text-center">
      <h2 className="text-3xl font-bold">The champion</h2>
      <div className="mt-8 text-5xl">👑</div>
      <div className="mt-3 h-24 w-24 overflow-hidden rounded-full border-4 border-[#FFD700]">
        {props.winner.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={props.winner.avatarUrl} alt={props.winner.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#1A1A1A] text-2xl">
            {props.winner.name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <p className="mt-4 text-2xl font-semibold">{props.winner.name}</p>
      <p className="mt-1 text-[#A3A3A3]">Won with {props.winner.points} points</p>
      {props.winner.isYou && <p className="mt-3 text-[#00FF88]">That&apos;s you! 👑</p>}
    </section>
  );
}
