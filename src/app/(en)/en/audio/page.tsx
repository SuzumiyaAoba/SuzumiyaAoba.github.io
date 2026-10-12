import AudioPage from "@/pages/audio";
import { buildPageMetadata } from "@/app/_shared/page-metadata";

export const metadata = buildPageMetadata({
  title: "Audio",
  description:
    "Explore my audio equipment with interactive 3D models of the TEAC UD-505 and CG-10M, Bluesound NODE, Sennheiser HD 800 S and Focal Clear Mg Professional.",
  path: "/audio",
  locale: "en",
});

export default function Page() {
  return <AudioPage locale="en" />;
}
