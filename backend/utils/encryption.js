const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);

class EncryptionUtils {
  static encrypt(buffer) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    cipher.setAutoPadding(true);

    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

    return {
      iv: iv.toString("hex"),
      encryptedData: encrypted,
    };
  }

  static decrypt(encryptedData, ivHex) {
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    decipher.setAutoPadding(true);

    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);

    return decrypted;
  }

  static generateKey() {
    return crypto.randomBytes(32).toString("hex");
  }
}

module.exports = EncryptionUtils;
