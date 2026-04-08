export function Page5FunFacts(props: {
  funFacts: {
    mostPostsInADay: number;
    mostPostsUser: string;
    totalReactions: number;
    mostConsistentDay: string;
    longestGroupStreak: number;
  };
}) {
  return (
    <section className="flex h-full flex-col items-center justify-center px-6 text-center">
      <h2 className="text-3xl font-bold">Fun facts</h2>
      <div className="mt-8 space-y-4 text-left text-base">
        <p>Most posts in a day: {props.funFacts.mostPostsInADay} (by @{props.funFacts.mostPostsUser})</p>
        <p>Total reactions: {props.funFacts.totalReactions}</p>
        <p>Most consistent day: {props.funFacts.mostConsistentDay}</p>
        <p>Longest streak in the group: {props.funFacts.longestGroupStreak} days</p>
      </div>
    </section>
  );
}
