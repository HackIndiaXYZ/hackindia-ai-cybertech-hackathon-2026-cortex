/**
 * DisclaimerBanner - always visible, never dismissable
 */
export default function DisclaimerBanner() {
  return (
    <aside className="disclaimer" role="note" aria-label="Guidance disclaimer">
      <p>
        <strong>Guidance only.</strong> This tool provides design guidance only.
        Consult a qualified architect and refer to local building codes before
        construction.
      </p>
    </aside>
  );
}
