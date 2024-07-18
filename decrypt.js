import fs from 'fs';
import crypto from 'crypto';
import axios from 'axios';
import HKDF from 'hkdf';

async function downloadFile(url, outputPath) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

function deriveKeyAndIv(mediaKey) {
    const hkdf = new HKDF('sha256', '', Buffer.from(mediaKey, 'base64'));
    const info = 'WhatsApp Media Keys';
    const length = 112 / 8; // 14 bytes for key (AES-256 requires 32 bytes) + 16 bytes for iv + 16 bytes for file hash

    return new Promise((resolve, reject) => {
        hkdf.derive(info, length, (keyMaterial) => {
            const key = keyMaterial.slice(0, 32); // 32 bytes for AES-256 key
            const iv = keyMaterial.slice(32, 48); // 16 bytes for IV
            const fileHash = keyMaterial.slice(48, 64); // 16 bytes for file hash
            resolve({ key, iv, fileHash });
        });
    });
}

function decryptFile(encryptedFilePath, outputFilePath, key, iv) {
    const algorithm = 'aes-256-cbc';
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    const input = fs.createReadStream(encryptedFilePath);
    const output = fs.createWriteStream(outputFilePath);

    input.pipe(decipher).pipe(output);

    output.on('finish', function () {
        console.log('Decryption complete.');
    });
}

async function main() {
    const mediaUrl = 'https://mmg.whatsapp.net/v/t62.7119-24/30580052_389315547056976_4433842933464169321_n.enc?ccb=11-4&oh=01_Q5AaIKv7T_t2RUFMpGdACbtS-N-KHZ86p55qNmuYSWkJJh3z&oe=66BF3ED8&_nc_sid=5e03e0&mms3=true';
    const encryptedFilePath = 'public/encrypt/30580052_389315547056976_4433842933464169321_n.enc';
    const outputFilePath = 'public/uploads/30580052_389315547056976_4433842933464169321_n.jpg';
    const mediaKey = 'kOzChjtb/+jg7Nup7imY55LSKfBbw+Y+a3LEeZh2ey4='; // Base64 encoded mediaKey

    // Download the encrypted file if it's not local
    await downloadFile(mediaUrl, encryptedFilePath);

    // Derive the encryption key and IV from the mediaKey
    const { key, iv } = await deriveKeyAndIv(mediaKey);

    // Decrypt the file
    decryptFile(encryptedFilePath, outputFilePath, key, iv);
}

main().catch(console.error);


