export function Page1Opening(props: { title: string }) {
  return (
    <section className="flex h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,#1f2937_0%,#0A0A0A_60%)] px-6 text-center">
      <h1 className="animate-pulse text-5xl font-black">You made it.</h1>
      <p className="mt-3 text-xl text-[#A3A3A3]">{props.title}</p>
      <p className="mt-10 animate-bounce text-xs text-[#6B6B6B]">Tap to continue</p>
    </section>
  );
}
