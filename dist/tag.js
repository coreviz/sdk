"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tag = tag;
const resize_1 = require("./resize");
async function tag(image, options) {
    try {
        const resizedImage = await (0, resize_1.resize)(image);
        const response = await fetch("https://lab.coreviz.io/api/ai/tag", {
            method: 'POST',
            headers: {
                'x-api-key': process.env.COREVIZ_API_KEY || "",
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: resizedImage,
                prompt: options.prompt,
                options: options.options && options.options.length > 0 ? options.options : undefined,
                multiple: options.multiple ?? true,
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to tag image (${response.status})`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        const tags = Array.isArray(data.tags)
            ? data.tags
            : Array.isArray(data.result)
                ? data.result
                : typeof data.tag === 'string'
                    ? [data.tag]
                    : [];
        return {
            tags,
            raw: data,
        };
    }
    catch (err) {
        console.error('Error in tagImage:', err);
        throw err instanceof Error ? err : new Error("An unexpected error occurred.");
    }
}
