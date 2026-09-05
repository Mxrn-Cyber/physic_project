export default function BackgroundDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-red-300/20 blur-3xl dark:bg-red-500/10" />
    </div>
  );
}
