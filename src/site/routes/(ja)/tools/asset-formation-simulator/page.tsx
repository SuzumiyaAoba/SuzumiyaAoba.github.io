import type { Metadata } from "@/shared/lib/site/metadata";
import AssetFormationSimulatorPage from "@/pages/tools/asset-formation-simulator";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Asset Formation Simulator",
  alternates: buildLocaleAlternates("/tools/asset-formation-simulator", "ja"),
};

export default function Page() {
  return <AssetFormationSimulatorPage locale="ja" />;
}
