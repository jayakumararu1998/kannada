/**
 * Renders one or more schema.org JSON-LD objects as separate
 * <script type="application/ld+json"> tags. Server component; the JSON is
 * escaped (`<` → <) to keep it safe inside a script element.
 */

type JsonLd = Record<string, unknown>;

function idFor(schema: JsonLd, i: number): string {
  const type = String(schema["@type"] ?? "schema").toLowerCase();
  return `kp-${type}-schema-${i}`;
}

export default function SchemaMarkup({
  schema,
}: {
  schema: JsonLd | JsonLd[];
}) {
  const list = Array.isArray(schema) ? schema : [schema];
  return (
    <>
      {list.filter(Boolean).map((s, i) => (
        <script
          key={idFor(s, i)}
          id={idFor(s, i)}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(s).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
