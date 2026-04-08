export function Page1Opening(props: { title: string }) {
  return (
    <section className="flex h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,#1f2937_0%,#0A0A0A_60%)] px-6 text-center">
      <h1 className="animate-[fadeIn_300ms_cubic-bezier(0.16,1,0.3,1)] text-5xl font-black">
        You made it.
      </h1>
      <p className="mt-3 animate-[fadeIn_300ms_cubic-bezier(0.16,1,0.3,1)] text-xl text-[#A3A3A3]">
        {props.title}
      </p>
      <p className="mt-10 animate-bounce text-xs text-[#6B6B6B]">Tap to continue</p>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
