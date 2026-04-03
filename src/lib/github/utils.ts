/**
 * 効率的に Map から上位 K 件を抽出するヘルパー関数
 * 配列の作成とソートを最小限に抑えることでパフォーマンスを向上させます
 */
export function getTopK(map: Map<string, number>, k: number = 10): { name: string; count: number }[] {
  const top: { name: string; count: number }[] = [];
  for (const [name, count] of map.entries()) {
    if (top.length < k) {
      top.push({ name, count });
      top.sort((a, b) => b.count - a.count);
    } else if (count > top[k - 1].count) {
      let i = k - 2;
      while (i >= 0 && top[i].count < count) {
        top[i + 1] = top[i];
        i--;
      }
      top[i + 1] = { name, count };
    }
  }
  return top;
}

/**
 * 結果を処理し、エラーがあれば記録するヘルパー関数
 */
export function processResult<T>(
  result: PromiseSettledResult<T>,
  section: string,
  errors: { section: string; message: string }[]
): T | null {
  if (result.status === "fulfilled") {
    return result.value;
  }
  errors.push({ section, message: result.reason?.message ?? String(result.reason ?? "Unknown error") });
  return null;
}

export function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572A5",
    Java: "#b07219",
    Go: "#00ADD8",
    Rust: "#dea584",
    "C++": "#f34b7d",
    C: "#555555",
    "C#": "#178600",
    Ruby: "#701516",
    PHP: "#4F5D95",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Dart: "#00B4AB",
    Scala: "#c22d40",
    Shell: "#89e051",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Vue: "#41b883",
    Svelte: "#ff3e00",
    Lua: "#000080",
    R: "#198CE7",
    Elixir: "#6e4a7e",
    Haskell: "#5e5086",
    Clojure: "#db5855",
    Erlang: "#B83998",
    Zig: "#ec915c",
    Nim: "#ffc200",
    OCaml: "#3be133",
    Julia: "#a270ba",
    Perl: "#0298c3",
    Jupyter: "#DA5B0B",
    "Jupyter Notebook": "#DA5B0B",
    Dockerfile: "#384d54",
    Makefile: "#427819",
    HCL: "#844FBA",
    Nix: "#7e7eff",
  };
  return colors[language] ?? "#8b949e";
}
