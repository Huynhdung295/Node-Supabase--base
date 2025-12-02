# Email Service Setup Guide

## Resend Configuration (FREE 3000 emails/month)

### Step 1: Create Resend Account
1. Go to https://resend.com
2. Sign up for a free account
3. Verify your email

### Step 2: Get API Key
1. Navigate to https://resend.com/api-keys
2. Click "Create API Key"
3. Name it (e.g., "Ecom-Store Dev")
4. Copy the API key (starts with `re_`)

### Step 3: Configure .env
Add to your `.env` file:
```bash
RESEND_API_KEY=re_your_actual_api_key_here
EMAIL_FROM=onboarding@resend.dev  # For testing
```

### Step 4: (Optional) Add Custom Domain
For production, add your own domain:
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Add DNS records (provided by Resend)
4. Once verified, update `EMAIL_FROM`:
   ```bash
   EMAIL_FROM=noreply@yourdomain.com
   ```

### Testing
The email service will automatically send verification codes when:
- User creates a claim → 8-char code (5 min expiry)
- User resends code → New 8-char code (5 min expiry)
- CS sends verification → 8-char code (2 hour expiry)

### Without Configuration
If `RESEND_API_KEY` is not set:
- System will log verification codes to console
- No emails will be sent
- Useful for local testing without email service
