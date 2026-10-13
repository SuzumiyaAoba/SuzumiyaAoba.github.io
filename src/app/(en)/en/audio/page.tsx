import AudioPage from "@/pages/audio";
import { buildPageMetadata } from "@/app/_shared/page-metadata";

export const metadata = buildPageMetadata({
  title: "Audio",
  description:
    "My audio equipment (NODE, CG-10M, UD-505, HA-1A MK2 and more): 3D models, connections, and specifications.",
  path: "/audio",
  locale: "en",
});

export default function Page() {
  return <AudioPage locale="en" />;
}
