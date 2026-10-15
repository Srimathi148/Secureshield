# SecureShield Enterprise IAM - Visual Multi-Factor Authentication

Enterprise Identity & Access Management (IAM) and Zero Trust authentication gateway with hardware-grade Visual Multi-Factor Authentication (MFA), supporting both **Recognition-Based** and **Recall-Based** visual verification.

---

## Technical Architecture & Security Model

### 1. Dual-Factor Credential Pipeline
```
[ Step 1: Enterprise Directory / Primary Authentication ]
  • Workplace Email & Primary Password
  • Handled directly by Supabase Auth (bcrypt-hashed in auth.users system schema)
  • Enforces enterprise complexity policies (8+ chars, upper/lower, numbers, symbols)
       ↓
[ Step 2: Zero Trust Visual MFA Challenge ]
  • Dynamically randomized Fisher-Yates grid (resists shoulder-surfing)
  • Factor Choice A: Recognition MFA (4 visual cybersecurity tokens, order-independent)
  • Factor Choice B: Recall Sequence MFA (4-step directional pathway, strictly ordered)
  • Evaluated via 16-byte cryptographically random salt and SHA-256 digest
       ↓
[ Session Authorization & Audit Logging ]
  • Issues authenticated session token
  • Records telemetry event in Enterprise Audit Log
```

---

## Why Primary Passwords & Credentials are Restricted by Row-Level Security (RLS)

### Where is the primary password stored?
- In Supabase, primary passwords are **never** stored in public application tables.
- They are securely hashed with **bcrypt** and maintained inside Supabase's internal system schema: `auth.users`.
- Client applications cannot directly write SQL queries against `auth.users.encrypted_password`.
- **How to set/manage the password:**
  - Initial password creation: `supabase.auth.signUp({ email, password })`
  - Self-service update: `supabase.auth.updateUser({ password: newPassword })`
  - Password recovery: `supabase.auth.resetPasswordForEmail(email)`

### Why did Row-Level Security (RLS) block saving the visual credential?
- The visual MFA tokens are stored in the custom table: `public.user_graphical_credentials`.
- By default, Supabase projects have **"Confirm email"** enabled. When an employee signs up, their account is created in `auth.users`, but **no active JWT session is attached** until they confirm their email.
- Because there is no active JWT session during onboarding, PostgreSQL evaluates `auth.uid()` as `NULL`.
- The default RLS policy `WITH CHECK (auth.uid() = user_id)` evaluates to `NULL = user_id` (`FALSE`), resulting in PostgreSQL error `42501 (violates row-level security policy)`.

### How SecureShield Permanently Resolves RLS Friction:
1. **`SECURITY DEFINER` Stored Procedure (`schema.sql`)**:
   We provide `public.save_graphical_credential(p_user_id, p_auth_method, p_credential_hash, p_salt)`. This procedure runs with elevated security rights to safely upsert the visual MFA record during registration, even if email confirmation is pending.
2. **Flexible RLS Policies**:
   Policies allow authenticated users (`auth.uid() = user_id`) full access, with fallback support for initial enrollment.
3. **Supabase Email Confirmation Setting**:
   In your **Supabase Dashboard -> Authentication -> Providers -> Email**, you can toggle **"Confirm email" OFF** to enable instant corporate provisioning without waiting for email verification links.

---

## Enterprise Console Features

1. **Workplace Single Sign-On (SSO)**:
   - Primary credential validation.
   - Built-in "Forgot Password" self-service recovery flow.
   - Managed device trust option.
2. **Enterprise Visual MFA Factors**:
   - High-fidelity enterprise cybersecurity tokens (HSM, Key Vault, Biometric Sentinel, FIDO2 Key, etc.).
   - Randomized Fisher-Yates grid coordinates on every challenge attempt.
   - Real-time attempt anomaly recording and position reshuffling.
3. **Enterprise Dashboard**:
   - **Identity Overview**: Session UUID, Active MFA Factor, Zero Trust Compliance status.
   - **Credential Management**: Live primary password updater (`supabase.auth.updateUser`) and Visual Key re-enrollment.
   - **Enterprise Audit Trail**: Real-time security telemetry of authentication events, IP addresses, and timestamps.
   - **Terminal Lock**: One-click screen lock prompting visual MFA to resume.

---

## Verification & Testing

Run the automated cryptographic test suite:
```bash
node test_graphical_auth.mjs
```

Build the production bundle:
```bash
npm run build
```
