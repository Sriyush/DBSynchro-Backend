export async function readGoogleSheet(token: string, sheetId: string, range: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Google Sheets API Error:", err);
    throw new Error(err.error?.message || "Failed reading sheet");
  }

  return (await res.json()).values;
}
