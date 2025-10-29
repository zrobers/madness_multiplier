import React from "react";

export default function HowItWorks() {
  return (
    <div className="container">
      <div className="card">
        <div className="cardTitle">How It Works</div>
        <div style={{ padding: "20px" }}>
          
          {/* Introduction */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "16px", color: "#1f2937" }}>
              Welcome to Madness Multiplier
            </h2>
            <p style={{ fontSize: "1rem", lineHeight: "1.6", color: "#4b5563", marginBottom: "16px" }}>
              Madness Multiplier reimagines March Madness excitement through a structured, point-based wagering system. 
              Place wagers with fake money on NCAA tournament games, compete with friends, and climb the leaderboards!
            </p>
          </section>

          {/* Getting Started */}
          <section style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "16px", color: "#1f2937" }}>
              Getting Started
            </h3>
            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                <h4 style={{ fontWeight: "600", marginBottom: "8px", color: "#1f2937" }}>1. Create Account</h4>
                <p style={{ fontSize: "0.9rem", color: "#6b7280", margin: 0 }}>
                  Sign up with a unique username and handle to manage your profile and balance.
                </p>
              </div>
              <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                <h4 style={{ fontWeight: "600", marginBottom: "8px", color: "#1f2937" }}>2. Join a Pool</h4>
                <p style={{ fontSize: "0.9rem", color: "#6b7280", margin: 0 }}>
                  Enter pools to compete against friends and family. Each pool starts with 1,000 points.
                </p>
              </div>
              <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                <h4 style={{ fontWeight: "600", marginBottom: "8px", color: "#1f2937" }}>3. Place Wagers</h4>
                <p style={{ fontSize: "0.9rem", color: "#6b7280", margin: 0 }}>
                  Bet on tournament games with odds calculated automatically based on team seedings.
                </p>
              </div>
            </div>
          </section>

          {/* Wagering System */}
          <section style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "16px", color: "#1f2937" }}>
              The Wagering System
            </h3>
            
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ fontWeight: "600", marginBottom: "12px", color: "#1f2937" }}>How Odds Work</h4>
              <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#4b5563", marginBottom: "12px" }}>
                Odds are calculated automatically using the formula: <strong>Odds = 1 + (Your Team's Seed ÷ Opponent's Seed)</strong>
              </p>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                <div style={{ padding: "12px", backgroundColor: "#f0fdf4", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                  <div style={{ fontWeight: "600", color: "#166534", fontSize: "0.9rem" }}>#1 Seed vs #16 Seed</div>
                  <div style={{ fontSize: "0.85rem", color: "#15803d" }}>Odds: 1.06x</div>
                </div>
                <div style={{ padding: "12px", backgroundColor: "#fef3c7", borderRadius: "6px", border: "1px solid #fde68a" }}>
                  <div style={{ fontWeight: "600", color: "#92400e", fontSize: "0.9rem" }}>#8 Seed vs #9 Seed</div>
                  <div style={{ fontSize: "0.85rem", color: "#b45309" }}>Odds: 1.89x</div>
                </div>
                <div style={{ padding: "12px", backgroundColor: "#fef2f2", borderRadius: "6px", border: "1px solid #fecaca" }}>
                  <div style={{ fontWeight: "600", color: "#991b1b", fontSize: "0.9rem" }}>#16 Seed vs #1 Seed</div>
                  <div style={{ fontSize: "0.85rem", color: "#dc2626" }}>Odds: 17.0x</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ fontWeight: "600", marginBottom: "12px", color: "#1f2937" }}>Payout Calculation</h4>
              <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#4b5563", marginBottom: "8px" }}>
                If you win, you receive: <strong>Stake × Odds</strong>
              </p>
              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: "0.9rem", color: "#4b5563" }}>
                  <strong>Example:</strong> Bet 100 points on a #8 seed (1.89x odds) beating a #9 seed
                </div>
                <div style={{ fontSize: "0.9rem", color: "#4b5563", marginTop: "4px" }}>
                  <strong>Win:</strong> Receive 189 points (100 × 1.89) = +89 profit
                </div>
                <div style={{ fontSize: "0.9rem", color: "#4b5563" }}>
                  <strong>Loss:</strong> Lose 100 points
                </div>
              </div>
            </div>
          </section>

          {/* Tournament Structure */}
          <section style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "16px", color: "#1f2937" }}>
              Tournament Structure
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e5e7eb", textAlign: "center" }}>
                <div style={{ fontWeight: "600", color: "#1f2937", fontSize: "0.9rem" }}>Round of 64</div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>32 games</div>
              </div>
              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e5e7eb", textAlign: "center" }}>
                <div style={{ fontWeight: "600", color: "#1f2937", fontSize: "0.9rem" }}>Round of 32</div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>16 games</div>
              </div>
              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e5e7eb", textAlign: "center" }}>
                <div style={{ fontWeight: "600", color: "#1f2937", fontSize: "0.9rem" }}>Sweet 16</div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>8 games</div>
              </div>
              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e5e7eb", textAlign: "center" }}>
                <div style={{ fontWeight: "600", color: "#1f2937", fontSize: "0.9rem" }}>Elite Eight</div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>4 games</div>
              </div>
              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e5e7eb", textAlign: "center" }}>
                <div style={{ fontWeight: "600", color: "#1f2937", fontSize: "0.9rem" }}>Final Four</div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>2 games</div>
              </div>
              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e5e7eb", textAlign: "center" }}>
                <div style={{ fontWeight: "600", color: "#1f2937", fontSize: "0.9rem" }}>Championship</div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>1 game</div>
              </div>
            </div>
          </section>

          {/* Pool System */}
          <section style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "16px", color: "#1f2937" }}>
              Pool System
            </h3>
            
            <div style={{ marginBottom: "16px" }}>
              <h4 style={{ fontWeight: "600", marginBottom: "8px", color: "#1f2937" }}>Starting Balance</h4>
              <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#4b5563", marginBottom: "12px" }}>
                Every player starts with <strong>1,000 points</strong> in each pool they join.
              </p>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <h4 style={{ fontWeight: "600", marginBottom: "8px", color: "#1f2937" }}>Multiple Bets</h4>
              <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#4b5563", marginBottom: "12px" }}>
                You can place multiple wagers on the same game, allowing for strategic betting strategies.
              </p>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <h4 style={{ fontWeight: "600", marginBottom: "8px", color: "#1f2937" }}>Unbet Penalty</h4>
              <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#4b5563", marginBottom: "12px" }}>
                If you don't place any bets in a round, you'll lose <strong>20% of your current balance</strong> as a penalty.
              </p>
            </div>
          </section>

          {/* Strategy Tips */}
          <section style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "16px", color: "#1f2937" }}>
              Strategy Tips
            </h3>
            
            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ padding: "12px", backgroundColor: "#eff6ff", borderRadius: "6px", border: "1px solid #bfdbfe" }}>
                <div style={{ fontWeight: "600", color: "#1e40af", fontSize: "0.9rem", marginBottom: "4px" }}>
                  🎯 High-Reward Upsets
                </div>
                <div style={{ fontSize: "0.85rem", color: "#1e3a8a" }}>
                  Betting on underdogs can yield massive payouts, but comes with higher risk.
                </div>
              </div>
              
              <div style={{ padding: "12px", backgroundColor: "#f0fdf4", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                <div style={{ fontWeight: "600", color: "#166534", fontSize: "0.9rem", marginBottom: "4px" }}>
                  🛡️ Safe Bets
                </div>
                <div style={{ fontSize: "0.85rem", color: "#15803d" }}>
                  Higher seeds offer lower risk but smaller returns. Good for preserving balance.
                </div>
              </div>
              
              <div style={{ padding: "12px", backgroundColor: "#fef3c7", borderRadius: "6px", border: "1px solid #fde68a" }}>
                <div style={{ fontWeight: "600", color: "#92400e", fontSize: "0.9rem", marginBottom: "4px" }}>
                  ⚖️ Balance Risk
                </div>
                <div style={{ fontSize: "0.85rem", color: "#b45309" }}>
                  Mix safe bets with calculated risks to maximize your chances of climbing the leaderboard.
                </div>
              </div>
              
              <div style={{ padding: "12px", backgroundColor: "#f3e8ff", borderRadius: "6px", border: "1px solid #d8b4fe" }}>
                <div style={{ fontWeight: "600", color: "#7c3aed", fontSize: "0.9rem", marginBottom: "4px" }}>
                  📊 Track Trends
                </div>
                <div style={{ fontSize: "0.85rem", color: "#6b21a8" }}>
                  Monitor which seeds perform well historically and adjust your strategy accordingly.
                </div>
              </div>
            </div>
          </section>

          {/* Live Features */}
          <section style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "16px", color: "#1f2937" }}>
              Live Features
            </h3>
            
            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                <div style={{ fontWeight: "600", color: "#1f2937", fontSize: "0.9rem", marginBottom: "4px" }}>
                  📊 Real-Time Leaderboards
                </div>
                <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                  Live leaderboards update automatically as games finish and wagers are settled.
                </div>
              </div>
              
              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                <div style={{ fontWeight: "600", color: "#1f2937", fontSize: "0.9rem", marginBottom: "4px" }}>
                  🏀 Live Score Updates
                </div>
                <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                  Game scores and results are updated in real-time from ESPN's API.
                </div>
              </div>
              
              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                <div style={{ fontWeight: "600", color: "#1f2937", fontSize: "0.9rem", marginBottom: "4px" }}>
                  🎯 Interactive Bracket
                </div>
                <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                  Visualize the tournament bracket with your wagers highlighted.
                </div>
              </div>
            </div>
          </section>

          {/* Rules Summary */}
          <section style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "16px", color: "#1f2937" }}>
              Key Rules
            </h3>
            
            <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.9rem", lineHeight: "1.6", color: "#4b5563" }}>
                <li style={{ marginBottom: "8px" }}>All wagers use fake money - no real money involved</li>
                <li style={{ marginBottom: "8px" }}>Odds are calculated automatically based on team seedings</li>
                <li style={{ marginBottom: "8px" }}>You can place multiple bets on the same game</li>
                <li style={{ marginBottom: "8px" }}>Wagers must be placed before the game starts</li>
                <li style={{ marginBottom: "8px" }}>Unbet penalty: 20% of balance lost if no bets placed in a round</li>
                <li style={{ marginBottom: "8px" }}>Leaderboards rank players by total points earned</li>
                <li style={{ marginBottom: "8px" }}>Pools can be private (friends only) or public</li>
                <li style={{ marginBottom: "0" }}>All transactions are tracked in your ledger</li>
              </ul>
            </div>
          </section>

          {/* Footer */}
          <div style={{ textAlign: "center", padding: "20px 0", borderTop: "1px solid #e5e7eb", marginTop: "32px" }}>
            <p style={{ fontSize: "0.9rem", color: "#6b7280", margin: 0 }}>
              Ready to start? Head to the <strong>Submit Picks</strong> tab to place your first wager!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
