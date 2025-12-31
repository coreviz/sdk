// Minimal type stubs so this package can be built without installing React Native / Expo typings.
// These are only used by the React Native entrypoints (`*.native.ts`) at compile-time.

declare module 'react-native' {
    export const Image: {
        getSize: (
            uri: string,
            success: (width: number, height: number) => void,
            failure?: (error: any) => void,
        ) => void;
    };
}

declare module 'expo-file-system/legacy' {
    export const cacheDirectory: string | null;

    export const EncodingType: {
        Base64: 'base64';
        UTF8: 'utf8';
    };

    export function writeAsStringAsync(
        fileUri: string,
        contents: string,
        options?: { encoding?: typeof EncodingType[keyof typeof EncodingType] },
    ): Promise<void>;

    export function downloadAsync(
        uri: string,
        fileUri: string,
        options?: Record<string, unknown>,
    ): Promise<{ uri: string }>;
}

declare module 'expo-image-manipulator' {
    export enum SaveFormat {
        JPEG = 'jpeg',
        PNG = 'png',
        WEBP = 'webp',
    }

    export type Action =
        | {
            resize: {
                width?: number;
                height?: number;
            };
        }
        | Record<string, unknown>;

    export function manipulateAsync(
        uri: string,
        actions: Action[],
        options?: {
            base64?: boolean;
            compress?: number;
            format?: SaveFormat;
        },
    ): Promise<{ uri: string; base64?: string; width?: number; height?: number }>;
}




