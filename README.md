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

```typescript
import { CoreViz } from '@coreviz/sdk';

// External use — API key
const coreviz = new CoreViz({ apiKey: process.env.COREVIZ_API_KEY });

// CLI / server — session token
const coreviz = new CoreViz({ token: 'your_session_token' });

// Self-hosted or local dev — override base URL
const coreviz = new CoreViz({ apiKey: '...', baseUrl: 'http://localhost:3000' });

// Browser same-origin — no credentials needed; session cookie is used automatically
const coreviz = new CoreViz({ baseUrl: window.location.origin });
```

---

## Vision AI Methods

### `coreviz.describe(image)`

Generates a detailed text description of an image.

**Parameters:**
- `image` (string): Base64 data URL or remote URL.

**Returns:** `Promise<string>`

```typescript
const description = await coreviz.describe('https://example.com/image.jpg');
```

---

### `coreviz.tag(image, options)`

Analyzes an image and returns tags or classifications based on a prompt.

**Parameters:**
- `image` (string): Base64 data URL or remote URL.
- `options`:
  - `prompt` (string): Question to guide tagging (e.g. `"What color is the car?"`).
  - `options` (string[], optional): Restrict answers to this list.
  - `multiple` (boolean, optional): Allow multiple tags (default: `true`).
  - `mode` (`'api' | 'local'`, optional): `'local'` runs fully in-browser via transformers.js.

**Returns:** `Promise<TagResponse>` — `{ tags: string[], raw }`

```typescript
const { tags } = await coreviz.tag(imageUrl, {
  prompt: 'Is this indoor or outdoor?',
  options: ['indoor', 'outdoor'],
  multiple: false,
});
```

---

### `coreviz.edit(image, options)`

Edits an image using a generative AI prompt.

**Parameters:**
- `image` (string): Base64 data URL or remote URL.
- `options`:
  - `prompt` (string): Description of the desired edit.
  - `aspectRatio` (string, optional): `'match_input_image'` | `'1:1'` | `'16:9'` | `'9:16'` | `'4:3'` | `'3:4'`.
  - `outputFormat` (`'jpg' | 'png'`, optional).
  - `model` (string, optional): `'flux-kontext-max'` | `'google/nano-banana'` | `'seedream-4'`. Default: `'flux-kontext-max'`.

**Returns:** `Promise<string>` — edited image URL or base64.

```typescript
const edited = await coreviz.edit('https://example.com/photo.jpg', {
  prompt: 'Make it look like a watercolor painting',
  aspectRatio: '1:1',
});
```

---

### `coreviz.generate(prompt, options?)`

Generates an image from a text prompt, optionally guided by reference images.

**Parameters:**
- `prompt` (string): Text description.
- `options` (optional):
  - `referenceImages` (string[]): Reference images (URL/base64) to guide style or structure.
  - `aspectRatio` (string): e.g. `'1:1'`, `'16:9'`, `'4:3'`.
  - `model` (string): `'google/nano-banana'` | `'google/nano-banana-pro'` | `'seedream-4'` | `'flux-kontext-max'`. Default: `'google/nano-banana-pro'`.

**Returns:** `Promise<string>` — generated image URL.

```typescript
const image = await coreviz.generate('A futuristic city at dusk', { aspectRatio: '16:9' });
```

---

### `coreviz.embed(input, options?)`

Generates embeddings for image or text inputs, enabling semantic search and similarity comparison. Use with `coreviz.similarity(embeddingA, embeddingB)` to compare two images or an image and a text.

**Parameters:**
- `input` (string): Text string, image URL, or base64 data URL.
- `options` (optional):
  - `type` (`'image' | 'text'`): Explicit type hint (auto-detected if omitted).
  - `mode` (`'api' | 'local'`): `'local'` runs in-browser using transformers.js. Default: `'api'`.

**Returns:** `Promise<EmbedResponse>` — `{ embedding: number[] }`

```typescript
const { embedding } = await coreviz.embed('A photo of a red sneaker');
```

---

### `coreviz.similarity(vecA, vecB)`

Calculates the degree of similarity between two embeddings.

**Parameters:**
- `vecA`, `vecB` (number[]): Embedding vectors from `embed()`.

**Returns:** `number` — score between -1 and 1.

```typescript
const score = coreviz.similarity(embeddingA, embeddingB);
```

---

### `coreviz.resize(input, maxWidth?, maxHeight?)`

Resizes an image client-side (canvas) or server-side (Sharp). Also available as a standalone import.

**Returns:** `Promise<string>` — base64 data URL.

```typescript
const resized = await coreviz.resize(file, 800, 600);
// or: import { resize } from '@coreviz/sdk';
```

---

## Library Management API

