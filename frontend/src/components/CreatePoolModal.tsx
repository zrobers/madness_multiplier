import React, { useEffect, useState } from "react";

type Props = {
  onClose: () => void;
  onCreated: (pool: any) => void;
  currentUser ?: string;
};

export default function CreatePoolModal({ onClose, onCreated, currentUser }: Props) {
  const [name, setName] = useState("");
  const [seasonYear, setSeasonYear] = useState<number>(new Date().getFullYear());
  const [ownerHandle, setOwnerHandle] = useState(currentUser ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) setOwnerHandle(currentUser);
  }, [currentUser]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !ownerHandle) {
      setError("Name and your handle are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          season_year: seasonYear,
          owner_handle: ownerHandle,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to create pool");
      onCreated(body.pool);
      onClose();
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal card">
        <div className="lbHeader">Create Pool</div>
        <form onSubmit={handleSubmit} style={{ padding: 12 }}>
          <div style={{ marginBottom: 8 }}>
            <label>Pool name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Season year</label>
            <input
              className="input"
              type="number"
              value={seasonYear}
              onChange={(e) => setSeasonYear(Number(e.target.value))}
            />
          </div>

          {/* use currentUser when available; otherwise show field */}
          {currentUser ? (
            <div style={{ marginBottom: 8 }}>
              <label>Owner</label>
              <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 6 }}>{currentUser}</div>
            </div>
          ) : (
            <div style={{ marginBottom: 8 }}>
              <label>Your handle</label>
              <input className="input" value={ownerHandle} onChange={(e) => setOwnerHandle(e.target.value)} />
            </div>
          )}

          {error && <div style={{ color: "red" }}>{error}</div>}

          <div style={{ marginTop: 8 }}>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </button>
            <button className="btn secondary" type="button" onClick={onClose} style={{ marginLeft: 8 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}