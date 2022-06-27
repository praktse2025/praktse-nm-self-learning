import { z } from "zod";
import { lessonContentSchema } from "./lesson-content";

export const lessonSchema = z.object({
	lessonId: z.string().nullable(),
	slug: z.string().min(3),
	title: z.string().min(3),
	subtitle: z.string(),
	description: z.string().nullable().optional(),
	imgUrl: z.string().nullable().optional(),
	content: z.array(lessonContentSchema)
});

export type Lesson = z.infer<typeof lessonSchema>;
