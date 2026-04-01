import z from "zod";

export const uploadSchema = z.object({
    fieldname: z.string().min(1).max(255),
    originalname: z.string().min(1).max(255),
    encoding: z.string().min(1).max(255),
    mimetype: z.string().min(1).max(255),
    size: z.number().min(1).max(100000),
    buffer: z.instanceof(Buffer),

}).strict();

export const downloadSchema = z.object({
    caminho: z.string().min(1).max(255).optional(),
});

export default uploadSchema;