# Auth Workflow

1. [Issue #1](https://github.com/mdrezuanislamridoy/MedCare-Backend/issues/1): Project auth foundation
   - Install latest Prisma and auth infrastructure dependencies.
   - Configure Prisma 7 with Postgres and a generated client.
   - Store database models in separate Prisma schema files.
   - Add environment validation and Prisma Nest module.
   - Verify client generation and migration creation.

2. [Issue #2](https://github.com/mdrezuanislamridoy/MedCare-Backend/issues/2): Email/password auth
   - Register users with hashed passwords.
   - Login with email/password.
   - Issue JWT access tokens.
   - Add authenticated profile route.

3. [Issue #3](https://github.com/mdrezuanislamridoy/MedCare-Backend/issues/3): Redis code verification
   - Add Redis-backed code storage.
   - Generate email verification codes.
   - Verify and consume one-time codes.

4. [Issue #4](https://github.com/mdrezuanislamridoy/MedCare-Backend/issues/4): Forgot/reset password
   - Issue reset codes through Redis.
   - Verify reset codes.
   - Update password and invalidate used codes.

5. [Issue #5](https://github.com/mdrezuanislamridoy/MedCare-Backend/issues/5): Google auth
   - Verify Google ID tokens.
   - Link Google provider accounts to users.
   - Login or create users from Google identity.
