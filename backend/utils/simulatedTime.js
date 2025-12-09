// Shared simulated current time for the application
// This simulates that we're on March 22, 2024 at midnight UTC
// This is after Round of 64 (March 20-21) and before Round of 32 (March 22-23)
export const SIMULATED_CURRENT_TIME = new Date('2024-03-22T00:00:00Z');

// Helper function to get the simulated current time
export function getCurrentTime() {
  return SIMULATED_CURRENT_TIME;
}

