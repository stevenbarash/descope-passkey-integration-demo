require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const DescopeClient = require('@descope/node-sdk');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const DESCOPE_PROJECT_ID = process.env.DESCOPE_PROJECT_ID;

// Initialize Descope client
let descopeClient;
try {
  if (DESCOPE_PROJECT_ID) {
    descopeClient = DescopeClient({ projectId: DESCOPE_PROJECT_ID });
    console.log('Descope client initialized successfully');
  } else {
    console.warn('DESCOPE_PROJECT_ID not set - passkey authentication will be disabled');
  }
} catch (error) {
  console.error('Failed to initialize Descope client:', error);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Email and password are required' 
    });
  }

  // Check if password is correct (always "password")
  if (password !== 'password') {
    return res.status(401).json({ 
      error: 'Invalid credentials' 
    });
  }

  // Generate JWT token
  const token = jwt.sign(
    { 
      email,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Return token
  res.json({
    success: true,
    token,
    email
  });
});

// Verify token endpoint (optional, for testing)
app.post('/verify', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      success: true,
      decoded
    });
  } catch (error) {
    res.status(401).json({
      error: 'Invalid or expired token',
      details: error.message
    });
  }
});

// Passkey Sign-Up Start
app.post('/passkey/signup/start', async (req, res) => {
  if (!descopeClient) {
    return res.status(503).json({ error: 'Passkey authentication not configured' });
  }

  const { email, origin } = req.body;

  if (!email || !origin) {
    return res.status(400).json({ error: 'Email and origin are required' });
  }

  try {
    const resp = await descopeClient.webauthn.signUp.start(
      email,
      origin,
      email // displayName
    );

    if (!resp.ok) {
      return res.status(400).json({
        error: 'Failed to start passkey sign-up',
        details: resp.error
      });
    }

    res.json({
      success: true,
      transactionId: resp.data.transactionId,
      options: resp.data.options
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Passkey Sign-Up Finish
app.post('/passkey/signup/finish', async (req, res) => {
  if (!descopeClient) {
    return res.status(503).json({ error: 'Passkey authentication not configured' });
  }

  const { transactionId, response } = req.body;

  if (!transactionId || !response) {
    return res.status(400).json({ error: 'Transaction ID and response are required' });
  }

  try {
    const resp = await descopeClient.webauthn.signUp.finish(
      transactionId,
      JSON.stringify(response)
    );

    if (!resp.ok) {
      return res.status(400).json({
        error: 'Failed to finish passkey sign-up',
        details: resp.error
      });
    }

    // Generate our own JWT token for consistency with password login
    const token = jwt.sign(
      {
        email: resp.data.user.email || resp.data.user.loginIds[0],
        userId: resp.data.user.userId,
        method: 'passkey',
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      email: resp.data.user.email || resp.data.user.loginIds[0],
      descopeSession: {
        sessionToken: resp.data.sessionToken,
        refreshToken: resp.data.refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Passkey Sign-In Start
app.post('/passkey/signin/start', async (req, res) => {
  if (!descopeClient) {
    return res.status(503).json({ error: 'Passkey authentication not configured' });
  }

  const { email, origin } = req.body;

  if (!email || !origin) {
    return res.status(400).json({ error: 'Email and origin are required' });
  }

  try {
    const resp = await descopeClient.webauthn.signIn.start(email, origin);

    if (!resp.ok) {
      return res.status(400).json({
        error: 'Failed to start passkey sign-in',
        details: resp.error
      });
    }

    res.json({
      success: true,
      transactionId: resp.data.transactionId,
      options: resp.data.options
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Passkey Sign-In Finish
app.post('/passkey/signin/finish', async (req, res) => {
  if (!descopeClient) {
    return res.status(503).json({ error: 'Passkey authentication not configured' });
  }

  const { transactionId, response } = req.body;

  if (!transactionId || !response) {
    return res.status(400).json({ error: 'Transaction ID and response are required' });
  }

  try {
    const resp = await descopeClient.webauthn.signIn.finish(
      transactionId,
      JSON.stringify(response)
    );

    if (!resp.ok) {
      return res.status(400).json({
        error: 'Failed to finish passkey sign-in',
        details: resp.error
      });
    }

    // Generate our own JWT token for consistency with password login
    const token = jwt.sign(
      {
        email: resp.data.user.email || resp.data.user.loginIds[0],
        userId: resp.data.user.userId,
        method: 'passkey',
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      email: resp.data.user.email || resp.data.user.loginIds[0],
      descopeSession: {
        sessionToken: resp.data.sessionToken,
        refreshToken: resp.data.refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    passkeysEnabled: !!descopeClient
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

