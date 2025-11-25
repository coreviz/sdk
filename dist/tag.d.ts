export interface TagOptions {
    prompt: string;
    options?: string[];
    multiple?: boolean;
}
export interface TagResponse {
    tags: string[];
    raw?: unknown;
}
export declare function tag(image: string, options: TagOptions): Promise<TagResponse>;
