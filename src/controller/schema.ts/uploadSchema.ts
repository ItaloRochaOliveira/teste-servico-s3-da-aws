import z from "zod";
import { type Express } from "express";

export const uploadSchema = z.object({
    file: z.object({
        fieldname: z.string().min(1).max(255),
        originalname: z.string().min(1).max(255),
        encoding: z.string().min(1).max(255),
        mimetype: z.string().min(1).max(255),
        size: z.number().min(1).max(255),
    }),
}).strict();

export default uploadSchema;