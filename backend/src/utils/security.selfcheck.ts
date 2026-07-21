import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { decryptValue, encryptValue, hashPassword, hashSessionToken, verifyPassword } from "./security.js";

const passwordHash = await hashPassword("correct horse battery staple");
assert.equal(await verifyPassword("correct horse battery staple", passwordHash), true);
assert.equal(await verifyPassword("wrong password", passwordHash), false);

const key = randomBytes(32);
const roundTrip = encryptValue("private-hevy-key", key);
assert.equal(decryptValue(roundTrip, key), "private-hevy-key");
assert.notEqual(roundTrip.ciphertext, "private-hevy-key");
assert.equal(hashSessionToken("token"), hashSessionToken("token"));

console.log("security self-check passed");
