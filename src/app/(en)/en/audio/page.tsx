import AudioPage from "@/pages/audio";
import { buildPageMetadata } from "@/app/_shared/page-metadata";

export const metadata = buildPageMetadata({
  title: "Audio",
  description:
    "Explore a connected 3D audio system with NODE, UD-505, CG-10M and HA-1A MK2. Switch between HD 800 S and Clear Mg Professional and inspect the connections and equipment details.",
  path: "/audio",
  locale: "en",
});

export default function Page() {
  return <AudioPage locale="en" />;
}
