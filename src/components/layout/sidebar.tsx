import type { SessionUser } from "@/types/roles";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";

export function Sidebar({ user }: { user: SessionUser }) {
  return (
    <aside className="bg-card sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/80 md:flex">
      <div className="border-b border-border/70 px-5 py-5">
        <Brand />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <NavLinks user={user} />
      </div>
      <p className="text-muted-foreground border-t border-border/70 px-5 py-4 text-xs">
        Your Travel Our Responsibilities
      </p>
    </aside>
  );
}