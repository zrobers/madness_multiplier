import React from "react";

/**
 * Barebones bracket placeholder.
 * This keeps the file simple for a group project.
 *
 * If you want a real, interactive bracket later, consider one of these approaches:
 * 1) react-brackets (actively maintained): simple single-elim rendering; you handle selections/state.
 * 2) brackets-manager + brackets-viewer: full tournament logic + render; more features, more setup.
 * 3) react-tournament-bracket (older/unmaintained, still works for basic single-elim).
 *
 * The skeleton below just shows round boxes so teammates can plug in a library later.
 */
export default function Bracket() {
  return (
    <div className="card">
      <div className="cardTitle">Bracket (Placeholder)</div>
      <div className="bracket">
        <div className="round">
          <div className="match">Duke vs UNC</div>
          <div className="match">Kansas vs Gonzaga</div>
          <div className="match">UConn vs Villanova</div>
          <div className="match">Arizona vs Baylor</div>
        </div>
        <div className="round">
          <div className="match">SF 1</div>
          <div className="match">SF 2</div>
        </div>
        <div className="round">
          <div className="match">Final</div>
        </div>
      </div>
      <div className="hint">Swap this component for a bracket library when ready.</div>
    </div>
  );
}
