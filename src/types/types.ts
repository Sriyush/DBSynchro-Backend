
export interface DBUser {
  id: number;
  googleId: string;
  email: string;
  name: string | null;
  tokens: {
    access_token?: string;
    refresh_token?: string;
    scope?: string;
    expiry_date?: number;
  } | null;
  createdAt?: Date;
}

// export interface JWTPayload {
//   id: number;
//   email: string;
//   name: string;
//   iat?: number;
//   exp?: number;
// }

// export interface ReadSheetRequest {
//   sheetId: string;
//   range: string;
// }

// export interface SyncConfig {
//   id: number;
//   userId: number;
//   sheetId: string;
//   sheetRange: string;
//   tableName: string;
//   mapping: Record<string, string>;
//   createdAt?: Date;
// }

// export interface SheetDataResponse {
//   values: string[][];
// }
