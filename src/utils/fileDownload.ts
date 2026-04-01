import path from "node:path";

export type FileKind =
  | "image"
  | "pdf"
  | "text"
  | "json"
  | "video"
  | "audio"
  | "archive"
  | "binary";

export interface ProcessedDownload {
  fileName: string;
  kind: FileKind;
  mimeType: string;
  buffer: Uint8Array;
  /** Preenchido para kind `text` ou `json` quando o conteúdo é UTF-8 válido */
  text?: string;
  /** Preenchido para kind `json` quando o parse teve sucesso */
  json?: unknown;
}

const EXT_TO_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".log": "text/plain",
  ".env": "text/plain",
  ".yml": "text/yaml",
  ".yaml": "text/yaml",
  ".csv": "text/csv",
  ".json": "application/json",
  ".xml": "application/xml",
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".ts": "text/plain",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".zip": "application/zip",
  ".gz": "application/gzip",
};

export function mimeFromFileName(fileName: string): string | undefined {
  const ext = path.extname(fileName).toLowerCase();
  return EXT_TO_MIME[ext];
}

export function resolveFileKind(mimeType: string): FileKind {
  const m = mimeType.toLowerCase().split(";")[0]?.trim() ?? "";
  if (m.startsWith("image/")) return "image";
  if (m === "application/pdf") return "pdf";
  if (m === "application/json" || m.endsWith("+json")) return "json";
  if (
    m.startsWith("text/") ||
    m === "application/xml" ||
    m.endsWith("+xml") ||
    m === "application/javascript"
  ) {
    return "text";
  }
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (
    m === "application/zip" ||
    m === "application/x-zip-compressed" ||
    m === "application/x-rar-compressed" ||
    m === "application/gzip" ||
    m === "application/x-7z-compressed"
  ) {
    return "archive";
  }
  return "binary";
}

/**
 * Se o S3 não mandou tipo ou mandou genérico (octet-stream), usa a extensão do key
 * para que .txt, .md etc. virem `text/*` e o fluxo de texto funcione.
 */
function resolveMimeType(
  contentTypeFromS3: string | undefined,
  fileName: string,
): string {
  const fromS3 = contentTypeFromS3?.trim();
  const fromName = mimeFromFileName(fileName);

  const s3IsGeneric =
    !fromS3 ||
    /^application\/octet-stream$/i.test(fromS3) ||
    /^binary\/octet-stream$/i.test(fromS3);

  if (s3IsGeneric && fromName) {
    return fromName;
  }

  return fromS3 || fromName || "application/octet-stream";
}

function processBufferByKind(
  kind: FileKind,
  mimeType: string,
  buffer: Uint8Array,
): Omit<ProcessedDownload, "fileName"> {
  const base: Omit<ProcessedDownload, "fileName"> = {
    kind,
    mimeType,
    buffer,
  };

  if (kind === "text" || kind === "json") {
    try {
      base.text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    } catch {
      /* ignore */
    }
  }

  if (kind === "json" && base.text !== undefined) {
    try {
      base.json = JSON.parse(base.text) as unknown;
    } catch {
      /* mantém só text */
    }
  }

  return base;
}

export function buildProcessedDownload(
  fileName: string,
  contentTypeFromS3: string | undefined,
  buffer: Uint8Array,
): ProcessedDownload {
  const mimeType = resolveMimeType(contentTypeFromS3, fileName);
  const kind = resolveFileKind(mimeType);
  const rest = processBufferByKind(kind, mimeType, buffer);
  return { fileName, ...rest };
}
