import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";

const publicAssetPath = (assetPath: string): string =>
  `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${assetPath.replace(/^\//, "")}`;

export const readTextFile = (file: File): Promise<string> => {
  if (typeof file.text === "function") {
    return file.text();
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => resolve("");
    reader.readAsText(file);
  });
};

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  if (typeof file.arrayBuffer === "function") {
    return file.arrayBuffer();
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result instanceof ArrayBuffer ? reader.result : new ArrayBuffer(0));
    reader.onerror = () => resolve(new ArrayBuffer(0));
    reader.readAsArrayBuffer(file);
  });
};

const decodePdfLiteralText = (value: string) =>
  value
    .replace(/\\\r\n|\\\r|\\\n/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\([0-7]{1,3})/g, (_match, value: string) => String.fromCharCode(Number.parseInt(value, 8)))
    .replace(/\\([\\()])/g, "$1");

const decodePdfHexText = (value: string) => {
  const normalized = value.replace(/\s+/g, "");
  const padded = normalized.length % 2 === 0 ? normalized : `${normalized}0`;
  const bytes = [...padded.matchAll(/[0-9a-f]{2}/gi)].map((match) => Number.parseInt(match[0], 16));

  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    let text = "";
    for (let index = 2; index + 1 < bytes.length; index += 2) {
      text += String.fromCharCode(bytes[index] * 256 + bytes[index + 1]);
    }
    return text;
  }

  return new TextDecoder("latin1").decode(new Uint8Array(bytes));
};

const extractPdfTextItems = (value: string) => [
  ...[...value.matchAll(/\(((?:\\[\s\S]|[^\\)])*)\)/g)].map((match) => decodePdfLiteralText(match[1] ?? "")),
  ...[...value.matchAll(/<([0-9a-f\s]+)>/gi)].map((match) => decodePdfHexText(match[1] ?? ""))
];

const extractRawPdfText = (data: Uint8Array) => {
  const source = new TextDecoder("latin1").decode(data);
  const textItems = [
    ...[...source.matchAll(/\(((?:\\[\s\S]|[^\\)])*)\)\s*Tj/g)].map((match) => decodePdfLiteralText(match[1] ?? "")),
    ...[...source.matchAll(/<([0-9a-f\s]+)>\s*Tj/gi)].map((match) => decodePdfHexText(match[1] ?? "")),
    ...[...source.matchAll(/\[([\s\S]*?)\]\s*TJ/g)].flatMap((match) => extractPdfTextItems(match[1] ?? ""))
  ];

  return textItems.join(" ").replace(/\s+/g, " ").trim();
};

export const extractPdfText = async (file: File): Promise<string> => {
  const data = await readFileAsArrayBuffer(file);
  const dataBytes = new Uint8Array(data);
  const rawText = extractRawPdfText(dataBytes);
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const loadingTask = getDocument({
    data: dataBytes,
    stopAtErrors: false,
    useWorkerFetch: false
  });

  try {
    const document = await loadingTask.promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .flatMap((item) => ("str" in item ? [item.str] : []))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (pageText) {
        pages.push(pageText);
      }
    }

    return pages.join("\n\n").trim() || rawText;
  } catch {
    return rawText;
  } finally {
    await loadingTask.destroy().catch(() => undefined);
  }
};

export const extractImageText = async (file: File): Promise<string> => {
  try {
    const { recognize } = await import("tesseract.js");
    const result = await recognize(file, "eng", {
      corePath: publicAssetPath("tesseract-core/tesseract-core.wasm.js"),
      langPath: publicAssetPath("tessdata"),
      workerPath: publicAssetPath("tesseract/worker.min.js")
    });

    return result.data.text.replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
};
