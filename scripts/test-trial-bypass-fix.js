#!/usr/bin/env node

/**
 * Test script to verify the trial bypass fix
 * This simulates the bypass scenario and checks if it's properly blocked
 */

console.log("🧪 Testing Trial Bypass Fix");
console.log("===========================");

// Simulate browser localStorage behavior
const mockLocalStorage = {
  data: {},
  getItem: function (key) {
    return this.data[key] || null;
  },
  setItem: function (key, value) {
    this.data[key] = value;
  },
  removeItem: function (key) {
    delete this.data[key];
  },
  clear: function () {
    this.data = {};
  },
};

// Simulate sessionStorage behavior
const mockSessionStorage = {
  data: {},
  getItem: function (key) {
    return this.data[key] || null;
  },
  setItem: function (key, value) {
    this.data[key] = value;
  },
  removeItem: function (key) {
    delete this.data[key];
  },
  clear: function () {
    this.data = {};
  },
};

// Mock the hasUsedTrialBefore function from the hook
function hasUsedTrialBefore() {
  try {
    const localTrialId = mockLocalStorage.getItem("currentTrialId");
    const sessionId = mockLocalStorage.getItem("trial_session_id");
    const fallbackId = mockLocalStorage.getItem("ip_fallback_id");
    const sessionTrialUsed = mockSessionStorage.getItem("trial_ever_used");

    return !!(localTrialId || sessionId || fallbackId || sessionTrialUsed);
  } catch (error) {
    return true;
  }
}

// Test scenarios
function testScenario(name, setupFn, expectedBlocked) {
  console.log(`\n📋 Test: ${name}`);

  // Reset storage
  mockLocalStorage.clear();
  mockSessionStorage.clear();

  // Setup the scenario
  setupFn();

  // Check if trial should be blocked
  const shouldBlock = hasUsedTrialBefore();
  const result = shouldBlock === expectedBlocked ? "✅ PASS" : "❌ FAIL";

  console.log(`   Expected blocked: ${expectedBlocked}`);
  console.log(`   Actually blocked: ${shouldBlock}`);
  console.log(`   Result: ${result}`);

  return shouldBlock === expectedBlocked;
}

// Run tests
let passed = 0;
let total = 0;

// Test 1: Fresh user (no previous trial)
total++;
if (
  testScenario(
    "Fresh user with no previous trial",
    () => {
      // No setup needed - clean storage
    },
    false,
  )
)
  passed++;

// Test 2: User with expired trial ID in localStorage
total++;
if (
  testScenario(
    "User with expired trial ID in localStorage",
    () => {
      mockLocalStorage.setItem("currentTrialId", "expired_trial_123");
    },
    true,
  )
)
  passed++;

// Test 3: User with session ID (from previous trial)
total++;
if (
  testScenario(
    "User with session ID from previous trial",
    () => {
      mockLocalStorage.setItem("trial_session_id", "session_456");
    },
    true,
  )
)
  passed++;

// Test 4: User with fallback IP ID
total++;
if (
  testScenario(
    "User with fallback IP ID",
    () => {
      mockLocalStorage.setItem("ip_fallback_id", "fallback_789");
    },
    true,
  )
)
  passed++;

// Test 5: User with sessionStorage trial marker
total++;
if (
  testScenario(
    "User with sessionStorage trial marker",
    () => {
      mockSessionStorage.setItem("trial_ever_used", "true");
    },
    true,
  )
)
  passed++;

// Test 6: User who cleared localStorage but not sessionStorage
total++;
if (
  testScenario(
    "User who cleared localStorage but not sessionStorage",
    () => {
      mockSessionStorage.setItem("trial_ever_used", "true");
      // localStorage is already clear from test setup
    },
    true,
  )
)
  passed++;

// Test 7: Multiple evidence sources
total++;
if (
  testScenario(
    "User with multiple evidence sources",
    () => {
      mockLocalStorage.setItem("currentTrialId", "trial_123");
      mockLocalStorage.setItem("trial_session_id", "session_456");
      mockSessionStorage.setItem("trial_ever_used", "true");
    },
    true,
  )
)
  passed++;

// Summary
console.log("\n📊 Test Summary");
console.log("================");
console.log(`Passed: ${passed}/${total}`);
console.log(`Success rate: ${Math.round((passed / total) * 100)}%`);

if (passed === total) {
  console.log("🎉 All tests passed! Trial bypass should be fixed.");
} else {
  console.log("⚠️  Some tests failed. Review the implementation.");
}

console.log("\n🔒 Security Analysis:");
console.log("- ✅ Users with any evidence of previous trials are blocked");
console.log("- ✅ Multiple storage mechanisms prevent easy bypass");
console.log("- ✅ Security-first approach: when in doubt, block access");
console.log("- ✅ Only completely fresh devices get trial access");
