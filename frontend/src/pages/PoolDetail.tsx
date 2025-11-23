// src/components/PoolDetail.tsx
import React, { useEffect, useState } from "react";

type PoolInfo = {
  pool_id: string;
  name: string;
  owner_handle: string;
  season_year: number;
  initial_points: number;
  unbet_penalty_pct: number;
  allow_multi_bets: boolean;
  created_at: string;
};

type Member = {
  user_id: number;
  handle: string;
  joined_at: string;
};

type Props = {
  poolId: string;
  onBack: () => void;
};

export default function PoolDetail({ poolId, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!poolId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/pools/${encodeURIComponent(poolId)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to load pool (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        setPool(data.pool);
        setMembers(data.members || []);
      })
      .catch((err: any) => {
        console.error("PoolDetail fetch error", err);
        setError(err.message || "Unknown error");
      })
      .finally(() => setLoading(false));
  }, [poolId]);

  if (loading) return <div>Loading pool details...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;
  if (!pool) return <div>Pool not found</div>;

  return (
    <div className="card pool-detail" role="region" aria-labelledby={`pool-${pool.pool_id}-title`}>
    <header className="pool-detail-header">
        <div>
        <h2 id={`pool-${pool.pool_id}-title`} className="pool-detail-title" style={{ margin: 0 }}>{pool.name}</h2>
        <div className="pool-meta" aria-hidden>
            Owner: <strong>{pool.owner_handle}</strong> • Season: <span>{pool.season_year}</span>
        </div>
        </div>

        <div className="pool-actions">
        <button className="btn secondary" onClick={onBack}>Back</button>
        </div>
    </header>

      <section className="pool-settings" aria-labelledby="pool-settings-heading" style={{ marginTop: 12 }}>
        <h3 id="pool-settings-heading">Pool settings</h3>
        <dl className="settings-list" style={{ maxWidth: 760 }}>
            <div className="setting">
            <dt className="setting-key">Initial points</dt>
            <dd className="setting-value">{pool.initial_points}</dd>
            </div>

            <div className="setting">
            <dt className="setting-key">Unbet penalty %</dt>
            <dd className="setting-value">{pool.unbet_penalty_pct}</dd>
            </div>

            <div className="setting">
            <dt className="setting-key">Allow multi-bets</dt>
            <dd className="setting-value">{pool.allow_multi_bets ? "Yes" : "No"}</dd>
            </div>

            <div className="setting">
            <dt className="setting-key">Created</dt>
            <dd className="setting-value">
                <time dateTime={pool.created_at}>{new Date(pool.created_at).toLocaleString()}</time>
            </dd>
            </div>
        </dl>
    </section>


      <section className="members-section" aria-labelledby="members-heading" style={{ marginTop: 18 }}>
        <h3 id="members-heading">Members <span className="muted">({members.length})</span></h3>

        {members.length ? (
            <ul className="members-list" style={{ maxWidth: 760 }}>
            {members.map((m, i) => (
                <li key={m.user_id} className="member-row" role="listitem">
                <div className="member-left">
                    <span className="avatar" aria-hidden>
                    {m.handle.slice(0,2).toUpperCase()}
                    </span>
                    <span className="member-handle">{m.handle}</span>
                </div>

                <div className="member-right">
                    <time className="member-joined" dateTime={m.joined_at}>
                    {new Date(m.joined_at).toLocaleString()}
                    </time>
                </div>
                </li>
            ))}
            </ul>
        ) : (
            <div className="members-empty">No members yet</div>
        )}
        </section>

    </div>
  );
}