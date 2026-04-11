import { resize } from './resize';

export interface CoreVizConfig {
    apiKey?: string;
    token?: string;
    /** Override the API base URL (default: https://lab.coreviz.io) */
    baseUrl?: string;
}

// ── Management types ────────────────────────────────────────────────────────

export interface UserContext {
    userId: string;
    email: string;
    name: string;
    organizationId: string;
    organizationName: string | null;
}

export interface Collection {
    id: string;
    name: string;
    icon?: string;
    type: string;
    organizationId: string;
}

export interface MediaObject {
    id: string;
    type: string;
    label: string;
}

export interface MediaFrame {
    id: string;
    timestamp: number;
    blob: string;
    objects: MediaObject[];
}

export interface Media {
    id: string;
    name: string;
    type: 'image' | 'video' | 'folder';
    blob: string | null;
    path: string;
    width?: number;
    height?: number;
    sizeBytes?: number;
    metadata?: Record<string, unknown>;
    frames?: MediaFrame[];
    createdAt?: string;
    _score?: number;
}

export interface Folder {
    id: string;
    name: string;
    path: string;
    collectionId: string;
}

export interface BrowseOptions {
    path?: string;
    limit?: number;
    offset?: number;
    type?: 'image' | 'video' | 'folder' | 'all';
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    tagFilters?: Record<string, string[]>;
    /** Text / semantic search query (triggers scored mode on the server) */
    q?: string;
    /** Object ID to find visually similar media within this collection */
    similarToObjectId?: string;
    /** Vision model used for similarity scoring */
    similarToObjectModel?: string;
    /** Comma-separated tag label filter */
    tags?: string;
    /** Filter to a specific media item ID */
    mediaId?: string;
    /** Filter to a specific cluster ID */
    clusterId?: string;
    /** When true, list all descendants recursively (flattened view) */
    recursive?: boolean;
}

export interface BrowseResult {
    media: Media[];
    pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}

export interface SearchResult {
    mediaId: string;
    mediaName: string;
    mediaType: string;
    blobUrl: string;
    objects: MediaObject[];
    rank: number;
    caption?: string;
}

export interface SearchOptions {
    limit?: number;
    /** Pass the organization ID directly to skip the /api/me round-trip. */
    organizationId?: string;
}

export interface FolderUpdateOptions {
    name?: string;
    metadata?: Record<string, unknown>;
}

export interface CollectionUpdateOptions {
    name?: string;
    icon?: string;
}

export interface DeleteVersionResult {
    deletedId: string;
    promotedId: string | null;
}

export interface SimilarityOptions {
    limit?: number;
    model?: string;
}

export interface UploadOptions {
    /** Target collection ID */
    collectionId: string;
    /** ltree folder path to upload into (e.g. "collectionId.folderId"). Defaults to collection root. */
    path?: string;
    /** Override the file name stored in CoreViz */
    name?: string;
}

export interface UploadResult {
    mediaId: string;
    url: string;
    message: string;
}

// ── Namespace interfaces ─────────────────────────────────────────────────────

export interface CollectionsNamespace {
    /**
     * List all collections in an organization.
     * @param organizationId - If omitted the SDK resolves it via /api/me (one extra round-trip).
     */
    list(organizationId?: string): Promise<Collection[]>;
    /** Get a single collection by ID */
    get(collectionId: string): Promise<Collection>;
    /** Create a new collection in the user's current organization */
    create(name: string, icon?: string): Promise<Collection>;
    /** Update a collection's name or icon */
    update(collectionId: string, updates: CollectionUpdateOptions): Promise<Collection>;
}

