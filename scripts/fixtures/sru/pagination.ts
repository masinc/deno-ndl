/**
 * SRUページネーション検索のfixture生成スクリプト
 *
 * 実行方法:
 * deno run --allow-net scripts/fixtures/sru/pagination.ts > tests/integration/fixtures/sru_pagination_response.xml
 */

import { buildSRUSearchURL } from "../../../src/api/sru.ts";

const url = buildSRUSearchURL({
  operation: "searchRetrieve",
  query: "creator=宮沢賢治",
  maximumRecords: 5,
  startRecord: 6, // Second page
});

try {
  console.error(`Fetching with pagination: ${url}`);

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
