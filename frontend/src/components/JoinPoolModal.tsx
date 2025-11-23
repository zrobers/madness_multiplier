import React, { useState } from "react";

type Props = {
  poolId: string;
  onClose: () => void;
  onJoined: () => void;
};

export default function JoinPoolModal({ poolId, onClose, onJoined }: Props) {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!handle) {
      setError("Handle is required to join");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/pools/${poolId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to join pool");
      onJoined();
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
        <div className="lbHeader">Join Pool</div>
        <form onSubmit={handleSubmit} style={{ padding: 12 }}>
          <div style={{ marginBottom: 8 }}>
            <label>Your handle</label>
            <input className="input" value={handle} onChange={(e) => setHandle(e.target.value)} />
          </div>

          {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Joining..." : "Join"}
            </button>
            <button className="btn secondary" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}