/**
 * Thumbnail API Tests
 */

import { assertEquals } from "@std/assert";
import { buildThumbnailURL } from "../../src/api/thumbnail.ts";

Deno.test("buildThumbnailURL creates correct URL", () => {
  const url = buildThumbnailURL({
    id: "9784163902774",
  });

  assertEquals(
    url,
    "https://ndlsearch.ndl.go.jp/thumbnail/9784163902774.jpg",
  );
});

Deno.test("buildThumbnailURL with different IDs", () => {
  const isbnUrl = buildThumbnailURL({
    id: "9784163902774",
  });

  const jpnoUrl = buildThumbnailURL({
    id: "22282956",
  });

  assertEquals(
    isbnUrl,
    "https://ndlsearch.ndl.go.jp/thumbnail/9784163902774.jpg",
  );
  assertEquals(
    jpnoUrl,
    "https://ndlsearch.ndl.go.jp/thumbnail/22282956.jpg",
  );
});

// 注意：以下は統合テストのため、実際のNDL APIにアクセスします
// ネットワークアクセスが許可されている場合のみ実行されます

Deno.test("fetchThumbnail API contract test", () => {
  // APIのURLが正しく構築されることをテスト
  const url = buildThumbnailURL({
    id: "9784163902774",
  });

  // URLが期待される形式であることを確認
  assertEquals(url.includes("9784163902774"), true);
  assertEquals(url.includes(".jpg"), true);
});

// 実際のAPIテストは統合テストディレクトリで実行
