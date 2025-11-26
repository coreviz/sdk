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

export interface EmbedOptions {
    type?: 'image' | 'text';
    mode?: 'api' | 'local';
}

export interface EmbedResponse {
    embedding: number[];
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

    async embed(input: string, options?: EmbedOptions): Promise<EmbedResponse> {
        const mode = options?.mode || 'api';

        if (mode === 'local') {
            return this.embedLocal(input, options);
        }

        try {
            const headers = this.getHeaders();
            let body: { image?: string; text?: string } = {};

            // Determine type
            let isImage = false;
            if (options?.type) {
                isImage = options.type === 'image';
            } else {
                // Heuristic: Check if input starts with data:image or http
                // Assuming http/https implies image URL in this context unless specified otherwise
                isImage = input.startsWith('data:image') || input.startsWith('http://') || input.startsWith('https://');
            }

            if (isImage) {
                const resizedImage = await resize(input);
                body.image = resizedImage;
            } else {
                body.text = input;
            }

            const response = await fetch("https://lab.coreviz.io/api/ai/embed", {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            const data = await this.handleResponse<EmbedResponse>(response);
            return data;
        } catch (err) {
            throw err instanceof Error ? err : new Error("An unexpected error occurred.");
        }
    }

    private async embedLocal(input: string, options?: EmbedOptions): Promise<EmbedResponse> {
        try {
            // Dynamic import to avoid loading transformers if not used
            const {
                AutoTokenizer,
                AutoProcessor,
                CLIPTextModelWithProjection,
                CLIPVisionModelWithProjection,
                RawImage,
                env
            } = await import('@huggingface/transformers');

            // Force browser backend to use webgpu if available
            // @ts-ignore
            if (typeof navigator !== 'undefined' && navigator.gpu && env.backends?.onnx?.wasm) {
                // @ts-ignore
                env.backends.onnx.wasm.proxy = false;
            }

            const MODEL_ID = 'Xenova/clip-vit-large-patch14';
            const device = 'webgpu';

            console.log(`Loading local model ${MODEL_ID}...`);
            const start = Date.now();

            // Load tokenizer and processor
            const tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID);
            const processor = await AutoProcessor.from_pretrained(MODEL_ID);

            // Load models with device preference
            const text_model = await CLIPTextModelWithProjection.from_pretrained(MODEL_ID, {
                device: device,
            });
            const vision_model = await CLIPVisionModelWithProjection.from_pretrained(MODEL_ID, {
                device: device,
            });

            console.log(`Model loaded in ${Date.now() - start}ms`);

            // Check if input is likely an image
            const isImage = options?.type === 'image' ||
                input.startsWith('data:image') ||
                input.startsWith('http://') ||
                input.startsWith('https://') ||
                /\.(jpg|jpeg|png|webp|gif|bmp|tiff|tif)$/i.test(input);

            let normalized_embeds;

            if (isImage) {
                let image;
                if (input.startsWith('http')) {
                    image = await RawImage.fromURL(input);
                } else if (input.startsWith('data:image')) {
                    // Extract base64 data
                    const base64Data = input.split(',')[1];
                    const binary = atob(base64Data);
                    const array = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) {
                        array[i] = binary.charCodeAt(i);
                    }
                    image = await RawImage.fromBlob(new Blob([array]));
                } else {
                    // Assume local path
                    image = await RawImage.read(input);
                }

                const image_inputs = await processor(image);
                const { image_embeds } = await vision_model(image_inputs);
                normalized_embeds = image_embeds.normalize(2, -1);
            } else {
                const text_inputs = tokenizer(input, {
                    padding: true,
                    truncation: true,
                    return_tensors: 'pt',
                });
                const { text_embeds } = await text_model(text_inputs);
                normalized_embeds = text_embeds.normalize(2, -1);
            }

            // Convert Float32Array to regular array
            // @ts-ignore
            const embedding = Array.from(normalized_embeds.data) as number[];

            return { embedding };
        } catch (err) {
            console.error(err);
            throw err instanceof Error ? err : new Error("Local embedding failed: " + String(err));
        }
    }

    async resize(input: string | File, maxWidth?: number, maxHeight?: number): Promise<string> {
        return resize(input, maxWidth, maxHeight);
    }
}
