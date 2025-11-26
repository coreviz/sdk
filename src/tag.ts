import { resize } from "./resize";

export interface TagOptions {
    prompt: string;
    options?: string[];
    multiple?: boolean;
    token?: string;
    apiKey?: string;
}

export interface TagResponse {
    tags: string[];
    raw?: unknown;
}

export async function tag(image: string, options: TagOptions): Promise<TagResponse> {
    try {
        const resizedImage = await resize(image);

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (options.token) {
            headers['Authorization'] = `Bearer ${options.token}`;
        } else {
            headers['x-api-key'] = options.apiKey || process.env.COREVIZ_API_KEY || "";
        }

        const response = await fetch("https://lab.coreviz.io/api/ai/tag", {
            method: 'POST',
            headers,
            body: JSON.stringify({
                image: resizedImage,
                prompt: options.prompt,
                options: options.options && options.options.length > 0 ? options.options : undefined,
                multiple: options.multiple ?? true,
            }),
        });

        if (response.status === 402) {
            throw new Error('Insufficient credits');
        }

        if (!response.ok) {
            throw new Error(`Failed to tag image (${response.status})`);
        }

        const data = await response.json() as {
            error?: string;
            tags?: string[];
            result?: string[];
            tag?: string;
        };

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
    } catch (err) {
        throw err instanceof Error ? err : new Error("An unexpected error occurred.");
    }
}


