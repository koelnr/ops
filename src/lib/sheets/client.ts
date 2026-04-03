import { google } from "googleapis";

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

export async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

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
