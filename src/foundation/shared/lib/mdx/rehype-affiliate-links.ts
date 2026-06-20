import rehypeUrlInspector from "@jsdevtools/rehype-url-inspector";
import type { Options, UrlMatch } from "@jsdevtools/rehype-url-inspector";

const AFFILIATE_PROTOCOL = "affiliate://";

export function createRehypeAffiliateLinks(affiliateById: Map<string, string>) {
  const options: Options = {
    selectors: ["a[href]"],
    inspectEach(url: UrlMatch) {
      if (!url.url.startsWith(AFFILIATE_PROTOCOL)) return;
      const affiliateId = decodeURIComponent(url.url.slice(AFFILIATE_PROTOCOL.length));
      const productUrl = affiliateById.get(affiliateId);
      if (productUrl && url.propertyName) {
        url.node.properties = url.node.properties ?? {};
        url.node.properties[url.propertyName] = productUrl;
      }
    },
  };

  return [rehypeUrlInspector, options] as [typeof rehypeUrlInspector, Options];
}
