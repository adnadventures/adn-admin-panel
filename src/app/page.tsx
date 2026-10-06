import { adminDb } from "@/lib/firebase/admin";
import { Button } from "@/components/ui/button";

// Always run on the server at request time, never cache
export const dynamic = "force-dynamic";

async function runHealthCheck() {
  try {
    const ref = adminDb.collection("_healthcheck").doc();

    // 1. Write
    await ref.set({
      message: "Firestore read/write works",
      createdAt: new Date(),
    });

    // 2. Read back
    const snap = await ref.get();
    const message = snap.data()?.message as string;

    // 3. Clean up so nothing is left behind
    await ref.delete();

    return { ok: true as const, message };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export default async function Home() {
  const result = await runHealthCheck();

  return (
    <main className="bg-background flex min-h-screen items-center justify-center p-6">
      <div className="bg-brand-gradient text-primary-foreground w-full max-w-lg rounded-xl p-10 text-center shadow-lg">
        <h1 className="text-4xl font-bold tracking-tight">ADN Adventures</h1>
        <p className="mt-2 text-lg italic">Your Travel Our Responsibilities</p>

        <div className="bg-card text-card-foreground mt-8 rounded-lg p-4 text-left text-sm">
          <p className="mb-1 font-semibold">Firestore health check</p>
          {result.ok ? (
            <p>✅ {result.message}</p>
          ) : (
            <p className="break-words text-red-600">❌ {result.error}</p>
          )}
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <Button>Primary button</Button>
          <Button variant="secondary">Secondary</Button>
        </div>
      </div>
    </main>
  );
}