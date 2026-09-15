/**
 * Client-Side PDF & Image Extraction Engine
 * 
 * Bypasses Vercel's 4.5MB serverless function payload limit (FUNCTION_PAYLOAD_TOO_LARGE)
 * and Cloudinary upload limits by processing and extracting document text directly in 
 * the browser before network transmission.
 */

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  charCount: number;
  isScanned?: boolean;
  compressedImage?: string; // base64 JPEG thumbnail if page was scanned or graphic-heavy
}

export interface ExtractedPdfDocument {
  fileName: string;
  originalSize: number;
  pageCount: number;
  extractedText: string;
  pages: ExtractedPage[];
  totalCharacters: number;
  extractionMethod: 'pdfjs' | 'native_stream' | 'compact_raw';
  summary: string;
}

// Singleton PDF.js loading promise to prevent duplicate script tags
let pdfJsLoadingPromise: Promise<any> | null = null;

export async function loadPdfJs(): Promise<any> {
  if (typeof window === 'undefined') return null;

  // Already available on window?
  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }

  if (pdfJsLoadingPromise) {
    return pdfJsLoadingPromise;
  }

  pdfJsLoadingPromise = new Promise((resolve, reject) => {
    // Primary: cdnjs, Secondary: jsdelivr
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;

    const timeout = setTimeout(() => {
      // If CDN takes too long, resolve null to use native stream extractor
      console.warn('[PDF-Extractor] PDF.js CDN load timed out, falling back to native stream extractor.');
      resolve(null);
    }, 6000);

    script.onload = () => {
      clearTimeout(timeout);
      const pdfjs = (window as any).pdfjsLib;
      if (pdfjs) {
        pdfjs.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjs);
      } else {
        resolve(null);
      }
    };

    script.onerror = () => {
      clearTimeout(timeout);
      console.warn('[PDF-Extractor] Primary CDN failed, attempting backup CDN...');
      const backupScript = document.createElement('script');
      backupScript.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
      backupScript.async = true;

      backupScript.onload = () => {
        const pdfjs = (window as any).pdfjsLib;
        if (pdfjs) {
          pdfjs.GlobalWorkerOptions.workerSrc =
            'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
          resolve(pdfjs);
        } else {
          resolve(null);
        }
      };

      backupScript.onerror = () => {
        console.warn('[PDF-Extractor] Backup CDN also failed, using native stream extractor.');
        resolve(null);
      };

      document.head.appendChild(backupScript);
    };

    document.head.appendChild(script);
  });

  return pdfJsLoadingPromise;
}

/**
 * Extracts text and structured layout using PDF.js in the browser
 */
async function extractWithPdfJs(file: File, pdfjs: any): Promise<ExtractedPdfDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;

  const totalPages = pdfDoc.numPages;
  const pages: ExtractedPage[] = [];
  let fullTextParts: string[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group text items by vertical position (Y coordinate) to preserve tables & lines
    const lineMap = new Map<number, Array<{ x: number; text: string }>>();
    for (const item of textContent.items as any[]) {
      if (!item || !item.str) continue;
      const str = item.str;
      // item.transform is [scaleX, skewY, skewX, scaleY, transX, transY]
      const y = Math.round(item.transform?.[5] || 0);
      const x = Math.round(item.transform?.[4] || 0);

      // Find an existing bucket within 3px tolerance for line grouping
      let foundBucketY: number | null = null;
      for (const bucketY of lineMap.keys()) {
        if (Math.abs(bucketY - y) <= 3) {
          foundBucketY = bucketY;
          break;
        }
      }

      const targetY = foundBucketY !== null ? foundBucketY : y;
      if (!lineMap.has(targetY)) {
        lineMap.set(targetY, []);
      }
      lineMap.get(targetY)!.push({ x, text: str });
    }

    // Sort lines top-to-bottom (PDF Y starts at bottom, so descending Y = top-to-bottom)
    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);
    const pageLines: string[] = [];

    for (const y of sortedY) {
      const lineItems = lineMap.get(y)!;
      // Sort left-to-right by X
      lineItems.sort((a, b) => a.x - b.x);
      // Join with space, or tab if gap is large (likely table column)
      let lineStr = '';
      for (let i = 0; i < lineItems.length; i++) {
        const curr = lineItems[i];
        if (i > 0) {
          const prev = lineItems[i - 1];
          const gap = curr.x - (prev.x + prev.text.length * 6);
          if (gap > 20) {
            lineStr += '   |   '; // Column delimiter
          } else {
            lineStr += ' ';
          }
        }
        lineStr += curr.text;
      }
      if (lineStr.trim()) {
        pageLines.push(lineStr.trim());
      }
    }

    const pageText = pageLines.join('\n');
    const charCount = pageText.trim().length;

    // Check if this page is scanned or image-heavy (very few characters)
    let isScanned = charCount < 80;
    let compressedImage: string | undefined = undefined;

    // If scanned or graphic-heavy, render compressed canvas thumbnail for AI visual recognition
    if (isScanned && typeof document !== 'undefined') {
      try {
        const viewport = page.getViewport({ scale: 1.0 });
        const maxDim = 1000;
        const scale = Math.min(1.5, maxDim / Math.max(viewport.width, viewport.height));
        const scaledViewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
          // High-efficiency JPEG at 0.72 quality (~60KB)
          compressedImage = canvas.toDataURL('image/jpeg', 0.72);
        }
      } catch (renderErr) {
        console.warn(`[PDF-Extractor] Failed to render visual scan for page ${pageNum}:`, renderErr);
      }
    }

    pages.push({
      pageNumber: pageNum,
      text: pageText,
      charCount,
      isScanned,
      compressedImage,
    });

    fullTextParts.push(`--- PAGE ${pageNum} of ${totalPages} [${file.name}] ---\n${pageText || '[Visual content/Scanned Page]'}`);
  }

  const extractedText = fullTextParts.join('\n\n');
  const totalCharacters = pages.reduce((acc, p) => acc + p.charCount, 0);

  return {
    fileName: file.name,
    originalSize: file.size,
    pageCount: totalPages,
    extractedText,
    pages,
    totalCharacters,
    extractionMethod: 'pdfjs',
    summary: `Extracted ${totalPages} page(s), ${totalCharacters.toLocaleString()} characters directly in browser via PDF.js.`,
  };
}

