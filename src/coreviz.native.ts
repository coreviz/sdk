import { resize } from './resize.native';

export interface CoreVizConfig {
  apiKey?: string;
  token?: string;
  /** Override the API base URL (default: https://lab.coreviz.io) */
  baseUrl?: string;
}

// ── Management types ─────────────────────────────────────────────────────────

export interface UserContext {
  userId: string; email: string; name: string;
  organizationId: string; organizationName: string | null;
}
export interface Collection { id: string; name: string; icon?: string; type: string; organizationId: string; }
export interface MediaObject { id: string; type: string; label: string; }
export interface MediaFrame { id: string; timestamp: number; blob: string; objects: MediaObject[]; }
export interface Media {
  id: string; name: string; type: 'image' | 'video' | 'folder'; blob: string | null;
  path: string; width?: number; height?: number; sizeBytes?: number;
  metadata?: Record<string, unknown>; frames?: MediaFrame[]; createdAt?: string; _score?: number;
}
export interface Folder { id: string; name: string; path: string; datasetId: string; }
export interface BrowseOptions {
  path?: string; limit?: number; offset?: number; type?: 'image' | 'video' | 'folder' | 'all';
  dateFrom?: string; dateTo?: string; sortBy?: string; sortDirection?: 'asc' | 'desc';
  tagFilters?: Record<string, string[]>;
}
export interface BrowseResult {
  media: Media[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}
export interface SearchResult {
  mediaId: string; mediaName: string; mediaType: string; blobUrl: string;
  objects: MediaObject[]; rank: number; caption?: string;
}
export interface SearchOptions { limit?: number; }
export interface SimilarityOptions { limit?: number; model?: string; }
export interface UploadOptions { collectionId: string; path?: string; name?: string; }
export interface UploadResult { mediaId: string; url: string; message: string; }

export interface CollectionsNamespace {
  list(): Promise<Collection[]>;
  create(name: string, icon?: string): Promise<Collection>;
}
export interface MediaNamespace {
  browse(collectionId: string, options?: BrowseOptions): Promise<BrowseResult>;
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  get(mediaId: string): Promise<Media>;
  rename(mediaId: string, name: string): Promise<Media>;
  move(mediaId: string, destinationPath: string): Promise<{ id: string; newPath: string }>;
  addTag(mediaId: string, label: string, value: string): Promise<void>;
  removeTag(mediaId: string, label: string, value: string): Promise<void>;
  findSimilar(collectionId: string, objectId: string, options?: SimilarityOptions): Promise<BrowseResult>;
  upload(file: string | File | Blob, options: UploadOptions): Promise<UploadResult>;
}
export interface FoldersNamespace { create(collectionId: string, name: string, path?: string): Promise<Folder>; }
export interface TagsNamespace { list(collectionId: string): Promise<Record<string, string[]>>; }

export interface DescribeOptions { }

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

export interface GenerateOptions {
  referenceImages?: string[];
  aspectRatio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
  model?: 'google/nano-banana' | 'google/nano-banana-pro' | 'seedream-4' | 'flux-kontext-max';
}

export class CoreViz {
  private apiKey?: string;
  private token?: string;
  private _baseUrl: string;
  private _orgIdCache: string | null = null;

  public collections: CollectionsNamespace;
  public media: MediaNamespace;
  public folders: FoldersNamespace;
  public tags: TagsNamespace;

