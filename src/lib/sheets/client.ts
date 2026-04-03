import { google } from "googleapis";

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

export async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const rawKey = process.env.GOOGLE_PRIVATE_KEY ?? "";
  // Strip accidental surrounding quotes, then convert literal \n to real newlines
  const privateKey = rawKey.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}
