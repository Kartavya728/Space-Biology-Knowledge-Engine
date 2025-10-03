import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/**
 * Convert an image (already parsed as base64) + prompt into text using Gemini API.
 * 
 * @param {string} prompt - The text prompt for the model.
 * @param {string} imageBase64 - Base64 string of the image (without data:image/... prefix).
 * @param {string} mimeType - e.g. "image/png" or "image/jpeg".
 * @returns {Promise<string>} - Model's text response.
 */
/**
 * Browser-safe image parser wrapper.
 * Accepts either a File/Blob or a base64 string for the image.
 * Uses Vite's import.meta.env.VITE_GOOGLE_API_KEY to read the API key in the browser build.
 */
async function fileToBase64(file) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const result = reader.result;
      // result will be like "data:<mime>;base64,<data>"
      if (typeof result === 'string') {
        const parts = result.split(',');
        resolve({ base64: parts[1], mime: (result.match(/^data:(.*);base64,/) || [])[1] || file.type });
      } else {
        reject(new Error('Unexpected FileReader result'));
      }
    };
    reader.readAsDataURL(file);
  });
}

export async function ImageParser(input, prompt, mimeType = 'image/png') {
  // Determine API key from Vite environment (import.meta.env).
  const apiKey = "AIzaSyAmFQPnjtZU2HxKuLDbiHsxoyEmX9Gx1Mc";

  // Optionally allow specifying a different model for image handling via env
  const preferredModel = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_IMAGE_MODEL
    ? import.meta.env.VITE_GOOGLE_IMAGE_MODEL
    : 'gemini-2.5-flash';

  const model = new ChatGoogleGenerativeAI({
    model: preferredModel,
    apiKey: apiKey,
  });
  const addon = "System Instructions: Describe the content of this image in detail focusing on space and biology aspects. Clearly mention any scientific elements, organisms, or phenomena visible in the image. Provide insights relevant to space biology research. Also extract the text present in the image properly. The user instrictions are: ";

  let imageBase64 = null;
  let finalMime = mimeType;

  if (input instanceof File || (typeof Blob !== 'undefined' && input instanceof Blob)) {
    const { base64, mime } = await fileToBase64(input);
    imageBase64 = base64;
    finalMime = mime || mimeType;
  } else if (typeof input === 'string') {
    // assume already base64 without data: prefix
    imageBase64 = input.replace(/^data:.*;base64,/, '');
  }

  // Build the message payload. If image data exists, include it; otherwise send text only.
  const messageWithImage = [
    {
      role: 'user',
      content: [
        { type: 'text', text: addon + prompt },
        ...(imageBase64 ? [{ type: 'image_url', image_url: `data:${finalMime};base64,${imageBase64}` }] : []),
      ],
    },
  ];

  // Attempt call with image (if present). If model doesn't support images, fallback to text-only.
  try {
    const res = await model.invoke(messageWithImage);
    // The returned shape can vary; try to safely extract text
    if (Array.isArray(res.content) && res.content[0] && res.content[0].text) return res.content[0].text;
    if (res.content && typeof res.content === 'string') return res.content;
    return JSON.stringify(res);
  } catch (err) {
    // If model complains about images, retry without the image
    const errMsg = err && err.message ? String(err.message) : String(err);
    if (errMsg.toLowerCase().includes('does not support images') || errMsg.toLowerCase().includes('images')) {
      try {
        const res2 = await model.invoke([
          {
            role: 'user',
            content: [{ type: 'text', text: addon + prompt + (imageBase64 ? '\n\n(Note: image omitted due to model limitations)' : '') }],
          },
        ]);
        if (Array.isArray(res2.content) && res2.content[0] && res2.content[0].text) return res2.content[0].text;
        if (res2.content && typeof res2.content === 'string') return res2.content;
        return JSON.stringify(res2);
      } catch (err2) {
        throw err2;
      }
    }
    throw err;
  }

  // The returned shape can vary; try to safely extract text
  try {
    if (Array.isArray(res.content) && res.content[0] && res.content[0].text) return res.content[0].text;
    if (res.content && typeof res.content === 'string') return res.content;
    return JSON.stringify(res);
  } catch (e) {
    return String(res);
  }
}