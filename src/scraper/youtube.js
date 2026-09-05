const axios = require("axios")
const crypto = require("crypto")

class SaveTubeClient {
  constructor() {
    this.ENCRYPTION_KEY_STRING = "C5D58EF67A7584E4A29F6C35BBC4EB12";
  }

  async getRandomCdn() {
    const response = await axios.get("https://media.savetube.me/api/random-cdn");
    return response.data.cdn;
  }

  hexToUint8Array(hexString) {
    try {
      const matched = hexString.match(/[\dA-F]{2}/gi);
      if (!matched) throw new Error("Invalid format");
      return new Uint8Array(matched.map((h) => parseInt(h, 16)));
    } catch (err) {
      console.error("Inva‍lid format error:", err);
      throw err;
    }
  }

  async getDecryptionKey() {
    try {
      const keyData = this.hexToUint8Array(this.ENCRYPTION_KEY_STRING);
      return await crypto.webcrypto.subtle.importKey(
        "raw",
        keyData,
        { name: "AES-CBC" },
        false,
        ["decrypt"],
      );
    } catch (err) {
      console.error("Pro‍cess initialization failed:", err);
      throw err;
    }
  }

  base64ToArrayBuffer(base64) {
    try {
      const buf = Buffer.from(base64.replace(/\s/g, ""), "base64");
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    } catch (err) {
      throw new Error(`fo‍rmat error: ${err.message}`);
    }
  }

  async decryptApiResponse(encryptedData) {
    try {
      const dataBuffer = this.base64ToArrayBuffer(encryptedData);
      if (dataBuffer.byteLength < 16) {
        throw new Error("Inva‍lid format: insufficient length");
      }

      const iv = dataBuffer.slice(0, 16);
      const ciphertext = dataBuffer.slice(16);
      const key = await this.getDecryptionKey();

      const decrypted = await crypto.webcrypto.subtle.decrypt(
        { name: "AES-CBC", iv: new Uint8Array(iv) },
        key,
        ciphertext,
      );

      const text = new TextDecoder().decode(new Uint8Array(decrypted));
      return JSON.parse(text);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async getVideoInfo(url) {
    const cdnHost = await this.getRandomCdn();
    try {
      const res = await axios.post(`https://${cdnHost}/v2/info`, { url });
      return this.decryptApiResponse(res.data.data);
    } catch (err) {
      return {
        error: err,
        statusCode: err?.response?.status,
      };
    }
  }

  async getDownload(key, downloadType = "video", quality = 360) {
    const cdnHost = await this.getRandomCdn();
    try {
      const res = await axios.post(`https://${cdnHost}/download`, {
        downloadType,
        quality,
        key,
      });
      return res.data.data;
    } catch (err) {
      return {
        error: err,
        statusCode: err?.response?.status,
      };
    }
  }
}

module.exports = SaveTubeClient;

// USAGE:
// const api = new SaveTubeClient();
// const info = await api.getVideoInfo("https://youtu.be/z6F0HituEbc");
// console.log(info);

// const download = await api.getDownload(info.key, "video", 360);
// console.log(download);