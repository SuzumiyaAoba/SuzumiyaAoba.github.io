import type { Metadata } from "next";
import AssetFormationSimulatorPage from "@/pages/tools/asset-formation-simulator";

export const metadata: Metadata = {
  title: "Asset Formation Simulator",
};

export default function Page() {
  return <AssetFormationSimulatorPage locale="en" />;
}
