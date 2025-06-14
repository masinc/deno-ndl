/**
 * SRU explain operationの例
 *
 * 実行方法:
 * deno run --allow-net examples/sru/explain.ts
 */

import { explainSRU } from "../../mod.ts";

// Explain response types
interface ExplainServerInfo {
  "@protocol": string;
  "@version": string;
  host: string;
  port: number;
  database: string;
}

interface ExplainDatabaseInfo {
  title: string;
  description?: string;
  author?: string;
}

interface ExplainIndexMapName {
  "@set"?: string;
  "#text": string;
}

interface ExplainIndexMap {
  "@primary"?: boolean;
  name: ExplainIndexMapName | string;
}

interface ExplainIndex {
  title: string;
  map?: ExplainIndexMap;
  configInfo?: {
    supports?: Array<{
      "@type": string;
      "#text": string;
    }>;
  };
}

interface ExplainSchema {
  "@identifier": string;
  "@location"?: string;
  "@name": string;
  "@sort"?: boolean;
  "@retrieve"?: boolean;
  title: string;
  description?: string;
}

interface ExplainData {
  serverInfo?: ExplainServerInfo;
  databaseInfo?: ExplainDatabaseInfo;
  indexInfo?: {
    set?: Array<{
      "@identifier": string;
      "@name": string;
      title: string;
      description?: string;
    }>;
    index?: ExplainIndex | ExplainIndex[];
  };
  schemaInfo?: {
    schema?: ExplainSchema | ExplainSchema[];
  };
  configInfo?: {
    default?: Array<{
      "@type": string;
      "#text": string;
    }>;
    setting?: Array<{
      "@type": string;
      "#text": string;
    }>;
    supports?: Array<{
      "@type": string;
      "#text": string;
    }>;
  };
}

async function demonstrateExplain() {
  console.log("SRU Explain Operation の例");
  console.log("=".repeat(40));

  const result = await explainSRU({
    operation: "explain",
    version: "1.2",
  });

  if (result.isErr()) {
    console.error("Explainエラー:", result.error.message);
    Deno.exit(1);
  }

  const response = result.value;

  if (response.type !== "explain") {
    console.error("予期しないレスポンスタイプ");
    Deno.exit(1);
  }

  console.log(`SRUバージョン: ${response.response.version}`);
  console.log(`レコードスキーマ: ${response.response.record.recordSchema}`);

  // サーバー情報を取得
  const recordData = response.response.record.recordData;
  if (
    typeof recordData === "object" && recordData !== null &&
    "explain" in recordData
  ) {
    const explainRecord = recordData as { explain: ExplainData };
    const explain = explainRecord.explain;

    if (explain.serverInfo) {
      console.log("\n--- サーバー情報 ---");
      console.log(`プロトコル: ${explain.serverInfo["@protocol"]}`);
      console.log(`バージョン: ${explain.serverInfo["@version"]}`);
      console.log(`ホスト: ${explain.serverInfo.host}`);
      console.log(`ポート: ${explain.serverInfo.port}`);
      console.log(`データベース: ${explain.serverInfo.database}`);
    }

    if (explain.databaseInfo) {
      console.log("\n--- データベース情報 ---");
      console.log(`タイトル: ${explain.databaseInfo.title}`);
      if (explain.databaseInfo.description) {
        console.log(`説明: ${explain.databaseInfo.description}`);
      }
      if (explain.databaseInfo.author) {
        console.log(`作成者: ${explain.databaseInfo.author}`);
      }
    }

    if (explain.indexInfo && explain.indexInfo.index) {
      console.log("\n--- 利用可能なインデックス ---");
      const indexes = Array.isArray(explain.indexInfo.index)
        ? explain.indexInfo.index
        : [explain.indexInfo.index];

      indexes.forEach((index: ExplainIndex, i: number) => {
        console.log(`${i + 1}. ${index.title}`);
        if (index.map && index.map.name) {
          const name = typeof index.map.name === "object"
            ? index.map.name["#text"]
            : index.map.name;
          console.log(`   名前: ${name}`);
        }
      });
    }

    if (explain.schemaInfo && explain.schemaInfo.schema) {
      console.log("\n--- 利用可能なスキーマ ---");
      const schemas = Array.isArray(explain.schemaInfo.schema)
        ? explain.schemaInfo.schema
        : [explain.schemaInfo.schema];

      schemas.forEach((schema: ExplainSchema, i: number) => {
        console.log(`${i + 1}. ${schema.title}`);
        console.log(`   識別子: ${schema["@identifier"]}`);
        console.log(`   名前: ${schema["@name"]}`);
        if (schema.description) {
          console.log(`   説明: ${schema.description}`);
        }
      });
    }
  }

  console.log("\n✓ Explain情報の取得完了");
}

await demonstrateExplain();
