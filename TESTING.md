# Testing Guide

## 🧪 Quick Testing Without Passkey Configuration

### Option 1: Password Login (No setup required)

The password authentication works immediately without any configuration:

```bash
pnpm start
```

Open http://localhost:3000
- Use any email address
- Password: `password`
- Get JWT token immediately ✅

### Option 2: Enable Passkeys (2 minutes setup)

To test passkey authentication:

#### Step 1: Configure Descope Console

1. Go to https://app.descope.com
2. Select your project (ID: `${DESCOPE_PROJECT_ID}`)
3. Navigate to: **Authentication Methods** → **Passkeys**
4. Find **"Relying Party ID"** or **"Allowed Domains"** section
5. Add domain: `localhost` (no `http://`, no port)
6. Click **Save**

#### Step 2: Verify Environment Variable

Make sure `.env` contains:
```bash
DESCOPE_PROJECT_ID=P2abc...your-project-id
```

#### Step 3: Restart Server

```bash
pnpm start
```

#### Step 4: Test Passkeys

1. Open http://localhost:3000
2. Click **"Passkey"** tab
3. Enter your email
4. Click **"Register New Passkey"**
5. Follow browser prompts (Touch ID, Face ID, etc.)
6. Success! You now have a passkey registered ✅

For subsequent logins, use **"Sign In with Passkey"**

## 🔍 Troubleshooting

### Error: "Missing domain in WebAuthn settings"

**Cause**: `localhost` not configured in Descope console

**Solution**: Follow Option 2 above to add `localhost` to your Descope project

### Error: "Passkey authentication not configured"

**Cause**: `DESCOPE_PROJECT_ID` not set in `.env`

**Solution**: Add your Descope project ID to `.env` file

### Passkey tab is grayed out

**Cause**: Server detected passkeys are not available

**Solution**: 
1. Check `.env` has `DESCOPE_PROJECT_ID`
2. Configure `localhost` in Descope console
3. Restart server

## 🌐 Testing on Real Domain

For production testing:

1. Deploy to your domain (e.g., `example.com`)
2. Configure domain in Descope console
3. **Important**: Must use HTTPS (WebAuthn requirement)
4. Test registration and sign-in

## 📱 Testing on Mobile

WebAuthn works on mobile devices:

1. Use ngrok or similar to expose localhost
   ```bash
   ngrok http 3000
   ```
2. Add the ngrok domain to Descope console
3. Open ngrok URL on your mobile device
4. Test with device biometrics (Face ID, fingerprint, etc.)

## ✅ Verification Checklist

- [ ] Password login works (no configuration needed)
- [ ] DESCOPE_PROJECT_ID set in `.env`
- [ ] `localhost` added to Descope WebAuthn settings
- [ ] Server shows "Descope client initialized successfully"
- [ ] Health endpoint shows `"passkeysEnabled": true`
- [ ] Passkey tab is clickable (not grayed out)
- [ ] Can register new passkey
- [ ] Can sign in with passkey
- [ ] Both methods return JWT tokens

## 🔗 Useful Links

- [Descope Console](https://app.descope.com)
- [Descope Passkey Documentation](https://docs.descope.com/auth-methods/passkeys/with-sdks/backend)
- [Descope WebAuthn Settings Guide](https://docs.descope.com/auth-methods/passkeys/settings)
- [WebAuthn Browser Support](https://caniuse.com/webauthn)


