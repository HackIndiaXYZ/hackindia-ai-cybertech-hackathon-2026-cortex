/**
 * DisclaimerBanner — always visible, never dismissable (DESIGN_SYSTEM §10.9)
 */
export default function DisclaimerBanner() {
  return (
    <footer className="disclaimer" role="contentinfo">
      <p>
        <strong>Guidance only.</strong> This tool provides design guidance only.
        Consult a qualified architect and refer to local building codes before
        construction.
      </p>
    </footer>
  );
}
