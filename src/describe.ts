import { resize } from './resize';

export interface DescribeOptions {
    token?: string;
    apiKey?: string;
}

export async function describe(image: string, options?: DescribeOptions) {
    try {
        const resizedImage = await resize(image);

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (options?.token) {
            headers['Authorization'] = `Bearer ${options.token}`;
        } else {
            headers['x-api-key'] = options?.apiKey || process.env.COREVIZ_API_KEY || "";
        }

        const response = await fetch(`https://lab.coreviz.io/api/ai/describe`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ image: resizedImage }),
        });

        if (response.status === 402) {
            throw new Error('Insufficient credits');
        }

        if (!response.ok) {
            throw new Error(`Failed to describe image (${response.status})`);
        }

        const data = await response.json() as { error?: string; description?: string };

        if (data.error) {
            throw new Error(data.error);
        }

        return data.description;
    } catch (err) {
        throw err instanceof Error ? err : new Error("An unexpected error occurred.");
    }
}
