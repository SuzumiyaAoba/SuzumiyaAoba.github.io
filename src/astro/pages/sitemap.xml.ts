import sitemap from "../../app/sitemap";

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export async function GET() {
  const entries = await sitemap();
  const xml = entries
    .map(
      (entry) =>
        `<url><loc>${escapeXml(entry.url)}</loc>${entry.lastModified === undefined ? "" : `<lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>`}${entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : ""}${entry.priority === undefined ? "" : `<priority>${entry.priority}</priority>`}</url>`
    )
    .join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${xml}</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } }
  );
}