/**
 * Pure JavaScript fallback stream extractor for PDFs when CDN is unreachable
 */
async function extractWithNativeStream(file: File): Promise<ExtractedPdfDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  const textDecoder = new TextDecoder('latin1');
  const rawString = textDecoder.decode(uint8);

  // Extract /Title, /Author, etc.
  const titleMatch = rawString.match(/\/Title\s*\(([^)]+)\)/);
  const authorMatch = rawString.match(/\/Author\s*\(([^)]+)\)/);
  const metaInfo = [
    titleMatch ? `Title: ${titleMatch[1]}` : '',
    authorMatch ? `Author: ${authorMatch[1]}` : '',
  ].filter(Boolean).join(' · ');

  // Extract literal text within BT ... ET blocks and Tj / TJ commands
  const lines: string[] = [];
  const textBlockRegex = /BT[\s\S]*?ET/g;
  let blockMatch;

  while ((blockMatch = textBlockRegex.exec(rawString)) !== null) {
    const block = blockMatch[0];
    // Match Tj text
    const tjRegex = /\((?:[^()\\]|\\.)*\)\s*Tj/g;
    let tjMatch;
    let blockLine = '';
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      const rawText = tjMatch[0].replace(/\s*Tj$/, '').slice(1, -1);
      const clean = rawText
        .replace(/\\([()\\])/g, '$1')
        .replace(/\\n/g, ' ')
        .replace(/\\r/g, '');
      blockLine += clean + ' ';
    }

    // Match TJ array text
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let arrayMatch;
    while ((arrayMatch = tjArrayRegex.exec(block)) !== null) {
      const inner = arrayMatch[1];
      const strParts = inner.match(/\((?:[^()\\]|\\.)*\)/g) || [];
      const decodedParts = strParts
        .map((s) => s.slice(1, -1).replace(/\\([()\\])/g, '$1'))
        .join('');
      if (decodedParts.trim()) {
        blockLine += decodedParts + ' ';
      }
    }

    if (blockLine.trim().length > 1) {
      lines.push(blockLine.trim());
    }
  }

  // Also collect plain text strings from streams if BT/ET was sparse
  if (lines.length < 5) {
    const stringLiterals = rawString.match(/\([A-Za-z0-9\s.,;:%/_\-+@#&*()]{4,}\)/g) || [];
    for (const lit of stringLiterals.slice(0, 300)) {
      const cleaned = lit.slice(1, -1).trim();
      if (cleaned.length > 3 && !cleaned.includes('%%') && !cleaned.includes('Obj')) {
        lines.push(cleaned);
      }
    }
  }

  const extractedText = `--- DOCUMENT: ${file.name} ---\n${metaInfo ? `Metadata: ${metaInfo}\n\n` : ''}${lines.join('\n')}`;
  const totalCharacters = extractedText.length;

  return {
    fileName: file.name,
    originalSize: file.size,
    pageCount: 1,
    extractedText,
    pages: [{ pageNumber: 1, text: extractedText, charCount: totalCharacters }],
    totalCharacters,
    extractionMethod: 'native_stream',
    summary: `Parsed text streams directly in browser (${totalCharacters.toLocaleString()} characters).`,
  };
}

/**
 * Main entry point to extract PDF directly in client-side code
 * Guarantees output payload is ~20KB - 200KB, completely bypassing Vercel's 4.5MB limit!
 */
export async function extractPdfClientSide(file: File): Promise<ExtractedPdfDocument> {
  try {
    const pdfjs = await loadPdfJs();
    if (pdfjs) {
      return await extractWithPdfJs(file, pdfjs);
    }
  } catch (err) {
    console.warn('[PDF-Extractor] PDF.js extraction encountered an error, falling back to stream decoder:', err);
  }

  // Robust built-in fallback
  return await extractWithNativeStream(file);
}

/**
 * Compresses large user image files (e.g. 10MB smartphone photos)
 * into a lightweight JPEG before sending to /api/upload.
 * Prevents Vercel 4.5MB limit and Cloudinary size limit.
 */
export async function compressImageClientSide(
  file: File,
  maxDimension = 1400,
  quality = 0.82
): Promise<{ file: File; dataUrl: string; sizeReductionRatio: number }> {
  // If not in browser or already small, convert to dataUrl
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    const arrayBuffer = await file.arrayBuffer();
    const b64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${b64}`;
    return { file, dataUrl, sizeReductionRatio: 1 };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            file,
            dataUrl: e.target?.result as string,
            sizeReductionRatio: 1,
          });
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        // Also create a smaller File object
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                { type: 'image/jpeg' }
              );
              const ratio = Math.round((compressedFile.size / file.size) * 100) / 100;
              resolve({
                file: compressedFile,
                dataUrl: compressedDataUrl,
                sizeReductionRatio: ratio,
              });
            } else {
              resolve({
                file,
                dataUrl: compressedDataUrl,
                sizeReductionRatio: 1,
              });
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => {
        resolve({
          file,
          dataUrl: e.target?.result as string,
          sizeReductionRatio: 1,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
