const fs = require('fs');
// const tsConfig = require("./tsconfig.json"); // Can't require JSON with comments in JS natively before Node 22 without flag
const tsConfig = JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8'));
const tsConfigPaths = require("tsconfig-paths");

const baseUrl = "./dist"; // Matches 'outDir' in tsconfig.json
const cleanup = tsConfigPaths.register({
  baseUrl,
  paths: tsConfig.compilerOptions.paths,
});