import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description="Here's what's happening at ADN Adventures."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["Revenue (₹)", "Expenses (₹)", "Profit (₹)", "Active bookings"].map((label) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">—</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}