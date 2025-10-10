require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const DescopeClient = require('@descope/node-sdk');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const DESCOPE_PROJECT_ID = process.env.DESCOPE_PROJECT_ID;

// Validate required environment variables
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set');
  throw new Error('JWT_SECRET is required');
}

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

// Login endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Email and password are required' 
    });
  }

  if (password !== 'password') {
    return res.status(401).json({ 
      error: 'Invalid credentials' 
    });
  }

  const token = jwt.sign(
    { 
      email,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.json({
    success: true,
    token,
    email
  });
});

// Verify token endpoint
app.post('/api/verify', (req, res) => {
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
app.post('/api/passkey/signup/start', async (req, res) => {
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
      email
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
      options: typeof resp.data.options === 'string' ? JSON.parse(resp.data.options) : resp.data.options
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Passkey Sign-Up Finish
app.post('/api/passkey/signup/finish', async (req, res) => {
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
app.post('/api/passkey/signin/start', async (req, res) => {
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
      options: typeof resp.data.options === 'string' ? JSON.parse(resp.data.options) : resp.data.options
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Passkey Sign-In Finish
app.post('/api/passkey/signin/finish', async (req, res) => {
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

// Passkey Update Start (Add passkey to existing user)
app.post('/api/passkey/update/start', async (req, res) => {
  if (!descopeClient) {
    return res.status(503).json({ error: 'Passkey authentication not configured' });
  }

  const { email, origin, refreshToken } = req.body;

  if (!email || !origin || !refreshToken) {
    return res.status(400).json({ error: 'Email, origin, and refresh token are required' });
  }

  try {
    const resp = await descopeClient.webauthn.update.start(
      email,
      origin,
      refreshToken
    );

    if (!resp.ok) {
      return res.status(400).json({
        error: 'Failed to start passkey update',
        details: resp.error
      });
    }

    res.json({
      success: true,
      transactionId: resp.data.transactionId,
      options: typeof resp.data.options === 'string' ? JSON.parse(resp.data.options) : resp.data.options
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Passkey Update Finish (Complete adding passkey to existing user)
app.post('/api/passkey/update/finish', async (req, res) => {
  if (!descopeClient) {
    return res.status(503).json({ error: 'Passkey authentication not configured' });
  }

  const { transactionId, response } = req.body;

  if (!transactionId || !response) {
    return res.status(400).json({ error: 'Transaction ID and response are required' });
  }

  try {
    const resp = await descopeClient.webauthn.update.finish(
      transactionId,
      JSON.stringify(response)
    );

    if (!resp.ok) {
      return res.status(400).json({
        error: 'Failed to finish passkey update',
        details: resp.error
      });
    }

    res.json({
      success: true,
      message: 'Passkey successfully added to your account'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    passkeysEnabled: !!descopeClient
  });
});

module.exports = app;