  constructor(config: CoreVizConfig = {}) {
    // React Native / Expo doesn't provide `process.env` in the same way; keep config explicit.
    this.apiKey = config.apiKey;
    this.token = config.token;
    this._baseUrl = config.baseUrl || 'https://lab.coreviz.io';

    this.collections = {
      list: async (): Promise<Collection[]> => {
        const { organizationId } = await this._me();
        const data = await this._fetch<Collection[]>(`/api/organization/${organizationId}/datasets`);
        return Array.isArray(data) ? data : (data as any).datasets ?? [];
      },
      create: async (name: string, icon?: string): Promise<Collection> => {
        const { organizationId } = await this._me();
        const data = await this._fetchMethod<{ dataset: Collection }>('POST', `/api/organization/${organizationId}/datasets`, { name, icon });
        return data.dataset;
      },
    };

    this.media = {
      browse: async (collectionId: string, options: BrowseOptions = {}): Promise<BrowseResult> => {
        const params = new URLSearchParams();
        if (options.path) params.set('path', options.path);
        if (options.limit != null) params.set('limit', String(options.limit));
        if (options.offset != null) params.set('offset', String(options.offset));
        if (options.type) params.set('type', options.type);
        if (options.dateFrom) params.set('dateFrom', options.dateFrom);
        if (options.dateTo) params.set('dateTo', options.dateTo);
        if (options.sortBy) params.set('sortBy', options.sortBy);
        if (options.sortDirection) params.set('sortDirection', options.sortDirection);
        if (options.tagFilters) params.set('tagFilters', JSON.stringify(options.tagFilters));
        const qs = params.toString();
        return this._fetch<BrowseResult>(`/api/dataset/${collectionId}/media${qs ? `?${qs}` : ''}`);
      },
      search: async (query: string, options: SearchOptions = {}): Promise<SearchResult[]> => {
        const { organizationId } = await this._me();
        const params = new URLSearchParams({ q: query, organizationId });
        if (options.limit != null) params.set('limit', String(options.limit));
        const data = await this._fetch<{ results: any[] }>(`/api/search?${params.toString()}`);
        return (data.results || []).map((r: any) => ({
          mediaId: r.media?.id, mediaName: r.media?.name, mediaType: r.media?.type,
          blobUrl: r.blob, objects: (r.objects || []).map((o: any) => ({ id: o.id, type: o.type, label: o.label })),
          rank: r.rank, caption: r.captions?.[0]?.text,
        }));
      },
      get: async (mediaId: string): Promise<Media> => {
        const data = await this._fetch<{ media: Media }>(`/api/media/${mediaId}`);
        return data.media;
      },
      rename: async (mediaId: string, name: string): Promise<Media> => {
        const data = await this._fetchMethod<{ media: Media }>('PATCH', `/api/media/${mediaId}`, { name });
        return data.media;
      },
      move: async (mediaId: string, destinationPath: string): Promise<{ id: string; newPath: string }> => {
        return this._fetchMethod('PATCH', `/api/media/${mediaId}/move`, { destinationPath });
      },
      addTag: async (mediaId: string, label: string, value: string): Promise<void> => {
        await this._fetchMethod('POST', `/api/media/${mediaId}/tags`, { label, value });
      },
      removeTag: async (mediaId: string, label: string, value: string): Promise<void> => {
        await this._fetchMethod('DELETE', `/api/media/${mediaId}/tags`, { label, value });
      },
      findSimilar: async (collectionId: string, objectId: string, options: SimilarityOptions = {}): Promise<BrowseResult> => {
        const params = new URLSearchParams({ similarToObjectId: objectId });
        if (options.limit != null) params.set('limit', String(options.limit));
        if (options.model) params.set('similarToObjectModel', options.model);
        return this._fetch<BrowseResult>(`/api/dataset/${collectionId}/media?${params.toString()}`);
      },

      upload: async (file: string | File | Blob, options: UploadOptions): Promise<UploadResult> => {
        if (typeof file === 'string') {
          throw new Error('File path strings are not supported on React Native. Pass a File or Blob object instead.');
        }
        const formData = new FormData();
        formData.append('datasetId', options.collectionId);
        if (options.path) formData.append('path', options.path);
        const fileName = options.name || (file instanceof File ? file.name : 'upload');
        formData.append('file', file as any, fileName);
        if (options.name) formData.append('name', options.name);

        const authHeaders: Record<string, string> = {};
        if (this.token) {
          authHeaders['Authorization'] = `Bearer ${this.token}`;
        } else {
          authHeaders['x-api-key'] = this.apiKey || '';
        }

        const response = await fetch(`${this._baseUrl}/api/upload/multipart`, {
          method: 'POST',
          headers: authHeaders,
          body: formData,
        });

        return this.handleResponse<UploadResult>(response);
      },
    };

    this.folders = {
      create: async (collectionId: string, name: string, path?: string): Promise<Folder> => {
        const data = await this._fetchMethod<{ folder: Folder }>('POST', '/api/folder', {
          datasetId: collectionId, name, ...(path ? { path } : {}),
        });
        return data.folder;
      },
    };

    this.tags = {
      list: async (collectionId: string): Promise<Record<string, string[]>> => {
        const data = await this._fetch<{ tags: Record<string, string[]> }>(`/api/dataset/${collectionId}/tags`);
        return data.tags;
      },
    };
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

  private async _me(): Promise<UserContext> {
    const data = await this._fetch<UserContext>('/api/me');
    if (!this._orgIdCache) this._orgIdCache = data.organizationId;
    return data;
  }

  private async _fetch<T>(path: string): Promise<T> {
    const response = await fetch(`${this._baseUrl}${path}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  private async _fetchMethod<T = void>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this._baseUrl}${path}`, {
      method,
      headers: this.getHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (response.status === 204) return undefined as T;
    return this.handleResponse<T>(response);
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

  async generate(prompt: string, options: GenerateOptions = {}): Promise<string> {
    const headers = this.getHeaders();

    let resizedImages: string[] = [];
    if (options.referenceImages && options.referenceImages.length > 0) {
      resizedImages = await Promise.all(options.referenceImages.map((img) => resize(img, 1024, 1024)));
    }

    const response = await fetch(`https://lab.coreviz.io/api/ai/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt,
        image: resizedImages.length > 0 ? resizedImages : undefined,
        aspectRatio: options.aspectRatio,
        model: options.model || 'google/nano-banana-pro',
      }),
    });

    const data = await this.handleResponse<{ result: string }>(response);
    return data.result;
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




