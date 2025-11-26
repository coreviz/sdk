import { resize } from './resize';

export interface EditOptions {
    prompt: string;
    aspectRatio?: 'match_input_image' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    outputFormat?: 'jpg' | 'png';
    model?: 'flux-kontext-max' | 'google/nano-banana' | 'seedream-4';
    token?: string;
    apiKey?: string;
}

export async function edit(image: string, options: EditOptions) {
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

        const response = await fetch(`https://lab.coreviz.io/api/ai/edit`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                image: resizedImage,
                prompt: options.prompt,
                aspectRatio: options.aspectRatio || 'match_input_image',
                outputFormat: options.outputFormat || 'jpg',
                model: options.model || 'flux-kontext-max',
            }),
        });

        if (response.status === 402) {
            throw new Error('Insufficient credits');
        }

        if (!response.ok) {
            throw new Error(`Failed to edit image (${response.status})`);
        }

        const data = await response.json() as { error?: string; result?: string };

        if (data.error) {
            throw new Error(data.error);
        }

        return data.result;
    } catch (err) {
        throw err instanceof Error ? err : new Error("An unexpected error occurred.");
    }
}

