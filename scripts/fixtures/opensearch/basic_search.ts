/**
 * OpenSearch基本検索のfixture生成スクリプト
 * 
 * 実行方法:
 * deno run --allow-net scripts/fixtures/opensearch/basic_search.ts > tests/integration/fixtures/opensearch_basic_search_response.xml
 */

import { buildOpenSearchURL } from "../../../src/api/opensearch.ts";

const url = buildOpenSearchURL({
  q: "夏目漱石",
  count: 5,
  format: "rss",
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