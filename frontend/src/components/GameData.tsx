import React from "react";
import { gamesRoundOf64 } from "../data/mock";

export default function GameData() {
  return (
    <div className="card">
      <div className="cardTitle">NCAA — Round of 64 (Sample)</div>
      <div className="gameStrip" role="list">
        {gamesRoundOf64.map((g) => (
          <div className="gameTile" key={g.id} role="listitem">
            <div className="meta">
              <div className="time">{g.tipET}</div>
              <div className="net">{g.network}</div>
            </div>
            <div className="teams">
              <TeamRow t={g.away} />
              <TeamRow t={g.home} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamRow({
  t,
}: {
  t: { seed: number; name: string; record?: string; abbr?: string };
}) {
  return (
    <div className="teamRow">
      <div className="teamMark">
        {t.abbr ? (
          <span className="abbr">{t.abbr}</span>
        ) : (
          <span className="seed">{t.seed}</span>
        )}
      </div>
      <div className="teamName">{t.name}</div>
      <div className="teamRec">{t.record ?? ""}</div>
    </div>
  );
}