export interface MediaNamespace {
    /** Browse/list media items in a collection folder */
    browse(collectionId: string, options?: BrowseOptions): Promise<BrowseResult>;
    /** Semantic search across all org media */
    search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
    /** Get full details for a media item */
    get(mediaId: string): Promise<Media>;
    /** Rename a media item */
    rename(mediaId: string, name: string): Promise<Media>;
    /** Move a media item to a new ltree destination path */
    move(mediaId: string, destinationPath: string): Promise<{ id: string; newPath: string }>;
    /** Permanently delete a media item */
    delete(mediaId: string): Promise<void>;
    /** Add a tag group+value to a media item */
    addTag(mediaId: string, label: string, value: string): Promise<void>;
    /** Remove a specific tag value from a media item */
    removeTag(mediaId: string, label: string, value: string): Promise<void>;
    /** Remove an entire tag group (all values) from a media item */
    removeTagGroup(mediaId: string, label: string): Promise<void>;
    /** Rename a tag group across a media item */
    renameTagGroup(mediaId: string, oldLabel: string, newLabel: string): Promise<void>;
    /** List all versions of a media item */
    listVersions(mediaId: string): Promise<Media[]>;
    /** Delete a specific version; returns the promoted active version ID if applicable */
    deleteVersion(rootMediaId: string, versionId: string): Promise<DeleteVersionResult>;
    /** Mark a version as the active/current version */
    selectVersion(versionId: string): Promise<void>;
    /** Find visually similar media using an object ID */
    findSimilar(collectionId: string, objectId: string, options?: SimilarityOptions): Promise<BrowseResult>;
    /**
     * Upload a photo or video to CoreViz.
     * - Node.js: pass a local file path string
     * - Browser: pass a File or Blob object
     */
    upload(file: string | File | Blob, options: UploadOptions): Promise<UploadResult>;
}

export interface FoldersNamespace {
    /**
     * Create a folder inside a collection.
     * @param reuse - When true, return the existing folder if one with the same name already exists at that path (upsert).
     */
    create(collectionId: string, name: string, path?: string, reuse?: boolean): Promise<Folder>;
    /** Get a folder by ID */
    get(folderId: string): Promise<Folder>;
    /** Update a folder's name or metadata */
    update(folderId: string, updates: FolderUpdateOptions): Promise<Folder>;
    /** Delete a folder and all its contents */
    delete(folderId: string): Promise<void>;
}

export interface TagsNamespace {
    /** Aggregate all tag groups + values across a collection */
    list(collectionId: string): Promise<Record<string, string[]>>;
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
        this.apiKey = config.apiKey || (typeof process !== 'undefined' ? process.env.COREVIZ_API_KEY : undefined);
        this.token = config.token;
        this._baseUrl = config.baseUrl || 'https://lab.coreviz.io';

        // ── Management namespaces ────────────────────────────────────────────

