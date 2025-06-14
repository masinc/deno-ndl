/**
 * OpenSearchページネーション検索のfixture生成スクリプト
 * 
 * 実行方法:
 * deno run --allow-net scripts/fixtures/opensearch/pagination.ts > tests/integration/fixtures/opensearch_pagination_response.xml
 */

import { buildOpenSearchURL } from "../../../src/api/opensearch.ts";

const url = buildOpenSearchURL({
  q: "文学",
  count: 5,
  start: 10, // 0-based (11件目から5件)
  format: "rss",
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