The SDK also exposes namespaced methods for programmatically managing your CoreViz visual library — browsing collections, searching media, organizing folders, and managing tags. These require authentication via a user token (from `coreviz login`) or an API key.

---

## Account

### `coreviz.me()`

Return the current authenticated user and their default organization.

**Returns:** `Promise<UserContext>` — `{ userId, email, name, organizationId, organizationName }`

```typescript
const { name, email, organizationId } = await coreviz.me();
```

---

### `coreviz.baseUrl`

The API base URL this instance is configured to use (read-only getter).

```typescript
console.log(coreviz.baseUrl); // 'https://lab.coreviz.io'
```

---

## Organizations

### `coreviz.organizations.list()`

List all organizations the current user belongs to. Falls back to the user's default organization if the org-list endpoint is unavailable.

**Returns:** `Promise<Organization[]>` — each `{ id, name, slug }`

```typescript
const orgs = await coreviz.organizations.list();
```

---

## Collections

### `coreviz.collections.list(organizationId?)`

List all collections in an organization.

- `organizationId` (string, optional): Pass explicitly to skip the `/api/me` round-trip.

**Returns:** `Promise<Collection[]>`

```typescript
const collections = await coreviz.collections.list();
```

---

### `coreviz.collections.get(collectionId)`

Get a single collection by ID.

**Returns:** `Promise<Collection>`

```typescript
const collection = await coreviz.collections.get('abc123');
```

---

### `coreviz.collections.create(name, icon?, organizationId?)`

Create a new collection.

- `organizationId` (string, optional): Target organization. Defaults to the current user's organization.

**Returns:** `Promise<Collection>`

```typescript
// Create in current user's org
const collection = await coreviz.collections.create('Product Photos', '📦');

// Create in a specific org
const collection = await coreviz.collections.create('Product Photos', '📦', 'org_abc123');
```

---

### `coreviz.collections.update(collectionId, updates)`

Update a collection's name or icon.

**Parameters:**
- `updates`: `{ name?: string; icon?: string }`

**Returns:** `Promise<Collection>`

```typescript
await coreviz.collections.update('abc123', { name: 'Campaign Assets 2025' });
```

---

## Media

### `coreviz.media.browse(collectionId, options?)`

List media and folders inside a collection. Supports browsing, filtering, searching, and similarity queries all through the same method.

**Options:**
| Field | Type | Description |
|---|---|---|
| `path` | string | ltree path to list (e.g. `"collId.folderId"`). Defaults to collection root. |
| `limit` / `offset` | number | Pagination. |
| `type` | `'image' \| 'video' \| 'folder' \| 'all'` | Filter by media type. |
| `dateFrom` / `dateTo` | string | Date range filter (`YYYY-MM-DD`). |
| `sortBy` / `sortDirection` | string | Sort field and direction (`'asc' \| 'desc'`). |
| `tagFilters` | `Record<string, string[]>` | AND between groups, OR within group. |
| `q` | string | Text/semantic search query (triggers scored mode). |
| `similarToObjectId` | string | Find visually similar media by detected object ID. |
| `similarToObjectModel` | string | Vision model for similarity scoring. |
| `tags` | string | Comma-separated tag label filter. |
| `mediaId` | string | Filter to a specific media item. |
| `clusterId` | string | Filter to a specific object cluster. |
| `recursive` | boolean | List all descendants recursively (flattened view). |

**Returns:** `Promise<BrowseResult>` — `{ media: Media[], pagination }`

```typescript
// Browse a folder
const { media } = await coreviz.media.browse('collId', { path: 'collId.folderXyz', limit: 50 });

// In-folder semantic search
const { media: results } = await coreviz.media.browse('collId', { q: 'red shoes' });

// Find similar media by object
const { media: similar } = await coreviz.media.browse('collId', { similarToObjectId: 'objId' });
```

---

### `coreviz.media.search(query, options?)`

Semantically search across all media in the organization.

**Options:**
- `limit` (number): Max results.
- `organizationId` (string): Pass explicitly to skip the `/api/me` round-trip.

**Returns:** `Promise<SearchResult[]>` — each result includes `mediaId`, `blobUrl`, `objects`, `rank`, `caption`.

```typescript
const results = await coreviz.media.search('sunset over water', { limit: 10 });
```

---

### `coreviz.media.get(mediaId)`

Get full details for a media item including blob URL, dimensions, metadata, detected objects, and frames.

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

Move a media item to a different folder within the same collection.

- `destinationPath` (string): ltree path of the destination folder.

**Returns:** `Promise<{ id, newPath }>`

```typescript
await coreviz.media.move('mediaId123', 'collId.archiveFolder');
```

---

