export interface EditOptions {
    prompt: string;
    aspectRatio?: 'match_input_image' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    outputFormat?: 'jpg' | 'png';
    model?: 'flux-kontext-max' | 'google/nano-banana' | 'seedream-4';
}
export declare function edit(image: string, options: EditOptions): Promise<string | undefined>;
