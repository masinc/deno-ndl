/**
 * OpenSearch URL構築のfixture生成スクリプト
 *
 * 実行方法:
 * deno run --allow-net scripts/fixtures/opensearch/url_building.ts > tests/integration/fixtures/opensearch_url_building_response.xml
 */

import { buildOpenSearchURL } from "../../../src/api/opensearch.ts";

const url = buildOpenSearchURL({
  q: "日本文学",
  count: 10,
  start: 0,
  format: "atom",
  hl: "ja",
});

try {
  console.error(`Fetching: ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    console.error(`HTTP Error: ${response.status} ${response.statusText}`);
    Deno.exit(1);
  }

  const xmlText = await response.text();

  // XMLデータを標準出力に出力
  console.log(xmlText);
} catch (error) {
  console.error("Network error:", error);
  Deno.exit(1);
}
