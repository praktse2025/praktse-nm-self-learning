import { CheckCircleIcon, PlayIcon, PlusCircleIcon, XCircleIcon } from "@heroicons/react/solid";
import { useApi, useEnrollmentMutations } from "@self-learning/api";
import { useCourseCompletion } from "@self-learning/completion";
import { database } from "@self-learning/database";
import { CompiledMarkdown, compileMarkdown } from "@self-learning/markdown";
import { CourseContent } from "@self-learning/types";
import { AuthorProps, AuthorsList } from "@self-learning/ui/common";
import * as ToC from "@self-learning/ui/course";
import { CenteredSection } from "@self-learning/ui/layouts";
import { formatDistance } from "date-fns";
import { de } from "date-fns/locale";
import { GetStaticPaths, GetStaticProps } from "next";
import { MDXRemote } from "next-mdx-remote";
import Image from "next/image";
import { Fragment, useMemo, useState } from "react";
import { CoursesOfUser } from "../../api/users/[username]/courses";

type Course = ResolvedValue<typeof getCourse>;

type ChapterWithLessons = {
	title: string;
	description: string | null | undefined;
	lessons: {
		lessonId: string;
		slug: string;
		title: string;
	}[];
};

async function mapCourseContent(content: CourseContent): Promise<ChapterWithLessons[]> {
	const lessonIds = (content ?? []).flatMap(chapter => chapter.lessonIds);

	const lessons = await database.lesson.findMany({
		where: { lessonId: { in: lessonIds } },
		select: {
			lessonId: true,
			slug: true,
			title: true
		}
	});

	const map = new Map<string, typeof lessons[0]>();

	for (const lesson of lessons) {
		map.set(lesson.lessonId, lesson);
	}

	const mappedContent = content.map(chapter => ({
		title: chapter.title,
		description: chapter.description,
		lessons: chapter.lessonIds.map(lessonId => map.get(lessonId) as Defined<typeof lessons[0]>)
	}));

	return mappedContent;
}

type CourseProps = {
	course: Course;
	content: ChapterWithLessons[];
	markdownDescription: CompiledMarkdown | null;
};

export const getStaticProps: GetStaticProps<CourseProps> = async ({ params }) => {
	const courseSlug = params?.courseSlug as string | undefined;

	if (!courseSlug) {
		throw new Error("No slug provided.");
	}

	const course = await getCourse(courseSlug);
	const content = await mapCourseContent(course?.content as CourseContent);
	let markdownDescription = null;

	if (course) {
		if (course.description && course.description.length > 0) {
			markdownDescription = await compileMarkdown(course.description);
			course.description = null;
		}
	}

	return {
		props: {
			course: JSON.parse(JSON.stringify(course)) as Defined<typeof course>,
			content,
			markdownDescription
		},
		notFound: !course
	};
};

export const getStaticPaths: GetStaticPaths = () => {
	return {
		paths: [],
		fallback: "blocking"
	};
};

async function getCourse(courseSlug: string) {
	return await database.course.findUnique({
		where: { slug: courseSlug },
		include: {
			authors: {
				select: {
					slug: true,
					displayName: true,
					imgUrl: true
				}
			}
		}
	});
}

export default function Course({ course, content, markdownDescription }: CourseProps) {
	return (
		<div className="bg-gray-50 pb-32">
			<CenteredSection className="gradient">
				<CourseHeader course={course} />
			</CenteredSection>

			{markdownDescription && (
				<CenteredSection className="bg-gray-50">
					<Description content={markdownDescription} />
				</CenteredSection>
			)}

			<CenteredSection className="bg-white">
				<Competences />
			</CenteredSection>

			<CenteredSection className="bg-gray-50">
				<TableOfContents content={content} course={course} />
			</CenteredSection>
		</div>
	);
}

function toDateAgo(date: Date | string | number) {
	return formatDistance(new Date(date), Date.now(), {
		addSuffix: true,
		locale: de
	});
}

