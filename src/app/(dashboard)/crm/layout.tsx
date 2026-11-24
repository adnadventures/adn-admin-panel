import { requireModule } from "@/lib/auth/session";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  await requireModule("crm");

  return (
    <div className="h-full w-full">
      {children}
    </div>
  );
}

