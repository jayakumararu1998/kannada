/**
 * A block-level raw-HTML section ("dynamic html section") — lets a normal
 * builder page embed arbitrary HTML/CSS inside its column/row layout. Rendered
 * for component types like "Html" / "CustomHtml" / "RawHtml".
 */
export default function HtmlSection({
  html,
  css,
}: {
  html?: string;
  css?: string;
}) {
  if (!html && !css) return null;
  return (
    <div className="builder-html-section">
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : null}
    </div>
  );
}
