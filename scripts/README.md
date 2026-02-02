# Trial System Debug Scripts

This folder contains utility scripts for debugging and managing the secure trial system.

## Available Scripts

### 🔍 `debug-trials.js`

**Purpose**: View current trials in the database with detailed information

**Usage**:

```bash
node scripts/debug-trials.js
```

**What it shows**:

- Total number of trials
- Trial details (ID, session ID, device fingerprint, timestamps)
- Active vs expired status
- Time remaining for active trials
- Summary statistics

---

### 🧹 `cleanup-trials.js`

**Purpose**: Remove old, expired, or duplicate trials

**Usage**:

```bash
# Interactive mode (shows trials, requires flags)
node scripts/cleanup-trials.js

# Remove only expired trials
node scripts/cleanup-trials.js --expired-only

# Remove only duplicate trials (keeps most recent)
node scripts/cleanup-trials.js --duplicates-only

# Remove ALL trials (use with caution!)
node scripts/cleanup-trials.js --all
```

**What it does**:

- Lists trials that will be deleted
- Confirms deletion before proceeding
- Handles errors gracefully
- Provides summary of deleted trials

---

### 🧪 `test-trial-system.js`

**Purpose**: Verify the trial system is working correctly

**Usage**:

```bash
node scripts/test-trial-system.js
```

**What it tests**:

1. Database connection
2. Trial creation
3. Query by session ID
4. Query by device fingerprint
5. Trial update (expiration)
6. Trial deletion
7. Cleanup

---

### 👀 `monitor-trials.js`

**Purpose**: Monitor trials in real-time

**Usage**:

```bash
# Default 5-second interval
node scripts/monitor-trials.js

# Custom interval (e.g., 10 seconds)
node scripts/monitor-trials.js --interval=10000
```

**What it shows**:

- Live count of total, active, and expired trials
- Time remaining for active trials
- Updates automatically
- Press Ctrl+C to stop

---

### 🛡️ `test-ip-security.js`

**Purpose**: Test IP-based security and browser bypass prevention

**Usage**:

```bash
node scripts/test-ip-security.js
```

**What it tests**:

- Current IP address detection
- IP-based trial blocking logic
- Browser switching bypass prevention
- Trial creation blocking for same IP
- Security system effectiveness

---

### 🌐 `test-ip-flexibility.js`

**Purpose**: Test IP flexibility and user-friendly behavior

**Usage**:

```bash
node scripts/test-ip-flexibility.js
```

**What it tests**:

- Session persistence across IP changes
- Device-based blocking for different browsers
- Recent IP blocking (prevents abuse)
- Old IP flexibility (allows legitimate changes)
- Security matrix verification

---

### 🔧 `test-trial-bypass-fix.js`

**Purpose**: Verify that trial bypass vulnerabilities have been fixed

**Usage**:

```bash
node scripts/test-trial-bypass-fix.js
```

**What it tests**:

1. Fresh user with no previous trial (should allow trial)
2. User with expired trial ID in localStorage (should block)
3. User with session ID from previous trial (should block)
4. User with fallback IP ID (should block)
5. User with sessionStorage trial marker (should block)
6. User who cleared localStorage but not sessionStorage (should block)
7. User with multiple evidence sources (should block)

**What it validates**:

- The `hasUsedTrialBefore()` function correctly detects previous trial usage
- Multiple storage mechanisms prevent bypass attempts
- Security-first approach blocks suspicious activity
- Only completely fresh devices get trial access

---

## Common Debugging Scenarios

### 🐛 "Trial expired popup showing for all users"

1. Run `debug-trials.js` to see current trials
2. Check if trials are marked as active but actually expired
3. Use `cleanup-trials.js --expired-only` to clean up

### 🔄 "Trial restarts on page refresh"

1. Run `debug-trials.js` to check session IDs
2. Look for multiple trials with same session ID
3. Use `cleanup-trials.js --duplicates-only` to clean up

### 🧪 "Testing if system works"

1. Run `test-trial-system.js` to verify all functionality
2. Run `test-trial-bypass-fix.js` to verify bypass prevention
3. Use `monitor-trials.js` to watch real-time activity

### 🌐 "Testing IP-based security"

1. Run `test-ip-security.js` to verify IP detection and blocking
2. Check if browser switching bypass is prevented
3. Verify VPN resistance works correctly

### 🔄 "Testing IP flexibility"

1. Run `test-ip-flexibility.js` to verify user-friendly behavior
2. Check if legitimate IP changes are allowed
3. Verify abuse prevention still works

### 🗑️ "Database is cluttered"

1. Run `debug-trials.js` to see what's there
2. Use `cleanup-trials.js --expired-only` for expired trials
3. Use `cleanup-trials.js --duplicates-only` for duplicates
4. Use `cleanup-trials.js --all` to start fresh (careful!)

---

## Environment Requirements

Make sure your `.env` file contains:

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=your_endpoint
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_API_KEY=your_api_key
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id

# Collection IDs (separate collections in the same database)
NEXT_PUBLIC_APPWRITE_COLLECTION_ID_TRIALS=your_trials_collection_id
NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS=your_subscriptions_collection_id
```

**Note**:

- `NEXT_PUBLIC_APPWRITE_DATABASE_NAME` is **not needed** (only used when creating a new database, which you're not doing)
- Collection IDs use suffixes (`_TRIALS` and `_SUBSCRIPTIONS`) to distinguish between different collections
- Both collections are in the same database but serve different purposes

---

## Tips

- **Always run `debug-trials.js` first** to understand the current state
- **Use `monitor-trials.js`** when testing the frontend to see real-time changes
- **Run `test-ip-security.js`** to verify IP-based security is working
- **Run `test-ip-flexibility.js`** to verify user-friendly behavior
- **Be careful with `--all` flag** - it deletes everything!
- **Check the console output** for detailed error messages
- **Run `test-trial-system.js`** after making changes to verify everything works
- **Run `test-trial-bypass-fix.js`** to verify bypass prevention is working
- **Test with different browsers** to ensure IP-based blocking works
