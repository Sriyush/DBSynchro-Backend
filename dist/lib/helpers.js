"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sheetIdToTableName = sheetIdToTableName;
function sheetIdToTableName(sheetId) {
    return "sync_" + sheetId.toLowerCase().replace(/[^a-z0-9]/g, "_");
}
