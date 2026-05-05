export interface AggClientConfig {
  clientId: string;
  redirectUri: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token: string;
}

export interface UserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  [key: string]: any;
}

export interface AuthorizeUrlData {
  url: string;
  state: string;
  codeVerifier: string;
}
