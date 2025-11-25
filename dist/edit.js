"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.edit = edit;
const resize_1 = require("./resize");
async function edit(image, options) {
    try {
        const resizedImage = await (0, resize_1.resize)(image);
        const response = await fetch(`https://lab.coreviz.io/api/ai/edit`, {
            method: 'POST',
            headers: {
                'x-api-key': process.env.COREVIZ_API_KEY || "",
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: resizedImage,
                prompt: options.prompt,
                aspectRatio: options.aspectRatio || 'match_input_image',
                outputFormat: options.outputFormat || 'jpg',
                model: options.model || 'flux-kontext-max',
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to edit image (${response.status})`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        return data.result;
    }
    catch (err) {
        console.error('Error in editImage:', err);
        throw err instanceof Error ? err : new Error("An unexpected error occurred.");
    }
}
