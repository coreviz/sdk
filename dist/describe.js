"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.describe = describe;
const resize_1 = require("./resize");
async function describe(image) {
    try {
        const resizedImage = await (0, resize_1.resize)(image);
        const response = await fetch(`https://lab.coreviz.io/api/ai/describe`, {
            method: 'POST',
            headers: {
                'x-api-key': process.env.COREVIZ_API_KEY || "",
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: resizedImage }),
        });
        if (!response.ok) {
            throw new Error(`Failed to describe image (${response.status})`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        return data.description;
    }
    catch (err) {
        console.error('Error in describeImage:', err);
        throw err instanceof Error ? err : new Error("An unexpected error occurred.");
    }
}
