export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
      <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center">
        <span className="text-2xl">🚧</span>
      </div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">
        This page is being integrated with the WAPE backend.
      </p>
    </div>
  );
}
