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
    // console.log("🔵 getSheetNames() called");
    // console.log("Sheet ID:", sheetId);
    // console.log("Access token:", accessToken?.slice(0, 15) + "...");

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "sheets(properties(title))",
    });

    // console.log("Google API Response:", response.data);

    return response.data.sheets?.map((s) => s.properties?.title) || [];

  } catch (error: any) {
    console.error("❌ GOOGLE ERROR FULL DUMP:");
    console.error(error.response?.data || error);

    throw new Error("Unable to fetch sheet names");
  }
}

export async function appendRowToSheet(accessToken: string, sheetId: string, range: string, values: any[]) {
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [values],
      },
    });
    
    return true;
  } catch (error: any) {
    console.error("❌ Append Row Error:", error.response?.data || error);
    throw new Error("Failed to sync row to Google Sheet");
  }
}

export async function addColumnToSheet(accessToken: string, sheetId: string, sheetTab: string, columnName: string) {
    // 1. We need to find the next available column index (e.g. "E1")
    // This is tricky without reading the whole header row first.
    // For now, simpler approach: Append to row 1.
    
    try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        const sheets = google.sheets({ version: "v4", auth });

        // First, get the current data to find header length
        const rows = await readGoogleSheet(accessToken, sheetId, sheetTab);
        const header = rows[0] || [];
        const nextColIndex = header.length;
        
        // Convert index 0 -> A, 1 -> B, etc. (Simplified for < 26 columns)
        // If > 26, logic needs to be robust. 
        // Better: Use `values.append` but restrict range to Row 1? 
        // No, append adds *rows*. We need `values.update`.
        
        const columnLetter = String.fromCharCode(65 + nextColIndex); // 0=A, 1=B...
        const cell = `${sheetTab}!${columnLetter}1`;

        await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: cell,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[columnName]]
            }
        });

        return true;
    } catch (error: any) {
        console.error("❌ Add Column Error:", error);
        throw new Error("Failed to add column to Google Sheet");
    }
}

export async function updateSheetRow(
  accessToken: string,
  sheetId: string,
  sheetTab: string,
  searchRow: Record<string, string>, // key=header, value=current_db_value (before update)
  newRowData: Record<string, string> // key=header, value=new_value
) {
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: "v4", auth });

    // 1. Fetch ALL data
    const rows = await readGoogleSheet(accessToken, sheetId, sheetTab);
    if (!rows || rows.length === 0) return false;

    const headers = rows[0] as string[];
    const dataRows = rows.slice(1); // Row index 1 = Sheet Row 2

    // 2. Find the matching row index
    // Strategy: Match as many columns as possible from searchRow
    let foundIndex = -1;

    // console.log("Searching for row matching:", searchRow);

    for (let i = 0; i < dataRows.length; i++) {
        const currentRow = dataRows[i];
        let isMatch = true;

        // Check each key in searchRow
        for (const [header, val] of Object.entries(searchRow)) {
            const colIndex = headers.indexOf(header);
            if (colIndex === -1) continue; // Header not in sheet? Skip check.
            
            // Normalize for comparison
            const sheetVal = String(currentRow[colIndex] || "").trim();
            const dbVal = String(val === null || val === undefined ? "" : val).trim();

            // Loose Matching Logic:
            // If Sheet cell is empty but DB has value, assume match (DB is ahead)
            if (sheetVal === "" && dbVal !== "") {
                continue; 
            }

            if (sheetVal !== dbVal) {
                // Debug log for mismatch
                console.log(`[SYNC FAIL] Row ${i+2} Mismatch on '${header}': Sheet='${sheetVal}' vs DB='${dbVal}'`);
                isMatch = false;
                break;
            }
        }

        if (isMatch) {
            foundIndex = i;
            break;
        }
    }

    if (foundIndex === -1) {
        console.warn("⚠️ Could not find matching row in Sheet to update.");
        return false;
    }

    // 3. Construct the update
    // Row 1 is header. dataRows[0] is Row 2.
    // Sheet Row Number = foundIndex + 2
    const sheetRowNum = foundIndex + 2;
    
    // We will update the whole row to be safe/easy
    const currentRowArray = dataRows[foundIndex];
    const updatedRowArray = [...currentRowArray]; // Clone

    for (const [header, newVal] of Object.entries(newRowData)) {
        const colIndex = headers.indexOf(header);
        if (colIndex !== -1) {
            updatedRowArray[colIndex] = newVal;
        }
    }

    const range = `${sheetTab}!A${sheetRowNum}`; // Start at A, let API handle width

    await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: range,
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [updatedRowArray]
        }
    });

    return true;

  } catch (err: any) {
    console.error("❌ Update Sheet Row Error:", err);
    throw new Error("Failed to update Google Sheet row");
  }
}
