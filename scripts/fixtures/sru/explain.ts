/**
 * SRU explain operationのfixture生成スクリプト
 *
 * 実行方法:
 * deno run --allow-net scripts/fixtures/sru/explain.ts > tests/integration/fixtures/sru_explain_response.xml
 */

import { buildSRUExplainURL } from "../../../src/api/sru.ts";

const url = buildSRUExplainURL({
  operation: "explain",
  version: "1.2",
  recordPacking: "xml",
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
