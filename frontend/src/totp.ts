const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(input: string): Uint8Array {
    const clean = input.replace(/=+$/, '').replace(/\s/g, '').toUpperCase();
    const bytes: number[] = [];
    let buffer = 0;
    let bits = 0;
    for (const char of clean) {
        const value = BASE32.indexOf(char);
        if (value < 0) throw new Error('Invalid base32');
        buffer = ((buffer << 5) | value) & 0xffff;
        bits += 5;
        if (bits >= 8) {
            bytes.push((buffer >> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }
    return Uint8Array.from(bytes);
}

function sha1(data: Uint8Array): Uint8Array {
    const h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
    const bitLength = data.length * 8;
    const paddedLength = ((data.length + 9 + 63) >> 6) << 6;
    const buffer = new Uint8Array(paddedLength);
    buffer.set(data);
    buffer[data.length] = 0x80;
    const view = new DataView(buffer.buffer);
    view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
    view.setUint32(paddedLength - 4, bitLength >>> 0);

    const w = new Uint32Array(80);
    for (let offset = 0; offset < paddedLength; offset += 64) {
        for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4);
        for (let i = 16; i < 80; i++) {
            const x = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
            w[i] = (x << 1) | (x >>> 31);
        }

        let a = h[0];
        let b = h[1];
        let c = h[2];
        let d = h[3];
        let e = h[4];

        for (let i = 0; i < 80; i++) {
            let f: number;
            let k: number;
            if (i < 20) {
                f = (b & c) | (~b & d);
                k = 0x5a827999;
            } else if (i < 40) {
                f = b ^ c ^ d;
                k = 0x6ed9eba1;
            } else if (i < 60) {
                f = (b & c) | (b & d) | (c & d);
                k = 0x8f1bbcdc;
            } else {
                f = b ^ c ^ d;
                k = 0xca62c1d6;
            }
            const temp = ((((a << 5) | (a >>> 27)) + f + e + k + w[i]) >>> 0);
            e = d;
            d = c;
            c = ((b << 30) | (b >>> 2)) >>> 0;
            b = a;
            a = temp;
        }

        h[0] = (h[0] + a) >>> 0;
        h[1] = (h[1] + b) >>> 0;
        h[2] = (h[2] + c) >>> 0;
        h[3] = (h[3] + d) >>> 0;
        h[4] = (h[4] + e) >>> 0;
    }

    const out = new Uint8Array(20);
    const outView = new DataView(out.buffer);
    h.forEach((value, index) => outView.setUint32(index * 4, value));
    return out;
}

function hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
    const blockSize = 64;
    let normalizedKey = key;
    if (normalizedKey.length > blockSize) normalizedKey = sha1(normalizedKey);

    const inner = new Uint8Array(blockSize + message.length);
    const outer = new Uint8Array(blockSize + 20);
    for (let i = 0; i < blockSize; i++) {
        const keyByte = i < normalizedKey.length ? normalizedKey[i] : 0;
        inner[i] = keyByte ^ 0x36;
        outer[i] = keyByte ^ 0x5c;
    }
    inner.set(message, blockSize);
    outer.set(sha1(inner), blockSize);
    return sha1(outer);
}

export const TOTP_PERIOD_SECONDS = 30;

export function generateTotp(secret: string, timeMs: number = Date.now(), digits = 6): string {
    const step = Math.floor(timeMs / 1000 / TOTP_PERIOD_SECONDS);
    const counter = new Uint8Array(8);
    const counterView = new DataView(counter.buffer);
    counterView.setUint32(0, Math.floor(step / 0x100000000));
    counterView.setUint32(4, step >>> 0);

    const hash = hmacSha1(base32Decode(secret), counter);
    const offset = hash[hash.length - 1] & 0x0f;
    const binary =
        ((hash[offset] & 0x7f) << 24) |
        (hash[offset + 1] << 16) |
        (hash[offset + 2] << 8) |
        hash[offset + 3];

    return String(binary % 10 ** digits).padStart(digits, '0');
}

export function secondsRemaining(timeMs: number = Date.now()): number {
    return TOTP_PERIOD_SECONDS - (Math.floor(timeMs / 1000) % TOTP_PERIOD_SECONDS);
}