// Purely decorative, fixed-position background: a few soft blurred color
// blobs plus a faint dot grid, sitting behind all real content. Doesn't
// scroll away, doesn't intercept clicks, and adapts for dark mode.
// Rendered once as the first child of the app's root element, which must
// have `relative isolate` so this stacks correctly behind page content
// instead of behind the root's own background.
export default function BackgroundDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-red-400/30 blur-3xl dark:bg-red-500/20" />
      <div className="absolute -right-32 top-1/4 h-[26rem] w-[26rem] rounded-full bg-rose-400/25 blur-3xl dark:bg-rose-600/15" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-orange-300/25 blur-3xl dark:bg-orange-500/10" />
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(239,68,68,0.35) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
