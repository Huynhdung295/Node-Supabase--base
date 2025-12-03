# Balance Deduction Fix Documentation

## Problem
When users claim (withdraw) their commissions and CS approves/transfers the claim, the balance was not being deducted. Users could see the same balance even after successful withdrawal.

## Root Cause
The `getBalance` function in `transactionService.js` only counted claims with status `['pending', 'approved']` when calculating `claimed_amount`. 

When CS updated a claim to `transferred`, that claim was no longer counted, causing the balance to incorrectly show as available again.

## Solution

### Updated Balance Calculation
Changed the claim statuses that count towards `claimed_amount`:

**Before:**
```javascript
.in('status', ['pending', 'approved'])
```

**After:**
```javascript
.in('status', ['pending', 'email_verified', 'verified', 'approved', 'transferred'])
```

### Explanation
All claims that represent money leaving the user's account should be deducted:
- `pending`: User verified email, waiting for CS review
- `email_verified`: CS sent secondary verification
- `verified`: CS manually verified
- `approved`: CS approved payment (legacy status)
- `transferred`: Payment completed

**Excluded statuses:**
- `wait_email_confirm`: User hasn't verified yet, can be cancelled
- `verify_failed`: Failed verification, cancelled
- `rejected`: CS rejected, money stays with user

### Available Balance Formula
```javascript
available_balance = finalized_commission - claimed_amount
```

Only finalized commissions can be claimed. Pending commissions are shown but not available for withdrawal.

## Testing Checklist
- [ ] Create claim → Balance decreases
- [ ] Verify email → Balance stays decreased
- [ ] CS approves → Balance stays decreased
- [ ] CS marks as transferred → Balance stays decreased
- [ ] Claim rejected → Balance increases back
- [ ] Multiple claims → All deducted correctly
