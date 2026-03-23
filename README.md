[![The World's Most Powerful Visual Copilot](./demo/banner.png)](https://coreviz.io)

<div align="center">
    <h1>CoreViz</h1>
    <a href="https://coreviz.io/">Home</a>
    <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
    <a href="https://lab.coreviz.io/">Studio</a>
    <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
    <a href="https://github.com/coreviz/cli">CLI</a>
    <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
    <a href="https://github.com/coreviz/sdk">SDK</a>
    <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
    <a href="https://docs.coreviz.io/">Docs</a>
    <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
    <a href="https://x.com/withcoreviz">X</a>
    <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
    <a href="https://www.linkedin.com/company/coreviz/">LinkedIn</a>
    <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
    <a href="mailto:team@coreviz.io">Contact</a>
  <br />
  <br />

CoreViz is a Vision AI platform for teams and individuals working with thousands of visual assets.

  <p align="center">
    <a href="https://coreviz.io"><img alt="CoreViz" src="./demo/demo.gif"></a>
  </p>
</div>


# @coreviz/sdk

Easily integrate powerful image analysis and manipulation features into your applications with CoreViz (https://coreviz.io/) 's Vision SDK.

## Introduction

The CoreViz SDK powers the [coreviz.io](https://coreviz.io/) platform and the [CoreViz CLI](https://github.com/coreviz/cli), providing fast, consistent AI image analysis and manipulation capabilities across environments.

You can try out the live demos and tools built with this SDK at [coreviz.io/tools](https://coreviz.io/tools), including:

- **Image Description**: Generate detailed captions for any image. [→ Demo](https://coreviz.io/tools/describe)
- **Tagging / Classification**: Classify images with custom or general prompts. [→ Demo](https://coreviz.io/tools/tag)
- **Image Editing**: Modify or retouch images using generative AI based on text instructions. [→ Demo](https://coreviz.io/tools/edit)

Check out [coreviz.io/tools](https://coreviz.io/tools) to explore these features interactively.


## Installation

```bash
npm install @coreviz/sdk
```

### React Native / Expo

When using this SDK in Expo / React Native, install the Expo image utilities (used for `resize`):

```bash
npx expo install expo-image-manipulator expo-file-system
```

Notes:
- **Local mode** (`mode: 'local'`) for `tag()` / `embed()` is **not supported** on React Native / Expo.

## Configuration

To use the AI features, you need to instantiate the `CoreViz` class with your API key.

```typescript
import { CoreViz } from '@coreviz/sdk';

const coreviz = new CoreViz({
    apiKey: process.env.COREVIZ_API_KEY // or 'your_api_key_here'
});
```

## API Reference

### `coreviz.describe(image)`

Generates a detailed text description of an image.

**Parameters:**
- `image` (string): The image to describe. Can be a base64 string or a URL.

**Returns:**
- `Promise<string>`: A text description of the image.

**Example:**

```typescript
const description = await coreviz.describe('https://example.com/image.jpg');
console.log(description);
```

### `coreviz.tag(image, options)`

Analyzes an image and returns relevant tags or classifications based on a prompt.

**Parameters:**
- `image` (string): The image to analyze. Can be a base64 string or a URL.
- `options` (object):
  - `prompt` (string): The context or question to guide the tagging (e.g., "What objects are in this image?").
  - `options` (string[], optional): A specific list of tags to choose from.
  - `multiple` (boolean, optional): Whether to allow multiple tags (default: `true`).

**Returns:**
- `Promise<TagResponse>`: An object containing:
  - `tags` (string[]): The list of identified tags.
  - `raw` (unknown): The raw API response.

**Example:**

```typescript
const result = await coreviz.tag('base64_image_string...', {
  prompt: "Is this indoor or outdoor?",
  options: ["indoor", "outdoor"],
  multiple: false
});
console.log(result.tags); // ["indoor"]
```

### `coreviz.edit(image, options)`

Modifies an image based on a text prompt using generative AI.

**Parameters:**
- `image` (string): The image to edit. Can be a base64 string or a URL.
- `options` (object):
  - `prompt` (string): Description of the desired edit.
  - `aspectRatio` (string, optional): Target aspect ratio (`'match_input_image'`, `'1:1'`, `'16:9'`, `'9:16'`, `'4:3'`, `'3:4'`).
  - `outputFormat` (string, optional): `'jpg'` or `'png'`.
  - `model` (string, optional): The model to use (default: `'flux-kontext-max'`).

**Returns:**
- `Promise<string>`: The edited image as a base64 string or URL.

**Example:**

```typescript
const editedImage = await coreviz.edit('https://example.com/photo.jpg', {
  prompt: "Make it look like a painting",
  aspectRatio: "1:1"
});
```

### `coreviz.generate(prompt, options)`

Generates an image based on a text prompt, optionally using reference images for style/structure guidance.

**Parameters:**
- `prompt` (string): The text description of the image(s) to generate.
- `options` (object, optional):
  - `referenceImages` (string[], optional): Array of reference images (URL/base64) to guide generation.
  - `aspectRatio` (string, optional): Target aspect ratio (e.g., `'1:1'`, `'16:9'`, `'4:3'`).
  - `model` (string, optional): The model to use (default: `'google/nano-banana-pro'`).

**Returns:**
- `string`: The generated images as a URL.

**Example:**

```typescript
const images = await coreviz.generate("A futuristic city skyline", {
  aspectRatio: "16:9"
});
```

### `coreviz.embed(input, options?)`

Generates embeddings for image or text inputs, enabling semantic search and similarity comparison. Use with `coreviz.similarity(embeddingA, embeddingB)` to compare two images or an image and a text.

**Parameters:**
- `input` (string): The text string or image (URL/base64) to embed.
- `options` (object, optional):
  - `type` ('image' | 'text', optional): Explicitly define the input type.
  - `mode` ('api' | 'local', optional): Execution mode (default: `'api'`). `'local'` runs in-browser/node using transformers.js.

**Returns:**
- `Promise<EmbedResponse>`: An object containing:
  - `embedding` (number[]): The high-dimensional vector representation.

**Example:**

```typescript
const { embedding } = await coreviz.embed('A photo of a sunset');
```

### `coreviz.similarity(embeddingA, embeddingB)`

Calculates the degree of similarity between two embeddings.

**Parameters:**
- `embeddingA` (number[]): The first image/text embedding.
- `embeddingB` (number[]): The second image/text embedding.

**Returns:**
- `number`: A similarity score between -1 and 1.

**Example:**

```typescript
const similarity = coreviz.similarity(embeddingA, embeddingB);
```

### `coreviz.resize(input, maxWidth?, maxHeight?)`

Utility function to resize images client-side or server-side before processing. Also available as a standalone import.

**Parameters:**
- `input` (string | File): The image to resize.
- `maxWidth` (number, optional): Maximum width (default: 1920).
- `maxHeight` (number, optional): Maximum height (default: 1080).

**Returns:**
- `Promise<string>`: The resized image as a base64 string.

**Example:**

```typescript
const resized = await coreviz.resize(myFileObject, 800, 600);
// or import { resize } from '@coreviz/sdk';
```

---

## Library Management API

The SDK also exposes namespaced methods for programmatically managing your CoreViz visual library — browsing datasets, searching media, organizing folders, and managing tags. These require authentication via a user token (from `coreviz login`) or an API key.

```typescript
const coreviz = new CoreViz({ token: 'your_session_token' });
// or: new CoreViz({ apiKey: 'your_api_key' })
// or: new CoreViz({ token, baseUrl: 'http://localhost:3000' }) // for local dev
```

### `coreviz.datasets.list()`

List all collections in the user's current organization.

**Returns:** `Promise<Dataset[]>`

```typescript
const datasets = await coreviz.datasets.list();
// [{ id, name, icon, type, organizationId }, ...]
```

---

### `coreviz.media.browse(datasetId, options?)`

List media items and folders inside a dataset. Navigates the ltree folder hierarchy.

**Parameters:**
- `datasetId` (string): The dataset to browse.
- `options` (object, optional):
  - `path` (string): ltree path to list (e.g. `"datasetId.folderId"`). Defaults to dataset root.
  - `limit` / `offset` (number): Pagination.
  - `type` (`'image' | 'video' | 'folder' | 'all'`): Filter by type.
  - `dateFrom` / `dateTo` (string): Filter by creation date (`YYYY-MM-DD`).
  - `sortBy` / `sortDirection`: Sort options.
  - `tagFilters` (`Record<string, string[]>`): Filter by tag groups.

**Returns:** `Promise<BrowseResult>` — `{ media: Media[], pagination }`

```typescript
const { media } = await coreviz.media.browse('abc123', { path: 'abc123.folderXyz', limit: 50 });
```

---

### `coreviz.media.search(query, options?)`

Semantically search across all media in the organization using natural language.

**Parameters:**
- `query` (string): Natural language search query.
- `options.limit` (number, optional): Max results (default 20).

**Returns:** `Promise<SearchResult[]>` — each result includes `mediaId`, `blobUrl`, `objects`, `rank`, `caption`.

```typescript
const results = await coreviz.media.search('red shoes on a white background', { limit: 10 });
```

---

### `coreviz.media.get(mediaId)`

Get full details for a media item: blob URL, dimensions, tags, detected objects, and version info.

**Returns:** `Promise<Media>`

```typescript
const item = await coreviz.media.get('mediaId123');
console.log(item.blob, item.metadata?.tags, item.frames);
```

---

### `coreviz.media.rename(mediaId, name)`

Rename a media item.

**Returns:** `Promise<Media>`

```typescript
await coreviz.media.rename('mediaId123', 'hero-shot-final.jpg');
```

---

### `coreviz.media.move(mediaId, destinationPath)`

Move a media item or folder to a different location within the same dataset.

**Parameters:**
- `destinationPath` (string): ltree path of the destination folder (e.g. `"datasetId.targetFolder"`).

**Returns:** `Promise<{ id, newPath }>`

```typescript
await coreviz.media.move('mediaId123', 'datasetId.archiveFolder');
```

---

### `coreviz.media.addTag(mediaId, label, value)` / `removeTag(...)`

Add or remove a tag from a media item. Tags are `label` (group) + `value` pairs.

```typescript
await coreviz.media.addTag('mediaId123', 'color', 'red');
await coreviz.media.removeTag('mediaId123', 'color', 'red');
```

---

### `coreviz.media.findSimilar(datasetId, objectId, options?)`

Find visually similar media using a detected object ID (from `media.get()` frames).

**Parameters:**
- `objectId` (string): ID of a detected object to use as the similarity query.
- `options.model` (string): `'faces'`, `'objects'`, or `'shoeprints'`.

**Returns:** `Promise<BrowseResult>`

```typescript
const similar = await coreviz.media.findSimilar('datasetId', 'objectId456', { model: 'faces' });
```

---

### `coreviz.folders.create(datasetId, name, path?)`

Create a new folder inside a dataset.

**Returns:** `Promise<Folder>`

```typescript
const folder = await coreviz.folders.create('datasetId', 'Spring 2025', 'datasetId.campaigns');
```

---

### `coreviz.tags.list(datasetId)`

Aggregate all tag groups and values across an entire dataset.

**Returns:** `Promise<Record<string, string[]>>`

```typescript
const tags = await coreviz.tags.list('datasetId');
// { color: ['red', 'blue'], category: ['product', 'lifestyle'] }
```

---

### `coreviz.media.upload(file, options)`

Upload a photo or video to CoreViz.

**Parameters:**
- `file`: Local file path string (Node.js), `File` object (browser), or `Blob`
- `options`:
  - `datasetId` (string, required): Target dataset
  - `path` (string, optional): ltree folder path (e.g. `"datasetId.folderId"`). Defaults to dataset root.
  - `name` (string, optional): Override the file name stored in CoreViz

**Returns:** `Promise<UploadResult>` — `{ mediaId, url, message }`

**Supported formats:** JPEG, PNG, GIF, WebP, HEIC, MP4, WebM, MOV, AVI

```typescript
// Node.js — local file path
const result = await coreviz.media.upload('/path/to/photo.jpg', {
  datasetId: 'abc123',
  path: 'abc123.campaignFolder',
  name: 'hero-shot.jpg',
});
console.log(result.mediaId, result.url);

// Browser — File object
const result = await coreviz.media.upload(fileInputEvent.target.files[0], {
  datasetId: 'abc123',
});
```

> **Note:** File path strings are not supported on React Native / Expo. Pass a `File` or `Blob` object instead.
