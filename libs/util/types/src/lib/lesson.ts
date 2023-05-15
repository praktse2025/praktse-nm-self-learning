import { z } from "zod";
import { authorsRelationSchema } from "./author";
import { lessonContentSchema } from "./lesson-content";
import { LessonMeta } from "./lesson-meta";
import { LessonType } from "@prisma/client";


export type LessonInfo = { lessonId: string; slug: string; title: string; meta: LessonMeta; lessonType: string };

export const lessonSchema = z.object({
	lessonId: z.string().nullable(),
	slug: z.string().min(3),
	title: z.string().min(3),
	subtitle: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	imgUrl: z.string().nullable().optional(),
	content: z.array(lessonContentSchema),
	authors: authorsRelationSchema,
	licenseId: z.number(),
	lessonType: z.nativeEnum(LessonType),
	selfRegulatedQuestion: z.string().nullable(),
	quiz: z
		.object({
			questions: z.array(z.any()),
			config: z.any().nullable()
		})
		.nullable()
	// TODO: quizContentSchema causes "Jest failed to parse a file"
});

export type Lesson = z.infer<typeof lessonSchema>;

/** Returns a {@link Lesson} object with empty/null values.  */
export function createEmptyLesson(): Lesson {
	return {
		lessonId: null,
		slug: "",
		title: "",
		subtitle: null,
		description: null,
		imgUrl: null,
		quiz: null,
		licenseId: 1,
		content: [],
		authors: [],
		lessonType: LessonType.TRADITIONAL,
		selfRegulatedQuestion: null
	};
}
