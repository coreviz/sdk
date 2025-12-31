/**
 * React Native / Expo image resize implementation.
 *
 * - Uses `expo-image-manipulator` to resize while preserving aspect ratio (fit: inside).
 * - Supports inputs:
 *   - `file://...` URIs (typical from Expo ImagePicker/Camera)
 *   - `data:image/...;base64,...` data URLs
 *   - `http(s)://...` URLs (downloaded to cache first)
 *
 * Dependencies (expected to be installed by Expo apps):
 * - expo-image-manipulator
 * - expo-file-system
 */

type ResizeInput = string | File;

function isDataUrl(s: string): boolean {
    return /^data:image\/\w+;base64,/.test(s);
}

function isHttpUrl(s: string): boolean {
    return /^https?:\/\//.test(s);
}

function getExtFromDataUrl(dataUrl: string): 'jpg' | 'png' {
    const m = dataUrl.match(/^data:(image\/\w+);base64,/);
    const mime = m?.[1] || 'image/jpeg';
    return mime.includes('png') ? 'png' : 'jpg';
}

function fitInside(width: number, height: number, maxWidth: number, maxHeight: number): { width: number; height: number } {
    if (width <= 0 || height <= 0) return { width, height };
    const wRatio = maxWidth / width;
    const hRatio = maxHeight / height;
    const ratio = Math.min(wRatio, hRatio, 1); // never enlarge
    return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

async function getImageSize(uri: string): Promise<{ width: number; height: number }> {
    // Importing from 'react-native' is safe for RN builds; this file is never used in web/node builds.
    const { Image } = await import('react-native');
    return await new Promise((resolve, reject) => {
        Image.getSize(
            uri,
            (width: number, height: number) => resolve({ width, height }),
            (error: any) => reject(error),
        );
    });
}

async function ensureLocalFileUri(input: string): Promise<{ uri: string; format: 'jpg' | 'png' }> {
    const FileSystem = await import('expo-file-system/legacy');
    const cacheDir = FileSystem.cacheDirectory;

    // data URL -> write to cache
    if (isDataUrl(input)) {
        const format = getExtFromDataUrl(input);
        const base64Data = input.split(',')[1] || '';
        const fileUri = `${cacheDir}coreviz_${Date.now()}.${format}`;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
        return { uri: fileUri, format };
    }

    // http(s) URL -> download to cache
    if (isHttpUrl(input)) {
        const format: 'jpg' | 'png' = input.toLowerCase().includes('.png') ? 'png' : 'jpg';
        const fileUri = `${cacheDir}coreviz_${Date.now()}.${format}`;
        const res = await FileSystem.downloadAsync(input, fileUri);
        return { uri: res.uri, format };
    }

    // assume it's already a local file URI (file://...) or a content URI
    return { uri: input, format: 'jpg' };
}

export async function resize(input: ResizeInput, maxWidth = 1920, maxHeight = 1080): Promise<string> {
    if (typeof input !== 'string') {
        throw new Error('React Native resizing only supports string inputs (file URI, data URL, or http(s) URL).');
    }

    // Lazy import to keep this module Expo-safe and avoid forcing deps in web/node builds.
    let ImageManipulator: typeof import('expo-image-manipulator');
    try {
        ImageManipulator = await import('expo-image-manipulator');
    } catch (e) {
        throw new Error(
            "Missing optional dependency 'expo-image-manipulator'. Install it in your Expo app: `npx expo install expo-image-manipulator`",
        );
    }

    const { uri, format } = await ensureLocalFileUri(input);

    const { width, height } = await getImageSize(uri);
    const target = fitInside(width, height, maxWidth, maxHeight);

    // If already within constraints, still normalize to a data URL (so downstream API calls always have base64 available).
    const actions =
        target.width === width && target.height === height ? [] : [{ resize: { width: target.width, height: target.height } }];

    const saveFormat =
        format === 'png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG;

    const result = await ImageManipulator.manipulateAsync(uri, actions as any, {
        base64: true,
        compress: saveFormat === ImageManipulator.SaveFormat.JPEG ? 0.92 : 1,
        format: saveFormat,
    });

    if (!result.base64) {
        throw new Error('Failed to produce base64 output during resize.');
    }

    const mime = saveFormat === ImageManipulator.SaveFormat.PNG ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${result.base64}`;
}




