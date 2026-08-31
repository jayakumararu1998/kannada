import { stripTags } from "@/lib/api/article-html";

/** Parse one CSV line into cells (handles simple quoted fields). */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/**
 * Normalise a `data`/table element's `data` into a 2-D string grid. Quintype
 * sends either an array of rows (older format) or a CSV blob
 * `{ content, content-type: "csv" }` — handle both.
 */
export function tableRows(data: any): string[][] {
  if (Array.isArray(data)) {
    return data.map((row) =>
      (Array.isArray(row) ? row : [row]).map((cell) =>
        typeof cell === "string" ? stripTags(cell) : String(cell ?? ""),
      ),
    );
  }
  const csv = typeof data?.content === "string" ? data.content : "";
  return csv
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((line: string) => line.trim() !== "")
    .map((line: string) => parseCsvLine(line));
}
