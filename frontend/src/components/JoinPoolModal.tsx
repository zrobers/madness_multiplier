import React, { useEffect, useState } from "react";

type Props = {
  poolId: string;
  onClose: () => void;
  onJoined: () => void;
  currentUser?: string;
  userId?: string;
};

export default function JoinPoolModal({ poolId, onClose, onJoined, currentUser, userId }: Props) {
  const [handle, setHandle] = useState(currentUser ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    if (currentUser) setHandle(currentUser);
  }, [currentUser]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!handle) {
      setError("Handle is required to join");
      return;
    }
    setLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (userId) {
        headers["X-User-Id"] = userId;
      }
      
      const res = await fetch(`http://localhost:4000/api/pools/${poolId}/join`, {
        method: "POST",
        headers,
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="lbHeader" style={{ margin: 0, padding: 12 }}>Join Pool</div>
          <button className="close-x" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 12 }}>
          {currentUser ? (
            <div style={{ marginBottom: 8 }}>
              <label>Your handle</label>
              <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 6 }}>{currentUser}</div>
            </div>
          ) : (
            <div style={{ marginBottom: 8 }}>
              <label>Your handle</label>
              <input className="input" value={handle} onChange={(e) => setHandle(e.target.value)} />
            </div>
          )}

          {error && <div style={{ color: "red" }}>{error}</div>}

          <div style={{ marginTop: 8 }}>
            <button className="btn" disabled={loading} type="submit">
              {loading ? "Joining..." : "Join"}
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