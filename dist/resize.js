"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resize = resize;
const isBrowser = typeof window !== 'undefined';
async function resize(input, maxWidth = 1920, maxHeight = 1080) {
    if (isBrowser) {
        return clientResize(input, maxWidth, maxHeight);
    }
    else {
        if (typeof input !== 'string') {
            throw new Error("Server-side resizing only supports base64 strings or URLs.");
        }
        return serverResize(input, maxWidth, maxHeight);
    }
}
async function clientResize(input, maxWidth, maxHeight) {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        const handleLoad = () => {
            let width = img.width;
            let height = img.height;
            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            }
            else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            // Attempt to determine format from input if possible, defaulting to jpeg for efficiency/compatibility
            // If input was a file, we can use its type. If string, we can try to parse.
            let mimeType = 'image/jpeg';
            if (input instanceof File) {
                mimeType = input.type;
            }
            else if (typeof input === 'string') {
                const match = input.match(/^data:(image\/\w+);base64,/);
                if (match)
                    mimeType = match[1];
            }
            resolve(canvas.toDataURL(mimeType));
        };
        img.onload = handleLoad;
        img.onerror = (error) => reject(error);
        if (input instanceof File) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    img.src = e.target.result;
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(input);
        }
        else {
            img.src = input;
        }
        // For base64 strings, we don't need to wait for reader, but we do need to wait for img.onload which is handled above.
        // If input is string, setting src triggers load.
    });
}
async function serverResize(inputStr, maxWidth, maxHeight) {
    // If running in browser context, do not attempt to load sharp or Buffer
    if (typeof window !== 'undefined') {
        throw new Error("serverResize called in browser environment");
    }
    try {
        // Dynamic import to prevent bundling sharp on the client
        const sharpModule = await Promise.resolve().then(() => __importStar(require('sharp')));
        const sharp = sharpModule.default;
        let buffer;
        let mimeType = 'image/jpeg';
        if (inputStr.startsWith('http://') || inputStr.startsWith('https://')) {
            const response = await fetch(inputStr);
            if (!response.ok) {
                throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
            mimeType = response.headers.get('content-type') || 'image/jpeg';
        }
        else {
            // Remove data URL prefix if present
            const base64Data = inputStr.replace(/^data:image\/\w+;base64,/, "");
            // Buffer is a Node global, ensure it exists
            if (typeof Buffer === 'undefined') {
                throw new Error("Buffer is not defined");
            }
            buffer = Buffer.from(base64Data, 'base64');
            mimeType = inputStr.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
        }
        // Get image metadata
        const metadata = await sharp(buffer).metadata();
        if (metadata.width && metadata.height && (metadata.width > maxWidth || metadata.height > maxHeight)) {
            const resizedBuffer = await sharp(buffer)
                .resize({
                width: maxWidth,
                height: maxHeight,
                fit: 'inside', // Maintain aspect ratio, fit inside dimensions
                withoutEnlargement: true
            })
                .toBuffer();
            return `data:${mimeType};base64,${resizedBuffer.toString('base64')}`;
        }
        // If input was a URL, return the fetched content as base64 to ensure downstream availability
        if (inputStr.startsWith('http://') || inputStr.startsWith('https://')) {
            return `data:${mimeType};base64,${buffer.toString('base64')}`;
        }
        return inputStr;
    }
    catch (error) {
        console.warn("Failed to resize image on server:", error);
        return inputStr; // Fallback to original
    }
}
