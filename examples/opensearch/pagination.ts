/**
 * ページネーション検索の例
 * 
 * 実行方法:
 * deno run --allow-net examples/opensearch/pagination.ts
 */

import { searchOpenSearch } from "../../mod.ts";

async function searchWithPagination(query: string, pageSize: number = 10) {
  console.log(`検索語: "${query}"`);
  console.log("=".repeat(50));
  
  // 最初のページを取得
  const firstResult = await searchOpenSearch({
    q: query,
    count: pageSize,
    start: 0,
  });
  
  if (firstResult.isErr()) {
    console.error("検索エラー:", firstResult.error.message);
    return;
  }
  
  const totalPages = firstResult.value.pagination.totalPages;
  console.log(`総件数: ${firstResult.value.pagination.totalResults}件`);
  console.log(`総ページ数: ${totalPages}ページ`);
  console.log("");
  
  // 最初の3ページを表示
  const maxPages = Math.min(3, totalPages);
  
  for (let page = 1; page <= maxPages; page++) {
    const start = (page - 1) * pageSize;
    
    const result = await searchOpenSearch({
      q: query,
      count: pageSize,
      start,
    });
    
    if (result.isErr()) {
      console.error(`ページ ${page} の取得エラー:`, result.error.message);
      continue;
    }
    
    const { items, pagination } = result.value;
    
    console.log(`--- ページ ${pagination.currentPage} ---`);
    items.forEach((item, index) => {
      const itemNumber = start + index + 1;
      console.log(`${itemNumber}. ${item.title}`);
      if (item.authors) {
        console.log(`    著者: ${item.authors.join(", ")}`);
      }
    });
    console.log("");
    
    // API制限を避けるため少し待機
    if (page < maxPages) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  if (totalPages > 3) {
    console.log(`... 他 ${totalPages - 3} ページあります`);
  }
}

// 文学作品を検索
await searchWithPagination("宮沢賢治", 5);