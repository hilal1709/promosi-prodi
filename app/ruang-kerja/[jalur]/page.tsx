import LegacyRedirect from "@/components/game/legacy-redirect";
import type { JalurId } from "@/lib/types";

const VALID = new Set<JalurId>(["it-audit", "enterprise-system", "data-science"]);

export function generateStaticParams() {
  return Array.from(VALID).map((jalur) => ({ jalur }));
}

export default async function WorkspaceLegacyPage({
  params,
}: {
  params: Promise<{ jalur: string }>;
}) {
  const { jalur } = await params;
  const zone = VALID.has(jalur as JalurId) ? jalur : "enterprise-system";
  return <LegacyRedirect to={`/?zone=${zone}`} />;
}
