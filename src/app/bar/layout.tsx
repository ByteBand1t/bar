export default function BarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="h-screen w-screen overflow-hidden overscroll-none"
      style={{ touchAction: "none" }}
    >
      {children}
    </div>
  );
}
