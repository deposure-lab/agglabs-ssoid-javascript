# AGG SSO ID SDK

Official TypeScript/JavaScript SDK for integrating with AGG SSO ID.
This library provides a seamless way to implement OAuth 2.0 Authorization Code Flow with PKCE and OpenID Connect (OIDC).

---

## Features

* Zero Dependencies
  Built using native Web Crypto and Fetch APIs.

* PKCE Built-in
  Automatic generation of code_verifier and code_challenge.

* Isomorphic
  Works in Node.js, browsers, and edge environments (Next.js, Cloudflare Workers).

* TypeScript Ready
  Full type definitions included.

---

## Installation

npm install agg-labs-sso-sdk

---

## Quick Start

### 1. Initialize the Client

You only need your clientId and redirectUri.
The issuerUrl is pre-configured to point to AGG Labs infrastructure.

import { AggClient } from 'agg-labs-sso-sdk';

const auth = new AggClient({
clientId: 'your-service-provider-id',
redirectUri: 'https://your-app.com/api/auth/callback',
});

---

### 2. Redirect to Login

Generate the secure authorization URL.

IMPORTANT: Store the state and codeVerifier in your session/cookies to verify them later.

const { url, state, codeVerifier } = await auth.createAuthorizeUrl();

// Save state and codeVerifier in a secure session
// Redirect user to 'url'

---

### 3. Handle Callback & Exchange Code

Once the user is redirected back to your app, exchange the authorization code for tokens.

const tokens = await auth.exchangeToken(codeFromUrl, savedCodeVerifier);

console.log('Access Token:', tokens.access_token);
console.log('ID Token:', tokens.id_token);

---

### 4. Fetch User Profile

Use the access token to retrieve user details.

const user = await auth.getUserInfo(tokens.access_token);

console.log(`Hello, ${user.email}!`);

---

## API Reference

createAuthorizeUrl(scopes?)
Generates OIDC login URL with PKCE.

exchangeToken(code, verifier)
Exchanges auth code for Access/ID/Refresh tokens.

refreshToken(token)
Rotates an expired access token using a refresh token.

getUserInfo(accessToken)
Returns claims about the authenticated user.

revokeToken(token)
Invalidates a refresh token.

logout(cookieHeader?)
Terminates the global SSO session.

---

## License

ISC © AGG Labs