function CourseHeader({ course }: { course: Course }) {
	const username = "potter";
	const { data: enrollments } = useApi<CoursesOfUser>(["user", `users/${username}/courses`]);
	const { signUpMutation, signOutMutation } = useEnrollmentMutations();

	const [authors] = useState(
		() =>
			course.authors.map(author => ({
				slug: author.slug,
				name: author.displayName,
				imgUrl: author.imgUrl
			})) as AuthorProps[]
	);

	const isEnrolled = useMemo(() => {
		if (!enrollments) return false;
		return !!enrollments.find(e => e.course.slug === course.slug);
	}, [enrollments, course]);

	return (
		<div className="flex flex-col gap-16">
			<div className="flex flex-wrap-reverse gap-12 md:flex-nowrap">
				<div className="flex flex-col justify-between gap-8">
					<div className="flex flex-col-reverse gap-12 md:flex-col">
						<div>
							<h1 className="mb-12 text-4xl md:text-6xl">{course.title}</h1>
							{course.subtitle && (
								<div className="text-lg tracking-tight">{course.subtitle}</div>
							)}
						</div>
						<AuthorsList authors={authors} />
					</div>

					<CreatedUpdatedDates
						createdAt={toDateAgo(course.createdAt)}
						updatedAt={toDateAgo(course.updatedAt)}
					/>
				</div>

				<div className="flex w-full flex-col gap-4 rounded">
					<div className="relative h-64 w-full shrink-0">
						{course.imgUrl && (
							<Image
								priority
								className="shrink-0 rounded-lg bg-white"
								objectFit="cover"
								layout="fill"
								src={course.imgUrl}
								alt=""
							></Image>
						)}
					</div>
					<div className="grid gap-2">
						<button
							className="btn-primary"
							onClick={() =>
								signUpMutation.mutate({
									course: course.slug,
									username
								})
							}
						>
							<span>{isEnrolled ? "Fortfahren" : "Starten"}</span>
							<PlayIcon className="h-6" />
						</button>
						<button
							className="btn-secondary"
							onClick={() =>
								signOutMutation.mutate({
									course: course.slug,
									username
								})
							}
						>
							<span>Zum Lernplan hinzfügen</span>
							<PlusCircleIcon className="h-6" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function TableOfContents({ content, course }: { content: ChapterWithLessons[]; course: Course }) {
	const courseCompletion = useCourseCompletion(course.slug);
	console.log("courseCompletion", courseCompletion);

	return (
		<div className="flex flex-col gap-8">
			<h2 className="mb-4 text-4xl">Inhalt</h2>
			<div className="flex flex-col place-items-center">
				{content.map((chapter, index) => {
					const showConnector = index < content.length - 1;

					const isCompleted =
						(courseCompletion?.chapters[index] &&
							courseCompletion.chapters[index].completedLessonsPercentage >= 100) ??
						false;

					return (
						<Fragment key={chapter.title}>
							<ToC.Section isCompleted={isCompleted} isRequired={false}>
								<ToC.Chapter
									courseSlug={course.slug}
									title={chapter.title as string}
									description={chapter.description}
									lessons={
										chapter.lessons.map(lesson => ({
											lessonId: lesson.lessonId,
											slug: lesson.slug,
											title: lesson.title,
											isCompleted:
												(courseCompletion?.completedLessons &&
													!!courseCompletion.completedLessons[
														lesson.lessonId
													]) ??
												false
										})) ?? []
									}
								/>
							</ToC.Section>
							{showConnector && (
								<ToC.SectionConnector isCompleted={isCompleted} isRequired={true} />
							)}
						</Fragment>
					);
				})}
			</div>
		</div>
	);
}

function CreatedUpdatedDates({ createdAt, updatedAt }: { createdAt: string; updatedAt: string }) {
	return (
		<div className="flex flex-wrap gap-2 text-xs">
			<span>
				Erstellt: <span>{createdAt}</span>
			</span>
			<span>|</span>
			<span>
				Letzte Änderung: <span>{updatedAt}</span>
			</span>
		</div>
	);
}

function Description({ content }: { content: CompiledMarkdown }) {
	return (
		<div className="prose max-w-full">
			<MDXRemote {...content}></MDXRemote>
		</div>
	);
}

export function Competences() {
	return (
		<div className="grid place-content-center gap-16 divide-y divide-slate-200 md:grid-cols-2 md:gap-0 md:divide-x md:divide-y-0">
			<div className="flex flex-col gap-12 md:pr-16">
				<span className="text-lg font-bold">Du benötigst folgende Voraussetzungen...</span>

				<div className="flex flex-col gap-4">
					<RequirementCompetence
						text="Lorem, ipsum dolor sit amet consectetur adipisicing."
						checked={true}
					/>
					<RequirementCompetence
						text="Lorem, ipsum dolor sit amet consectetur adipisicing."
						checked={true}
					/>
					<RequirementCompetence
						text="Lorem, ipsum dolor sit amet consectetur adipisicing."
						checked={false}
					/>
				</div>
			</div>
			<div className="flex flex-col gap-12 pt-16 md:pl-16 md:pt-0">
				<span className="text-lg font-bold">Du erwirbst folgende Kompetenzen...</span>
				<div className="flex flex-col gap-4">
					<AwardedCompetence
						text="Lorem, ipsum dolor sit amet consectetur adipisicing."
						checked={true}
					/>
					<AwardedCompetence
						text="Lorem, ipsum dolor sit amet consectetur adipisicing."
						checked={false}
					/>
					<AwardedCompetence
						text="Lorem, ipsum dolor sit amet consectetur adipisicing."
						checked={true}
					/>
				</div>
			</div>
		</div>
	);
}

function RequirementCompetence({ text, checked }: { text: string; checked: boolean }) {
	return (
		<span className="flex items-center gap-4">
			{checked ? (
				<>
					<CheckCircleIcon className="h-8 shrink-0 text-emerald-500" />
					<span className="text-slate-400">{text}</span>
				</>
			) : (
				<>
					<XCircleIcon className="h-8 shrink-0 text-red-500" />
					<span className="font-semibold">{text}</span>
				</>
			)}
		</span>
	);
}

function AwardedCompetence({ text, checked }: { text: string; checked: boolean }) {
	return (
		<span className="flex items-center gap-4">
			{checked ? (
				<>
					<CheckCircleIcon className="h-8 shrink-0 text-emerald-500" />
					<span className="text-slate-400">{text}</span>
				</>
			) : (
				<>
					<PlusCircleIcon className="h-8 shrink-0 text-indigo-500" />
					<span className="font-semibold">{text}</span>
				</>
			)}
		</span>
	);
}
