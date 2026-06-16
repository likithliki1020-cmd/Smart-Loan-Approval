import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const keys = await generateKeyPair("RS256", { extractable: true });

const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

console.log("\n======= COPY THESE TO CONVEX DASHBOARD =======\n");
console.log("JWT_PRIVATE_KEY:");
console.log(privateKey.trimEnd().replace(/\n/g, " "));
console.log("\nJWKS:");
console.log(jwks);
console.log("\n===============================================");