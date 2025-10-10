# JWT Login Demo Application with Passkeys

A simple Node.js login application that generates JWT tokens for authentication, with support for both password-based login and passwordless passkey authentication using Descope.

## Features

- Simple and modern login interface with tabs
- **Password authentication**: Accepts any email, password is always "password"
- **Passkey authentication**: WebAuthn-based biometric/security key login using Descope
- JWT token generation for both methods
- Environment-based configuration
- Token verification endpoint
- Integrated with [Descope](https://docs.descope.com/auth-methods/passkeys/with-sdks/backend) for secure passkey management

## Installation

Install dependencies using pnpm:

```bash
pnpm install
```

## Configuration

The application uses environment variables for configuration. Create a `.env` file in the project root:

```bash
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
DESCOPE_PROJECT_ID=your-descope-project-id
```

Configuration options:
- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: Secret key for JWT signing
- `JWT_EXPIRES_IN`: Token expiration time (default: 24h)
- `DESCOPE_PROJECT_ID`: Your Descope project ID (required for passkey authentication)

## Running the Application

Start the server:

```bash
pnpm start
```

The application will be available at `http://localhost:3000`

## Usage

### Password Login

1. Open `http://localhost:3000` in your browser
2. Stay on the "Password" tab
3. Enter any email address
4. Enter password: `password`
5. Click "Sign In"
6. Your JWT token will be displayed

### Passkey Login

1. Open `http://localhost:3000` in your browser
2. Click on the "Passkey" tab
3. Enter your email address
4. Click "Register New Passkey" to create a passkey (first time)
5. Follow your browser/device prompts to create the passkey
6. For subsequent logins, click "Sign In with Passkey"
7. Your JWT token will be displayed

**Note**: Passkeys require:
- A valid `DESCOPE_PROJECT_ID` in your `.env` file
- HTTPS in production (localhost works with HTTP for testing)
- A compatible browser and device with WebAuthn support

## API Endpoints

### POST /login
Login endpoint that generates a JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@example.com"
}
```

### POST /verify
Verify a JWT token.

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "decoded": {
    "email": "user@example.com",
    "iat": 1234567890,
    "exp": 1234654290
  }
}
```

### POST /passkey/signup/start
Start passkey registration flow.

**Request:**
```json
{
  "email": "user@example.com",
  "origin": "http://localhost:3000"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "...",
  "options": { /* WebAuthn creation options */ }
}
```

### POST /passkey/signup/finish
Complete passkey registration.

**Request:**
```json
{
  "transactionId": "...",
  "response": { /* WebAuthn credential response */ }
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@example.com"
}
```

### POST /passkey/signin/start
Start passkey sign-in flow.

**Request:**
```json
{
  "email": "user@example.com",
  "origin": "http://localhost:3000"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "...",
  "options": { /* WebAuthn request options */ }
}
```

### POST /passkey/signin/finish
Complete passkey sign-in.

**Request:**
```json
{
  "transactionId": "...",
  "response": { /* WebAuthn assertion response */ }
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@example.com"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "passkeysEnabled": true
}
```

## Security Notes

- This is a demo application for learning purposes
- In production, never hardcode passwords or use a fixed password for all users
- Use strong, unique JWT secrets
- Store sensitive configuration in environment variables
- Implement proper password hashing (e.g., bcrypt)
- Use HTTPS in production (required for WebAuthn/passkeys outside localhost)
- Passkeys provide phishing-resistant authentication
- Configure proper CORS and domain settings in Descope console

## Technologies Used

- **Backend**: Node.js, Express
- **Authentication**: JWT (jsonwebtoken)
- **Passkeys**: Descope Node SDK, WebAuthn API
- **Frontend**: Vanilla JavaScript, modern CSS

## References

- [Descope Passkey Documentation](https://docs.descope.com/auth-methods/passkeys/with-sdks/backend)
- [WebAuthn API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)

