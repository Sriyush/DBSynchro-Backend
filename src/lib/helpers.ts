export function sheetIdToTableName(sheetId: string) {
  return "sync_" + sheetId.toLowerCase().replace(/[^a-z0-9]/g, "_");
}
