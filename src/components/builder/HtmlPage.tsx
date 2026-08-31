/**
 * Renders a static/HTML page from raw markup carried in the page JSON
 * (`page.html` + optional `page.css`). The HTML originates from the trusted
 * builder/store, so `dangerouslySetInnerHTML` is intentional here.
 */
export default function HtmlPage({
  html,
  css,
  className,
}: {
  html: string;
  css?: string;
  className?: string;
}) {
  return (
    <div className={className ?? "builder-html-page"}>
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
