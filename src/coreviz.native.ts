import { resize } from './resize.native';

export interface CoreVizConfig {
  apiKey?: string;
  token?: string;
}

export interface DescribeOptions {}

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
  mode?: 'api' | 'local';
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

export interface BatchGenerateOptions {
  referenceImages?: string[];
  count?: number;
  aspectRatio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
  model?: 'google/nano-banana' | 'google/nano-banana-pro';
}

export class CoreViz {
  private apiKey?: string;
  private token?: string;

  constructor(config: CoreVizConfig = {}) {
    // React Native / Expo doesn't provide `process.env` in the same way; keep config explicit.
    this.apiKey = config.apiKey;
    this.token = config.token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else {
      headers['x-api-key'] = this.apiKey || '';
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

    const data = (await response.json()) as any;

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  }

  async describe(image: string, _options?: DescribeOptions): Promise<string> {
    const resizedImage = await resize(image, 512, 512);
    const headers = this.getHeaders();

    const response = await fetch(`https://lab.coreviz.io/api/ai/describe`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ image: resizedImage }),
    });

    const data = await this.handleResponse<{ description: string }>(response);
    return data.description;
  }

  async edit(image: string, options: EditOptions): Promise<string> {
    const resizedImage = await resize(image, 1024, 1024);
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
  }

  async batchGenerate(prompt: string, options: BatchGenerateOptions = {}): Promise<string[]> {
    const headers = this.getHeaders();

    let resizedImages: string[] = [];
    if (options.referenceImages && options.referenceImages.length > 0) {
      resizedImages = await Promise.all(options.referenceImages.map((img) => resize(img, 1024, 1024)));
    }

    const response = await fetch(`https://lab.coreviz.io/api/ai/batch-generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt,
        image: resizedImages.length > 0 ? resizedImages : undefined,
        count: options.count || 1,
        aspectRatio: options.aspectRatio,
        model: options.model || 'google/nano-banana-pro',
      }),
    });

    const data = await this.handleResponse<{ results: string[] }>(response);
    return data.results || [];
  }

  async tag(image: string, options: TagOptions): Promise<TagResponse> {
    const mode = options?.mode || 'api';
    if (mode === 'local') {
      throw new Error("Local tagging is not supported on React Native/Expo. Use `mode: 'api'`.");
    }

    const resizedImage = await resize(image, 512, 512);
    const headers = this.getHeaders();

    const response = await fetch('https://lab.coreviz.io/api/ai/tag', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        image: resizedImage,
        prompt: options.prompt,
        options: options.options && options.options.length > 0 ? options.options : undefined,
        multiple: options.multiple ?? true,
      }),
    });

    const data = await this.handleResponse<{ tags?: string[]; result?: string[]; tag?: string }>(response);

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

  async embed(input: string, options?: EmbedOptions): Promise<EmbedResponse> {
    const mode = options?.mode || 'api';
    if (mode === 'local') {
      throw new Error("Local embedding is not supported on React Native/Expo. Use `mode: 'api'`.");
    }

    const headers = this.getHeaders();
    let body: { image?: string; text?: string } = {};

    // Determine type
    let isImage = false;
    if (options?.type) {
      isImage = options.type === 'image';
    } else {
      // Heuristic: assume URL/data:image => image
      isImage = input.startsWith('data:image') || input.startsWith('http://') || input.startsWith('https://') || input.startsWith('file://');
    }

    if (isImage) {
      const resizedImage = await resize(input, 512, 512);
      body.image = resizedImage;
    } else {
      body.text = input;
    }

    const response = await fetch('https://lab.coreviz.io/api/ai/embed', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await this.handleResponse<EmbedResponse>(response);
    return data;
  }

  async resize(input: string | File, maxWidth?: number, maxHeight?: number): Promise<string> {
    return resize(input, maxWidth, maxHeight);
  }

  similarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}


