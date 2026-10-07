export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-brand-gradient text-primary-foreground flex size-10 items-center justify-center rounded-lg text-sm font-extrabold">
        ADN
      </div>
      <div className="leading-tight">
        <p className="font-semibold">ADN Adventures</p>
        <p className="text-muted-foreground text-[11px]">Admin Panel</p>
      </div>
    </div>
  );
}