### `coreviz.media.delete(mediaId)`

Permanently delete a media item.

```typescript
await coreviz.media.delete('mediaId123');
```

---

### `coreviz.media.upload(file, options)`

Upload a photo or video.

**Parameters:**
- `file`: Local file path string (Node.js), `File` (browser), or `Blob`.
- `options`:
  - `collectionId` (string, required)
  - `path` (string, optional): Destination ltree folder path.
  - `name` (string, optional): Override stored file name.

**Returns:** `Promise<UploadResult>` — `{ mediaId, url, message }`

```typescript
// Node.js
const result = await coreviz.media.upload('/path/to/photo.jpg', { collectionId: 'abc123' });

// Browser
const result = await coreviz.media.upload(file, { collectionId: 'abc123', path: 'abc123.folder' });
```

> File path strings are not supported on React Native / Expo. Pass a `File` or `Blob` instead.

---

## Tags

### `coreviz.media.addTag(mediaId, label, value)`

Add a tag to a media item. Tags are `label` (group) + `value` pairs.

```typescript
await coreviz.media.addTag('mediaId123', 'color', 'red');
```

---

### `coreviz.media.removeTag(mediaId, label, value)`

Remove a specific tag value from a media item.

```typescript
await coreviz.media.removeTag('mediaId123', 'color', 'red');
```

---

### `coreviz.media.removeTagGroup(mediaId, label)`

Remove an entire tag group (all values under that label) from a media item.

```typescript
await coreviz.media.removeTagGroup('mediaId123', 'color');
```

---

### `coreviz.media.renameTagGroup(mediaId, oldLabel, newLabel)`

Rename a tag group on a media item, preserving all its values.

```typescript
await coreviz.media.renameTagGroup('mediaId123', 'colour', 'color');
```

---

### `coreviz.tags.list(collectionId)`

Aggregate all tag groups and values across an entire collection.

**Returns:** `Promise<Record<string, string[]>>`

```typescript
const tags = await coreviz.tags.list('collId');
// { color: ['red', 'blue'], category: ['product', 'lifestyle'] }
```

---

## Versions

Media items in CoreViz track edit history as versions. Each AI edit or bulk operation creates a new version linked to the original.

### `coreviz.media.listVersions(mediaId)`

List all versions of a media item (original + all AI-edited derivatives).

**Returns:** `Promise<Media[]>`

```typescript
const versions = await coreviz.media.listVersions('mediaId123');
```

---

### `coreviz.media.selectVersion(versionId)`

Mark a version as the active/current version.

```typescript
await coreviz.media.selectVersion('versionId456');
```

---

### `coreviz.media.deleteVersion(rootMediaId, versionId)`

Delete a specific version. If the deleted version was active, the server promotes another version automatically.

**Returns:** `Promise<{ deletedId: string; promotedId: string | null }>`

```typescript
const { promotedId } = await coreviz.media.deleteVersion('rootMediaId', 'versionId456');
if (promotedId) {
  // navigate to promoted version
}
```

---

## Similarity Search

### `coreviz.media.findSimilar(collectionId, objectId, options?)`

Find visually similar media using a detected object ID (from `media.get()` frames).

**Options:**
- `limit` (number)
- `model` (string): e.g. `'faces'`, `'objects'`, `'shoeprints'`.

**Returns:** `Promise<BrowseResult>`

```typescript
const { media } = await coreviz.media.findSimilar('collId', 'objectId456', { model: 'faces' });
```

---

## Folders

### `coreviz.folders.create(collectionId, name, path?, reuse?)`

Create a new folder inside a collection.

- `path` (string, optional): Parent ltree path. Defaults to collection root.
- `reuse` (boolean, optional): When `true`, returns the existing folder if one with the same name already exists at that path (upsert behavior).

**Returns:** `Promise<Folder>`

```typescript
const folder = await coreviz.folders.create('collId', 'Spring 2025', 'collId.campaigns');

// Upsert — safe to call repeatedly
const folder = await coreviz.folders.create('collId', 'Imports', undefined, true);
```

---

### `coreviz.folders.get(folderId)`

Get a folder by ID.

**Returns:** `Promise<Folder>`

```typescript
const folder = await coreviz.folders.get('folderId123');
```

---

### `coreviz.folders.update(folderId, updates)`

Update a folder's name or metadata.

**Parameters:**
- `updates`: `{ name?: string; metadata?: Record<string, unknown> }`

**Returns:** `Promise<Folder>`

```typescript
await coreviz.folders.update('folderId123', { name: 'Archived Campaign' });
```

---

### `coreviz.folders.delete(folderId)`

Delete a folder and all its contents.

```typescript
await coreviz.folders.delete('folderId123');
```
