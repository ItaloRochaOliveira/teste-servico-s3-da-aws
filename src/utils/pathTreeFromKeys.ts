export type PathTreeValue = PathTree | string[];

export type PathTree = {
  [segment: string]: PathTreeValue;
};