# Netlify Environment Variables Setup

## 🔐 Required Environment Variables

Copy these exact values to Netlify:

```bash
VITE_VAPID_PUBLIC_KEY=MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAELJ2P-gg97-F7bS-Ub78B_9uOCj5rubHJ11CcdH8q7bPDBftqCCzq8X0gAIzarYIW_5cJG8m2XYrRI-TYuzeMCg

VAPID_PRIVATE_KEY=MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgKzZN9RStv5nMeaE4KCWB28kTBBoiRYmPbFg9COKXEHyhRANCAAQsnY_6CD3v4XttL5RvvwH_244KPmu5scnXUJx0fyrts8MF-2oILOrxfSAAjNqtghb_lwkbybZditEj5Ni7N4wK

CRON_SECRET=c60ab51586c4f68341e7964537f66169339f1a72f097e35a656c6c7715ea9cc7

VITE_SUPABASE_URL=https://zviwyuwpfdmmviqvqhoe.supabase.co

VITE_SUPABASE_ANON_KEY=sb_publishable_y-fA455l-6fJgIC7YbfahA_kdHNv5Ah

SUPABASE_SERVICE_ROLE_KEY=sb_secret_ZhUCBJ5plb25M18bA0vN2w_I0u8VAGr
```

## 📝 Step-by-Step Instructions

### 1. Go to Netlify Dashboard
- Visit: https://app.netlify.com
- Select your **launchpadcm** site

### 2. Navigate to Environment Variables
- Click **Site settings** (top navigation)
- Scroll down to **Environment variables** (left sidebar)
- Click **Add a variable**

### 3. Add Each Variable
For each variable above:
- **Key**: Copy the name (e.g., `VITE_VAPID_PUBLIC_KEY`)
- **Value**: Copy the value (the long string after `=`)
- **Scopes**: Select **All deploys**
- Click **Save**

Repeat for all 6 variables!

### 4. Trigger New Deploy
After adding all variables:
- Go to **Deploys** tab
- Click **Trigger deploy** → **Deploy site**
- OR: Just push a new commit and Netlify will redeploy automatically

## ✅ Verification Checklist

Once deployed, check:
- [ ] Build succeeds (no TypeScript errors)
- [ ] Site loads without errors
- [ ] Push notification permission prompt appears
- [ ] Test notification works

## 🔍 What Each Variable Does

| Variable | Purpose | Security |
|----------|---------|----------|
| `VITE_VAPID_PUBLIC_KEY` | Public key for browser push subscriptions | ✅ Public (safe in client code) |
| `VAPID_PRIVATE_KEY` | Signs push notifications from server | 🔒 Secret (server-side only) |
| `CRON_SECRET` | Authenticates scheduled notification jobs | 🔒 Secret (prevents unauthorized access) |
| `VITE_SUPABASE_URL` | Your Supabase project URL | ✅ Public |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous access key | ✅ Public (row-level security protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | Full database access for server functions | 🔒 Secret (bypasses RLS) |

## 🚨 Security Reminders

- ✅ Variables starting with `VITE_` are exposed to the browser (by design)
- 🔒 Never commit `.env` file to Git (it's in `.gitignore`)
- 🔒 `VAPID_PRIVATE_KEY` must ONLY be used in server-side code
- 🔒 `SUPABASE_SERVICE_ROLE_KEY` must ONLY be used in server-side code
- 🔒 `CRON_SECRET` should only be known to your cron job

## 📖 Next Steps After Netlify Setup

1. **Update Supabase Schema**
   - Go to Supabase SQL Editor
   - Run `fix_supabase_drop_functions.sql` first
   - Then run `supabase_schema.sql`

2. **Test Push Notifications**
   - Visit your deployed site
   - Click "Enable Notifications" in settings
   - Send a test notification
   - Check browser notification appears

3. **Monitor Cron Jobs**
   - Check Netlify Functions logs
   - Verify hourly match notifications run
   - Check push subscription table in Supabase

## 🐛 Troubleshooting

### Build still fails?
- Check all 6 variables are added
- Check for typos in variable names
- Verify values have no extra spaces
- Redeploy after adding variables

### Notifications not working?
- Check browser console for errors
- Verify VAPID keys match between client and server
- Check service worker is registered
- Verify Supabase push subscription table exists

### Cron job not running?
- Check Netlify Functions logs
- Verify CRON_SECRET is set correctly
- Check netlify.toml has scheduled function configured
- Verify `scheduled-match-notify.js` exists in `netlify/functions/`

## 📞 Need Help?

If you encounter issues:
1. Check Netlify deploy logs for specific errors
2. Check browser console for client-side errors
3. Check Netlify Functions logs for server-side errors
4. Verify all environment variables are set correctly
