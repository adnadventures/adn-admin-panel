import type { SessionUser } from "@/types/roles";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";

export function Sidebar({ user }: { user: SessionUser }) {
  return (
    <aside className="bg-card sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r md:flex">
      <div className="p-4">
        <Brand />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <NavLinks user={user} />
      </div>
      <p className="text-muted-foreground p-4 text-xs italic">
        Your Travel Our Responsibilities
      </p>
    </aside>
  );
}