import type { PathTree } from "@/utils/pathTreeFromKeys";

export type BucketObjectSummary = {
  key: string;
  size: number;
  lastModified: string | undefined;
  etag: string | undefined;
  storageClass: string | undefined;
};

export type ListBucketObjectsResult = {
  /** Lista plana dos objetos (metadados S3). */
  objects: BucketObjectSummary[];
  /** Hierarquia de pastas/arquivos a partir das keys (segmentos por `/`). */
  pathTree: PathTree;
  isTruncated: boolean;
  nextContinuationToken: string | undefined;
  prefix: string | undefined;
};
