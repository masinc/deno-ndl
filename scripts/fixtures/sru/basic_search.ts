/**
 * SRU基本検索のfixture生成スクリプト
 *
 * 実行方法:
 * deno run --allow-net scripts/fixtures/sru/basic_search.ts > tests/integration/fixtures/sru_basic_search_response.xml
 */

import { buildSRUSearchURL } from "../../../src/api/sru.ts";

const url = buildSRUSearchURL({
  operation: "searchRetrieve",
  query: "title=夏目漱石",
  maximumRecords: 3,
  startRecord: 1,
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
