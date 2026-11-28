import { requireModule } from "@/lib/auth/session";
import { PackageBuilderView } from "@/components/package-builder/package-builder-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Package Builder | ADN Admin Panel",
  description: "Interactive Tour Package PDF Generator and Brochure Builder for ADN Adventures",
};

export default async function PackageBuilderPage() {
  await requireModule("package-builder");

  return <PackageBuilderView />;
}
