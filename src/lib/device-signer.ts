/**
 * Device Signer - Ed25519 签名实现
 * 使用 tweetnacl 库（纯 JavaScript 实现，浏览器兼容）
 */

import nacl from 'tweetnacl';

const STORAGE_KEY = 'lobster_device_keys';
const DEVICE_ID_KEY = 'lobster_device_id';

interface KeyPair {
  privateKey: string; // base64
  publicKey: string;  // base64
}

class DeviceSigner {
  private keyPair: KeyPair | null = null;
  private deviceId: string = '';
  private initialized = false;

  async init(): Promise<void> {
    if (typeof window === 'undefined') {
      this.initialized = true;
      return;
    }

    // 获取或创建设备ID
    this.deviceId = localStorage.getItem(DEVICE_ID_KEY) || '';
    if (!this.deviceId) {
      this.deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(DEVICE_ID_KEY, this.deviceId);
    }

    // 获取或创建密钥对
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.keyPair = JSON.parse(stored);
      } catch {
        this.keyPair = this.generateKeyPair();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.keyPair));
      }
    } else {
      this.keyPair = this.generateKeyPair();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.keyPair));
    }

    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async generateDeviceSignature(nonce: string, timestamp: number): Promise<{
    deviceId: string;
    publicKey: string;
    signature: string;
    signedAt: number;
  }> {
    if (!this.keyPair) {
      await this.init();
    }

    if (!this.keyPair) {
      throw new Error('Failed to initialize key pair');
    }

    // 签名内容：nonce + signedAt 直接拼接（不是 JSON）
    const signedAt = timestamp;
    const message = nonce + signedAt.toString();
    
    // 使用 tweetnacl 签名
    const privateKeyBytes = this.base64ToBytes(this.keyPair.privateKey);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = nacl.sign.detached(messageBytes, privateKeyBytes);

    return {
      deviceId: this.deviceId,
      publicKey: this.keyPair.publicKey,
      signature: this.bytesToBase64(signatureBytes),
      signedAt: signedAt
    };
  }

  private generateKeyPair(): KeyPair {
    // 使用 tweetnacl 生成密钥对
    const keyPair = nacl.sign.keyPair();
    
    return {
      privateKey: this.bytesToBase64(keyPair.secretKey),
      publicKey: this.bytesToBase64(keyPair.publicKey)
    };
  }

  private bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

// 单例
let signerInstance: DeviceSigner | null = null;

export async function initDeviceSigner(): Promise<void> {
  if (!signerInstance) {
    signerInstance = new DeviceSigner();
  }
  await signerInstance.init();
}

export function getDeviceSigner(): DeviceSigner {
  if (!signerInstance) {
    signerInstance = new DeviceSigner();
  }
  return signerInstance;
}