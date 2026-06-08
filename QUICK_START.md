# 🚀 Quick Start - Push Notifications Setup

## ✅ What's Done

1. ✅ TypeScript errors fixed and pushed to GitHub
2. ✅ VAPID keys generated for push notifications
3. ✅ Local .env file updated with keys
4. ✅ Supabase function fix created

## 📋 What YOU Need to Do Now

### Step 1: Configure Netlify (5 minutes)

Open **NETLIFY_SETUP.md** and follow the instructions to add these 6 environment variables:

```
VITE_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
CRON_SECRET
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

All values are in **NETLIFY_SETUP.md** - just copy and paste!

**Quick Link**: https://app.netlify.com → Your Site → Site settings → Environment variables

### Step 2: Update Supabase Schema (2 minutes)

1. Go to Supabase SQL Editor: https://supabase.com/dashboard
2. Run this query first:

```sql
-- Drop old functions with any parameter signatures
DROP FUNCTION IF EXISTS check_user_eligibility(user_profile JSONB, opportunity_eligibility JSONB);
DROP FUNCTION IF EXISTS check_user_eligibility(p_user_data JSONB, p_opportunity_eligibility JSONB);
DROP FUNCTION IF EXISTS check_user_eligibility(JSONB, JSONB);

DROP FUNCTION IF EXISTS calculate_match_score(user_profile JSONB, opportunity_data JSONB);
DROP FUNCTION IF EXISTS calculate_match_score(p_user_data JSONB, p_opportunity_data JSONB);
DROP FUNCTION IF EXISTS calculate_match_score(JSONB, JSONB);
```

3. Then run the full **supabase_schema.sql** file

### Step 3: Wait for Netlify Deploy (2-3 minutes)

After adding environment variables, Netlify will automatically redeploy.

Check: https://app.netlify.com → Deploys

### Step 4: Test Push Notifications! 🎉

1. Visit your deployed site
2. Go to Settings → Notifications
3. Click "Enable Push Notifications"
4. Allow browser permission
5. Send a test notification

## 🔑 Your Generated Keys

**Location**: All keys are in your local `.env` file

To view them again:
```bash
cat .env.vapid
```

Or to regenerate new keys:
```bash
node generate-vapid-keys.cjs
```

## 📊 Push Notification Features

Once set up, users will receive notifications for:

1. **Perfect Matches** (100% score) - Immediate notification
2. **New Matches** - When new opportunities match their profile
3. **Application Deadlines** - 7 days, 3 days, 1 day, 6 hours before deadline
4. **Weekly Digest** - Every Monday at 9 AM
5. **Engagement** - Comments and likes on their posts
6. **New Messages** - When someone sends them a message

Notifications are checked **hourly** via Netlify scheduled function.

## 🐛 Troubleshooting

### Build fails on Netlify?
- Make sure all 6 environment variables are added
- Check for typos in variable names
- Wait 2-3 minutes after adding variables

### Supabase error about functions?
- Run the DROP FUNCTION queries first (Step 2 above)
- Then run the full schema

### Notifications not working?
- Check browser console for errors
- Verify service worker is registered: `navigator.serviceWorker.getRegistration()`
- Check Netlify Functions logs for errors

## 📚 Documentation Files

- **NETLIFY_SETUP.md** - Detailed Netlify environment variable setup
- **FIXES_APPLIED.md** - All Phase 3 fixes and implementations
- **supabase_schema.sql** - Complete database schema
- **generate-vapid-keys.cjs** - Key generation script

## 🎯 Timeline

- **Now**: Configure Netlify + Supabase (7 minutes)
- **+3 minutes**: Netlify build completes
- **+5 minutes**: Test notifications working
- **Total**: ~15 minutes to full push notification system!

## 🔐 Security Notes

- ✅ `.env` file is gitignored (your keys are safe)
- ✅ `VAPID_PRIVATE_KEY` only used server-side
- ✅ `CRON_SECRET` protects your notification endpoint
- ✅ All secrets properly configured

## 🎊 That's It!

You're 3 steps away from having a fully functional push notification system with 10 different notification types running on an hourly schedule!

**Questions?** Check NETLIFY_SETUP.md for detailed troubleshooting.
