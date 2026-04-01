import z from "zod";

export const listObjectsQuerySchema = z.object({
  prefix: z.string().max(1024).optional(),
  continuationToken: z.string().max(2048).optional(),
  maxKeys: z.coerce.number().int().min(1).max(1000).optional(),
});

export type ListObjectsQuery = z.infer<typeof listObjectsQuerySchema>;
