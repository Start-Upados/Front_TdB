// ─── Configuração da API Google Sheets ────────
const SHEET_ID    = import.meta.env.VITE_GOOGLE_SHEET_ID;
const CLIENT_EMAIL = import.meta.env.VITE_GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = (import.meta.env.VITE_GOOGLE_PRIVATE_KEY ?? '')
  .replace(/\\n/g, '\n')
  .replace(/"/g, '');

console.log('EMAIL:', CLIENT_EMAIL);
console.log('KEY_START:', PRIVATE_KEY?.substring(0, 50));
console.log('SHEET_ID:', SHEET_ID);

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// ─── Gera JWT para autenticação ───────────────
async function getAccessToken(): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now    = Math.floor(Date.now() / 1000);

  const claim = {
    iss:   CLIENT_EMAIL,
    scope: SCOPES.join(' '),
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  const headerB64 = encode(header);
  const claimB64  = encode(claim);
  const unsigned  = `${headerB64}.${claimB64}`;

  // Importa a chave privada
  const keyData = PRIVATE_KEY
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsigned),
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const jwt = `${unsigned}.${sigB64}`;

  // Troca o JWT pelo access token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  });

  const data = await res.json();
  return data.access_token;
}

// ─── Lê dados de uma aba ──────────────────────
export async function readSheet(range: string): Promise<string[][]> {
  const token = await getAccessToken();

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  const data = await res.json();
  return data.values ?? [];
}

// ─── Escreve dados em uma aba ─────────────────
export async function writeSheet(range: string, values: string[][]): Promise<void> {
  const token = await getAccessToken();

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method:  'PUT',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
    },
  );
}

// ─── Adiciona uma linha em uma aba ────────────
export async function appendSheet(range: string, values: string[][]): Promise<void> {
  const token = await getAccessToken();

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
    },
  );
}