import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";

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
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\([\\()])/g, "$1");

const extractRawPdfText = (data: Uint8Array) => {
  const source = new TextDecoder("latin1").decode(data);
  const textItems = [...source.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((match) =>
    decodePdfLiteralText(match[1] ?? "")
  );

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
      corePath: "/tesseract-core/tesseract-core.wasm.js",
      langPath: "/tessdata",
      workerPath: "/tesseract/worker.min.js"
    });

    return result.data.text.replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
};
