# Testing the Submit Picks Tab

## How to Test:

1. **Open your browser** and go to: `http://localhost:5173`

2. **You should see the home page** with:
   - Navigation tabs at the top
   - "Home" tab should be active (highlighted)
   - "Submit Picks" tab should be clickable (not disabled)

3. **Click the "Submit Picks" tab**:
   - The tab should become active (highlighted)
   - The content should change to show the wager placement form
   - You should see all 9 games organized by round
   - Each game should have team selection and wager amount inputs

4. **Click the "Home" tab**:
   - Should switch back to the original home page content
   - Shows the games list, leaderboard, and bracket

## Expected Behavior:

- ✅ Tabs should switch content without page navigation
- ✅ Submit Picks should show all available games
- ✅ Each game should have team selection (radio buttons)
- ✅ Each game should have wager amount input
- ✅ Real-time odds and payout calculation
- ✅ Balance tracking and validation
- ✅ Submit button for all wagers at once

## If it's still not working:

1. Check browser console for any JavaScript errors
2. Make sure the frontend is running on port 5173
3. Try refreshing the page
4. Check if there are any network errors in the browser dev tools
