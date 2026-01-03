import { Suspense } from "react";
import AssetFormationSimulatorClient from "./AssetFormationSimulatorClient";

export default function AssetFormationSimulatorPage() {
  return (
    <Suspense>
      <AssetFormationSimulatorClient />
    </Suspense>
  );
}
