import { resolveContentDeps } from "@/shared/lib/content-file";
import { parseAwesomeItems } from "./awesome-item";
import type { AwesomeItem } from "./awesome-item";

/** YAML の記載順で返す。開発中の再読み込みにも変更を反映する。 */
export async function getAwesomeItems(): Promise<AwesomeItem[]> {
  const { fs, path, root } = await resolveContentDeps();
  const source = await fs.readFile(
    path.join(root, "awesome-something.yaml"),
    "utf-8"
  );
  return parseAwesomeItems(source);
}
