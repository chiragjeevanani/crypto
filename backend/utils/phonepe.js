const crypto = require("crypto");

/**
 * Generate X-VERIFY checksum for PhonePe Request
 * @param {string} base64Payload - Base64 encoded payload
 * @param {string} endpoint - API endpoint (e.g. /pg/v1/pay)
 * @param {string} saltKey - Salt key from .env
 * @param {string} saltIndex - Salt index from .env
 * @returns {string} X-VERIFY checksum
 */
const generateChecksum = (base64Payload, endpoint, saltKey, saltIndex) => {
  const string = base64Payload + endpoint + saltKey;
  const sha256 = crypto.createHash("sha256").update(string).digest("hex");
  return `${sha256}###${saltIndex}`;
};

/**
 * Encode JSON payload to Base64
 * @param {object} payload - JavaScript object
 * @returns {string} Base64 encoded string
 */
const encodePayload = (payload) => {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
};

module.exports = {
  generateChecksum,
  encodePayload
};
