import Link from "next/link";

import type { Story } from "@/lib/api/stories";

/** Story tag chips, linking to each tag's topic page. */
export default function ArticleTags({ story }: { story: Story }) {
  const tags = (story?.tags ?? []).filter((t: any) => t?.name);
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2.5 py-4">
      {tags.map((t: any, i: number) => (
        <Link
          key={t.id || t.slug || i}
          href={t.slug ? `/topic/${t.slug}` : "#"}
          className="rounded-md border border-DFDFDF bg-FFFFFF px-3 py-1.5 text-14-balootamma2-500 text-333333 no-underline transition-colors hover:border-009EF9 hover:text-009EF9"
        >
          {t.name}
        </Link>
      ))}
    </div>
  );
}
