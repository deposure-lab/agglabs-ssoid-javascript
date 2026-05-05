import { AggClientConfig, AuthorizeUrlData, TokenResponse, UserInfo } from './types';

export class AggClient {
  private readonly issuerUrl: string = 'https://sso-id.agglabs.com';
  private clientId: string;
  private redirectUri: string;

  constructor(config: AggClientConfig) {
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
  }

  private generateRandomString(length: number = 43): string {
    const array = new Uint8Array(length);
    globalThis.crypto.getRandomValues(array);
    return Array.from(array, (byte) => ('0' + byte.toString(16)).slice(-2))
      .join('')
      .substring(0, length);
  }

  private bufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    return this.bufferToBase64Url(hashBuffer);
  }

  public async createAuthorizeUrl(scopes: string[] = ['openid', 'profile', 'email']): Promise<AuthorizeUrlData> {
    const state = this.generateRandomString(32);
    const codeVerifier = this.generateRandomString(64);
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    const url = new URL(`${this.issuerUrl}/authorize`);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('client_id', this.clientId);
    url.searchParams.append('redirect_uri', this.redirectUri);
    url.searchParams.append('code_challenge', codeChallenge);
    url.searchParams.append('code_challenge_method', 'S256');
    url.searchParams.append('state', state);
    
    if (scopes.length > 0) {
      url.searchParams.append('scope', scopes.join(' '));
    }

    return { url: url.toString(), state, codeVerifier };
  }

  public async exchangeToken(code: string, codeVerifier: string): Promise<TokenResponse> {
    const body = new URLSearchParams();
    body.append('grant_type', 'authorization_code');
    body.append('client_id', this.clientId);
    body.append('redirect_uri', this.redirectUri);
    body.append('code', code);
    body.append('code_verifier', codeVerifier);

    const response = await fetch(`${this.issuerUrl}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) throw new Error(`Token exchange failed: ${response.statusText}`);
    return response.json();
  }

  public async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const body = new URLSearchParams();
    body.append('grant_type', 'refresh_token');
    body.append('client_id', this.clientId);
    body.append('refresh_token', refreshToken);

    const response = await fetch(`${this.issuerUrl}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) throw new Error(`Token refresh failed: ${response.statusText}`);
    return response.json();
  }

  public async getUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await fetch(`${this.issuerUrl}/userinfo`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new Error(`Failed to fetch user info: ${response.statusText}`);
    return response.json();
  }

  public async revokeToken(refreshToken: string): Promise<void> {
    const response = await fetch(`${this.issuerUrl}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: refreshToken, client_id: this.clientId }),
    });

    if (!response.ok) throw new Error(`Token revocation failed: ${response.statusText}`);
  }

  public async logout(cookieHeader?: string): Promise<void> {
    const headers: HeadersInit = {};
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const response = await fetch(`${this.issuerUrl}/logout`, {
      method: 'POST',
      credentials: cookieHeader ? 'omit' : 'include',
      headers,
    });

    if (!response.ok) throw new Error(`Logout failed: ${response.statusText}`);
  }
}