        this.collections = {
            list: async (organizationId?: string): Promise<Collection[]> => {
                const orgId = organizationId || (await this._me()).organizationId;
                const data = await this._fetch<Collection[]>(`/api/organization/${orgId}/datasets`);
                return Array.isArray(data) ? data : (data as any).datasets ?? [];
            },

            get: async (collectionId: string): Promise<Collection> => {
                const data = await this._fetch<{ dataset: Collection }>(`/api/dataset/${collectionId}`);
                return data.dataset;
            },

            create: async (name: string, icon?: string): Promise<Collection> => {
                const { organizationId } = await this._me();
                const data = await this._fetchMethod<{ dataset: Collection }>('POST', `/api/organization/${organizationId}/datasets`, {
                    name,
                    ...(icon ? { icon } : {}),
                });
                return data.dataset;
            },

            update: async (collectionId: string, updates: CollectionUpdateOptions): Promise<Collection> => {
                const data = await this._fetchMethod<{ dataset: Collection }>('PATCH', `/api/dataset/${collectionId}`, updates);
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
                if (options.q) params.set('q', options.q);
                if (options.similarToObjectId) params.set('similarToObjectId', options.similarToObjectId);
                if (options.similarToObjectModel) params.set('similarToObjectModel', options.similarToObjectModel);
                if (options.tags) params.set('tags', options.tags);
                if (options.mediaId) params.set('mediaId', options.mediaId);
                if (options.clusterId) params.set('clusterId', options.clusterId);
                if (options.recursive) params.set('recursive', 'true');
                const qs = params.toString();
                return this._fetch<BrowseResult>(`/api/dataset/${collectionId}/media${qs ? `?${qs}` : ''}`);
            },

            search: async (query: string, options: SearchOptions = {}): Promise<SearchResult[]> => {
                const orgId = options.organizationId || (await this._me()).organizationId;
                const params = new URLSearchParams({ q: query, organizationId: orgId });
                if (options.limit != null) params.set('limit', String(options.limit));
                const data = await this._fetch<{ results: any[] }>(`/api/search?${params.toString()}`);
                return (data.results || []).map((r: any) => ({
                    mediaId: r.media?.id,
                    mediaName: r.media?.name,
                    mediaType: r.media?.type,
                    blobUrl: r.blob,
                    objects: (r.objects || []).map((o: any) => ({ id: o.id, type: o.type, label: o.label })),
                    rank: r.rank,
                    caption: r.captions?.[0]?.text,
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

            delete: async (mediaId: string): Promise<void> => {
                await this._fetchMethod('DELETE', `/api/media/${mediaId}`);
            },

            addTag: async (mediaId: string, label: string, value: string): Promise<void> => {
                await this._fetchMethod('POST', `/api/media/${mediaId}/tags`, { label, value });
            },

            removeTag: async (mediaId: string, label: string, value: string): Promise<void> => {
                await this._fetchMethod('DELETE', `/api/media/${mediaId}/tags`, { label, value });
            },

            removeTagGroup: async (mediaId: string, label: string): Promise<void> => {
                await this._fetchMethod('DELETE', `/api/media/${mediaId}/tags`, { label });
            },

            renameTagGroup: async (mediaId: string, oldLabel: string, newLabel: string): Promise<void> => {
                await this._fetchMethod('PATCH', `/api/media/${mediaId}/tags`, { oldLabel, newLabel });
            },

            listVersions: async (mediaId: string): Promise<Media[]> => {
                const data = await this._fetch<{ versions: Media[] }>(`/api/media/${mediaId}/versions`);
                return data.versions;
            },

            deleteVersion: async (rootMediaId: string, versionId: string): Promise<DeleteVersionResult> => {
                return this._fetchMethod('DELETE', `/api/media/${rootMediaId}/versions?versionId=${versionId}`);
            },

            selectVersion: async (versionId: string): Promise<void> => {
                await this._fetchMethod('PATCH', `/api/media/${versionId}/select-version`);
            },

            findSimilar: async (collectionId: string, objectId: string, options: SimilarityOptions = {}): Promise<BrowseResult> => {
                const params = new URLSearchParams({ similarToObjectId: objectId });
                if (options.limit != null) params.set('limit', String(options.limit));
                if (options.model) params.set('similarToObjectModel', options.model);
                return this._fetch<BrowseResult>(`/api/dataset/${collectionId}/media?${params.toString()}`);
            },

            upload: async (file: string | File | Blob, options: UploadOptions): Promise<UploadResult> => {
                const formData = new FormData();
                formData.append('datasetId', options.collectionId);
                if (options.path) formData.append('path', options.path);

                if (typeof file === 'string') {
                    // Node.js: treat as a file path — dynamic import fs to stay browser-compatible
                    const fs = await import('fs');
                    const path = await import('path');
                    const buffer = fs.readFileSync(file);
                    const ext = path.extname(file).slice(1).toLowerCase();
                    const mimeTypes: Record<string, string> = {
                        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
                        gif: 'image/gif', webp: 'image/webp', heic: 'image/heic',
                        mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
                    };
                    const contentType = mimeTypes[ext] || 'application/octet-stream';
                    const fileName = options.name || path.basename(file);
                    const blob = new Blob([buffer], { type: contentType });
                    formData.append('file', blob, fileName);
                    if (!options.name) formData.append('name', fileName);
                } else {
                    const fileName = options.name || (file instanceof File ? file.name : 'upload');
                    formData.append('file', file, fileName);
                    if (options.name) formData.append('name', options.name);
                }

                // Build headers without Content-Type (let fetch set the multipart boundary)
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
            create: async (collectionId: string, name: string, path?: string, reuse?: boolean): Promise<Folder> => {
                const data = await this._fetchMethod<{ folder: Folder }>('POST', '/api/folder', {
                    datasetId: collectionId,
                    name,
                    ...(path ? { path } : {}),
                    ...(reuse ? { reuse: true } : {}),
                });
                return data.folder;
            },

            get: async (folderId: string): Promise<Folder> => {
                const data = await this._fetch<{ folder: Folder }>(`/api/folder/${folderId}`);
                return data.folder;
            },

            update: async (folderId: string, updates: FolderUpdateOptions): Promise<Folder> => {
                const data = await this._fetchMethod<{ folder: Folder }>('PATCH', `/api/folder/${folderId}`, updates);
                return data.folder;
            },

            delete: async (folderId: string): Promise<void> => {
                await this._fetchMethod('DELETE', `/api/folder/${folderId}`);
            },
        };

        this.tags = {
            list: async (collectionId: string): Promise<Record<string, string[]>> => {
                const data = await this._fetch<{ tags: Record<string, string[]> }>(`/api/dataset/${collectionId}/tags`);
                return data.tags;
            },
        };
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        } else if (this.apiKey) {
            headers['x-api-key'] = this.apiKey;
        }
        // If neither is set, rely on session cookies (browser same-origin requests).
        return headers;
    }

    /** Resolve the current user's org ID (cached after first call) */
    private async _me(): Promise<UserContext> {
        const data = await this._fetch<UserContext>('/api/me');
        if (!this._orgIdCache) this._orgIdCache = data.organizationId;
        return data;
    }

    /** GET request helper for management endpoints */
    private async _fetch<T>(path: string): Promise<T> {
        const response = await fetch(`${this._baseUrl}${path}`, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        return this.handleResponse<T>(response);
    }

    /** Non-GET request helper for management endpoints */
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
            // Try to surface the server's error message from the response body.
            const body = await response.json().catch(() => null) as any;
            const serverMessage = body?.error || body?.message;
            throw new Error(serverMessage || `Request failed (${response.status})`);
        }

        const data = await response.json() as any;

        if (data.error) {
            throw new Error(data.error);
        }

        return data;
    }

    async describe(image: string, options?: DescribeOptions): Promise<string> {
        try {
            const resizedImage = await resize(image, 512, 512);
            const headers = this.getHeaders();

            const response = await fetch(`${this._baseUrl}/api/ai/describe`, {
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
            const resizedImage = await resize(image, 1024, 1024);
            const headers = this.getHeaders();

            const response = await fetch(`${this._baseUrl}/api/ai/edit`, {
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

    async generate(prompt: string, options: GenerateOptions = {}): Promise<string> {
        try {
            const headers = this.getHeaders();

            let resizedImages: string[] = [];
            if (options.referenceImages && options.referenceImages.length > 0) {
                resizedImages = await Promise.all(
                    options.referenceImages.map(img => resize(img, 1024, 1024))
                );
            }

            const response = await fetch(`${this._baseUrl}/api/ai/generate`, {
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
        } catch (err) {
            throw err instanceof Error ? err : new Error("An unexpected error occurred.");
        }
    }

    async tag(image: string, options: TagOptions): Promise<TagResponse> {
        const mode = options?.mode || 'api';

        if (mode === 'local') {
            return this.tagLocal(image, options);
        }

        try {
            const resizedImage = await resize(image, 512, 512);
            const headers = this.getHeaders();

            const response = await fetch(`${this._baseUrl}/api/ai/tag`, {
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

    private async tagLocal(imageInput: string, options: TagOptions): Promise<TagResponse> {
        try {
            // Dynamic import to avoid loading transformers if not used
            const {
                AutoProcessor,
                AutoModelForImageTextToText,
                RawImage,
                env
            } = await import('@huggingface/transformers');

            // Configure transformers.js for browser usage
            env.allowRemoteModels = true;

            const processor = await AutoProcessor.from_pretrained('onnx-community/FastVLM-0.5B-ONNX');
            const model = await AutoModelForImageTextToText.from_pretrained('onnx-community/FastVLM-0.5B-ONNX', {
                dtype: {
                    embed_tokens: "fp16",
                    vision_encoder: "q4",
                    decoder_model_merged: "q4",
                },
            });

            let rawImg;
            if (imageInput.startsWith('http')) {
                rawImg = await RawImage.fromURL(imageInput);
            } else if (imageInput.startsWith('data:image')) {
                const base64Data = imageInput.split(',')[1];
                const binary = atob(base64Data);
                const array = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    array[i] = binary.charCodeAt(i);
                }
                rawImg = await RawImage.fromBlob(new Blob([array]));
            } else {
                rawImg = await RawImage.read(imageInput);
            }

            let systemPrompt = `You are a precise image tagging AI.
Rules:
1. Return ONLY a comma-separated list of tags.
2. DO NOT provide any conversational text, introductions, or explanations.
3. DO NOT use full sentences.
4. If options are provided, select strictly from them.

Example 1:
What animals are in the image?
Example Output:
cat

Example 2:
What color cars are visible in the image?
Output:
red, blue, green

Example 3:
What is the jersey number of the player?
Output:
10
`;
            let userPrompt = `${options.prompt}`;

            if (options.options && options.options.length > 0) {
                userPrompt += `\nSelect from these options: ${options.options.join(', ')}.`;
            }
            if (!options.multiple) {
                userPrompt += `\nReturn a single tag.`;
            }

            const messages = [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                { role: 'user', content: `<image>\n${userPrompt}` },
            ];

            let promptText = processor.apply_chat_template(messages, {
                add_generation_prompt: true,
            });

            if (typeof promptText === 'string') {
                promptText += options.multiple ? "Tags: " : "Tag: ";
            }

            const inputs = await processor(rawImg, promptText, {
                add_special_tokens: false,
            });

            const outputs = await model.generate({
                ...inputs,
                max_new_tokens: 120,
                do_sample: false,
                repetition_penalty: 1.2,
            }) as any;

            const decoded = processor.batch_decode(
                outputs.slice(null, [inputs.input_ids.dims.at(-1), null]),
                { skip_special_tokens: true }
            );

            let resultText = decoded[0].trim();
            // Cleanup potential repetition of priming token
            resultText = resultText.replace(/^(Tags?:\s*)/i, '');

            let tags: string[] = [];
            if (options.multiple) {
                tags = resultText.split(',').map(s => s.trim()).filter(s => s.length > 0);
            } else {
                tags = [resultText];
            }

            return {
                tags,
                raw: { result: resultText }
            };

        } catch (err) {
            console.error(err);
            throw err instanceof Error ? err : new Error("Local tagging failed: " + String(err));
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
                const resizedImage = await resize(input, 512, 512);
                body.image = resizedImage;
            } else {
                body.text = input;
            }

            const response = await fetch(`${this._baseUrl}/api/ai/embed`, {
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
                RawImage
            } = await import('@huggingface/transformers');


            const MODEL_ID = 'Xenova/clip-vit-large-patch14';

            const start = Date.now();

            // Load tokenizer and processor
            const tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID,);
            const processor = await AutoProcessor.from_pretrained(MODEL_ID);

            // Load models with device preference
            const text_model = await CLIPTextModelWithProjection.from_pretrained(MODEL_ID, {
                dtype: 'q4',
            });
            const vision_model = await CLIPVisionModelWithProjection.from_pretrained(MODEL_ID, {
                dtype: 'q4',
            });

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
