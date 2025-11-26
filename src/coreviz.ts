import { resize } from './resize';

export interface CoreVizConfig {
    apiKey?: string;
    token?: string;
}

export interface DescribeOptions {
}

export interface EditOptions {
    prompt: string;
    aspectRatio?: 'match_input_image' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    outputFormat?: 'jpg' | 'png';
    model?: 'flux-kontext-max' | 'google/nano-banana' | 'seedream-4';
}

export interface TagOptions {
    prompt: string;
    options?: string[];
    multiple?: boolean;
}

export interface TagResponse {
    tags: string[];
    raw?: unknown;
}

export class CoreViz {
    private apiKey?: string;
    private token?: string;

    constructor(config: CoreVizConfig = {}) {
        this.apiKey = config.apiKey || (typeof process !== 'undefined' ? process.env.COREVIZ_API_KEY : undefined);
        this.token = config.token;
    }

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        } else {
            headers['x-api-key'] = this.apiKey || "";
        }
        return headers;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (response.status === 402) {
            throw new Error('Insufficient credits');
        }

        if (!response.ok) {
            throw new Error(`Request failed (${response.status})`);
        }

        const data = await response.json() as any;

        if (data.error) {
            throw new Error(data.error);
        }

        return data;
    }

    async describe(image: string, options?: DescribeOptions): Promise<string> {
        try {
            const resizedImage = await resize(image);
            const headers = this.getHeaders();

            const response = await fetch(`https://lab.coreviz.io/api/ai/describe`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ image: resizedImage }),
            });

            const data = await this.handleResponse<{ description: string }>(response);
            return data.description;
        } catch (err) {
            throw err instanceof Error ? err : new Error("An unexpected error occurred.");
        }
    }

    async edit(image: string, options: EditOptions): Promise<string> {
        try {
            const resizedImage = await resize(image);
            const headers = this.getHeaders();

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

            const data = await this.handleResponse<{ result: string }>(response);
            return data.result;
        } catch (err) {
            throw err instanceof Error ? err : new Error("An unexpected error occurred.");
        }
    }

    async tag(image: string, options: TagOptions): Promise<TagResponse> {
        try {
            const resizedImage = await resize(image);
            const headers = this.getHeaders();

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

            const data = await this.handleResponse<{ tags?: string[], result?: string[], tag?: string }>(response);

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

    async resize(input: string | File, maxWidth?: number, maxHeight?: number): Promise<string> {
        return resize(input, maxWidth, maxHeight);
    }
}
