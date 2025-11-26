# @coreviz/sdk

The official JavaScript/TypeScript SDK for CoreViz's Vision AI APIs. Easily integrate powerful image analysis and manipulation features into your applications.

## Installation

```bash
npm install @coreviz/sdk
```

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

## License

MIT
