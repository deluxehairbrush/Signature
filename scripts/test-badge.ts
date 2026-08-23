import { computeReputationScore, type Deal } from "../lib/ai";

// Test the badge generation logic
function testBadgeLogic() {
  console.log("Testing badge generation logic...\n");

  // Test case 1: No deals (no data)
  const noDeals: Deal[] = [];
  const noDataScore = computeReputationScore(noDeals);
  console.log("No deals:", noDataScore);
  console.log("Expected: score: 0, dealCount: 0");
  console.log("Color: gray (#9CA3AF)\n");

  // Test case 2: High score user
  const highScoreDeals: Deal[] = [
    { status: "completed", wasPaidOnTime: true, rating: 5 },
    { status: "completed", wasPaidOnTime: true, rating: 5 },
    { status: "completed", wasPaidOnTime: true, rating: 4 },
  ];
  const highScore = computeReputationScore(highScoreDeals);
  console.log("High score user:", highScore);
  console.log("Expected: score >= 70, dealCount: 3");
  console.log("Color: green (#10B981)\n");

  // Test case 3: Medium score user
  const mediumScoreDeals: Deal[] = [
    { status: "completed", wasPaidOnTime: true, rating: 3 },
    { status: "completed", wasPaidOnTime: false, rating: 3 },
  ];
  const mediumScore = computeReputationScore(mediumScoreDeals);
  console.log("Medium score user:", mediumScore);
  console.log("Expected: score 40-69, dealCount: 2");
  console.log("Color: yellow (#F59E0B)\n");

  // Test case 4: Low score user
  const lowScoreDeals: Deal[] = [
    { status: "completed", wasPaidOnTime: false, rating: 1 },
  ];
  const lowScore = computeReputationScore(lowScoreDeals);
  console.log("Low score user:", lowScore);
  console.log("Expected: score < 40, dealCount: 1");
  console.log("Color: gray (#9CA3AF)\n");

  console.log("Badge logic tests completed!");
}

// Run the tests
testBadgeLogic();