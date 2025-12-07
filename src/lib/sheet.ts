import { google } from "googleapis";

export async function readGoogleSheet(token: string, sheetId: string, sheetName: string) {
  const range = encodeURIComponent(`${sheetName}!A1:Z999`);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("❌ Google Sheets API Error:", data);
    throw new Error(data.error?.message || "Failed to read sheet");
  }

  return data.values || [];
}


export async function getSheetNames(accessToken: string, sheetId: string) {
  try {
    console.log("🔵 getSheetNames() called");
    console.log("Sheet ID:", sheetId);
    console.log("Access token:", accessToken?.slice(0, 15) + "...");

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "sheets(properties(title))",
    });

    console.log("Google API Response:", response.data);

    return response.data.sheets?.map((s) => s.properties?.title) || [];

  } catch (error: any) {
    console.error("❌ GOOGLE ERROR FULL DUMP:");
    console.error(error.response?.data || error);

    throw new Error("Unable to fetch sheet names");
  }
}
