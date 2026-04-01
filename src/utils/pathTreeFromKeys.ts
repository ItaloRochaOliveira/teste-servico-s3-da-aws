/**
 * Árvore a partir de keys S3 (`/`).
 * - Só arquivos na pasta → `["a.pdf", "b.pdf"]`
 * - Só subpastas → `{ sub: ... }`
 * - Arquivos e subpastas no mesmo nível → `{ arquivos: ["x.pdf"], sub: ... }`
 */
export type PathTreeValue = PathTree | string[];

export type PathTree = {
  [segment: string]: PathTreeValue;
};

type InternalNode = {
  files: Set<string>;
  children: Map<string, InternalNode>;
};

function createNode(): InternalNode {
  return { files: new Set(), children: new Map() };
}

function getOrCreateChild(node: InternalNode, name: string): InternalNode {
  let child = node.children.get(name);
  if (!child) {
    child = createNode();
    node.children.set(name, child);
  }
  return child;
}

function insertKey(root: InternalNode, segments: string[]): void {
  if (segments.length === 0) return;
  let node = root;
  for (let i = 0; i < segments.length - 1; i++) {
    node = getOrCreateChild(node, segments[i]);
  }
  node.files.add(segments[segments.length - 1]);
}

function serialize(node: InternalNode): PathTreeValue {
  const files = [...node.files].sort((a, b) => a.localeCompare(b));
  const childNames = [...node.children.keys()].sort((a, b) => a.localeCompare(b));

  if (childNames.length === 0) {
    return files;
  }
  if (files.length === 0) {
    const o: PathTree = {};
    for (const name of childNames) {
      o[name] = serialize(node.children.get(name)!);
    }
    return o;
  }
  const o: PathTree = { arquivos: files };
  for (const name of childNames) {
    o[name] = serialize(node.children.get(name)!);
  }
  return o;
}

export function buildPathTreeFromKeys(keys: string[]): PathTree {
  const root = createNode();
  for (const key of keys) {
    const segments = key
      .split("/")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    insertKey(root, segments);
  }

  const childNames = [...root.children.keys()].sort((a, b) => a.localeCompare(b));
  const rootFiles = [...root.files].sort((a, b) => a.localeCompare(b));

  if (childNames.length === 0) {
    return rootFiles.length > 0 ? { arquivos: rootFiles } : {};
  }

  const out: PathTree = {};
  if (rootFiles.length > 0) {
    out.arquivos = rootFiles;
  }
  for (const name of childNames) {
    out[name] = serialize(root.children.get(name)!);
  }
  return out;
}
