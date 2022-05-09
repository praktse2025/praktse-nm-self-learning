import { CheckCircleIcon, PlayIcon, PlusCircleIcon, XCircleIcon } from "@heroicons/react/solid";
import { useApi, useEnrollmentMutations } from "@self-learning/api";
import { getCourseBySlug } from "@self-learning/cms-api";
import { CompiledMarkdown, compileMarkdown } from "@self-learning/markdown";
import { AuthorProps, AuthorsList } from "@self-learning/ui/common";
import { CenteredSection } from "@self-learning/ui/layouts";
import { GetStaticPaths, GetStaticProps } from "next";
import { MDXRemote } from "next-mdx-remote";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CoursesOfUser } from "../api/users/[username]/courses";

type Course = ResolvedValue<typeof getCourseBySlug>;

type CourseProps = {
	course: Course;
	markdownDescription: CompiledMarkdown | null;
};

// export const getStaticProps: GetStaticProps<CourseProps> = async ({ params }) => {
// 	const courseSlug = params?.courseSlug as string | undefined;

// 	if (!courseSlug) {
// 		throw new Error("No slug provided.");
// 	}

// 	const course = (await getCourseBySlug(courseSlug)) as Course;

// 	let markdownDescription = null;

// 	if (course?.description && course.description.length > 0) {
// 		markdownDescription = await compileMarkdown(course.description);
// 		course.description = null;
// 	}

// 	return {
// 		props: { course, markdownDescription },
// 		notFound: !course
// 	};
// };

// export const getStaticPaths: GetStaticPaths = () => {
// 	return {
// 		paths: [],
// 		fallback: "blocking"
// 	};
// };

const course = {
	title: "The Example Course",
	slug: "the-example-course",
	subtitle:
		"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.",
	description: null,
	createdAt: "2022-04-01T13:20:38.591Z",
	updatedAt: "2022-05-08T09:32:41.573Z",
	image: {
		data: {
			attributes: {
				url: "/uploads/Screenshot_2022_04_01_151614_2c2c4eee22.png",
				alternativeText: "Screenshot 2022-04-01 151614.png"
			}
		}
	},
	authors: {
		data: [
			{
				attributes: {
					slug: "patrick-bateman",
					name: "Patrick Bateman",
					image: {
						data: {
							attributes: {
								url: "/uploads/patrick_bateman_ba863d3f83.jpg",
								alternativeText: "Picture of Patrick Bateman"
							}
						}
					}
				}
			},
			{
				attributes: {
					slug: "kent-c-dodds",
					name: "Kent C. Dodds",
					image: {
						data: {
							attributes: {
								url: "/uploads/kent_c_dodds_9f253d7344.png",
								alternativeText: "Picture of Kent C. Dodds"
							}
						}
					}
				}
			}
		]
	},
	content: [
		{
			__typename: "ComponentNanomoduleNanomoduleRelation",
			nanomodule: {
				data: {
					attributes: {
						slug: "summary-of-the-example-course",
						title: "Example Course Summary"
					}
				}
			}
		},
		{
			__typename: "ComponentNanomoduleChapter",
			title: "Chapter One",
			description:
				"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.",
			lessons: {
				data: [
					{
						attributes: {
							slug: "a-beginners-guide-to-react-introduction",
							title: "A Beginners Guide to React Introduction"
						}
					},
					{
						attributes: {
							slug: "create-a-user-interface-with-vanilla-java-script-and-dom",
							title: "Create a User Interface with Vanilla JavaScript and DOM"
						}
					},
					{
						attributes: {
							slug: "create-a-user-interface-with-react-s-create-element-api",
							title: "Create a User Interface with React’s createElement API"
						}
					}
				]
			}
		},
		{
			__typename: "ComponentNanomoduleCourseRelation",
			title: "A Nested Course",
			description:
				"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.",
			course: {
				data: {
					attributes: {
						title: "The Example Course",
						subtitle:
							"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.",
						image: {
							data: {
								attributes: {
									url: "/uploads/Screenshot_2022_04_01_151614_2c2c4eee22.png"
								}
							}
						}
					}
				}
			}
		}
	]
};

export default function Course() {
	return (
		<div className="min-h-screen bg-neutral-100 pb-32">
			{/* <CenteredSection className="gradient">
				<CourseHeader course={course} markdownDescription={markdownDescription} />
			</CenteredSection>

			<CenteredSection className="bg-white">
				<Competences />
			</CenteredSection>

			<CenteredSection className="bg-neutral-100">
				<TableOfContent content={course.content}></TableOfContent>
			</CenteredSection> */}
		</div>
	);
}

function CourseHeader({
	course,
	markdownDescription
}: {
	course: Course;
	markdownDescription: CompiledMarkdown | null;
}) {
	const username = "potter";
	const { data: enrollments } = useApi<CoursesOfUser>(["user", `users/${username}/courses`]);
	const { signUpMutation, signOutMutation } = useEnrollmentMutations();

	const [authors] = useState(
		() =>
			course.authors?.data.map(author => ({
				slug: author.attributes?.slug as string,
				name: author.attributes?.name as string,
				imgUrl: author.attributes?.image?.data?.attributes?.url as string
			})) as AuthorProps[]
	);

	const isEnrolled = useMemo(() => {
		if (!enrollments) return false;
		return !!enrollments.find(e => e.courseId === course.slug);
	}, [enrollments, course]);

	const { url, alternativeText } = course.image?.data?.attributes || {};

	return (
		<div className="flex flex-col gap-16">
			<div className="flex flex-wrap-reverse gap-12 md:flex-nowrap">
				<div className="flex flex-col justify-between gap-8">
					<div className="flex flex-col-reverse gap-12 md:flex-col">
						<AuthorsList authors={authors} />
						<div>
							<h1 className="mb-12 text-4xl md:text-6xl">{course.title}</h1>
							{course.subtitle && (
								<div className="text-lg tracking-tight">{course.subtitle}</div>
							)}
						</div>
					</div>

					<CreatedUpdatedDates
						createdAt={new Date(course.createdAt).toLocaleDateString()}
						updatedAt={new Date(course.updatedAt).toLocaleDateString()}
					/>
				</div>

				<div className="flex w-full flex-col gap-4 rounded">
					<div className="relative h-64 w-full shrink-0">
						<Image
							className="shrink-0 rounded-lg"
							objectFit="cover"
							layout="fill"
							src={`http://localhost:1337${url}` ?? ""}
							alt={alternativeText ?? ""}
						></Image>
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

			{markdownDescription && <Description content={markdownDescription} />}
		</div>
	);
}

function TableOfContent({ content }: { content: Course["content"] }) {
	return (
		<div className="flex flex-col gap-8">
			<h2 className="mb-4 text-4xl">Inhalt</h2>
			<TableOfContentInner content={content} />
		</div>
	);
}

function TableOfContentInner({ content }: { content: Course["content"] }) {
	return (
		<>
			{content?.map(chapterOrLesson => {
				if (chapterOrLesson?.__typename === "ComponentNanomoduleChapter") {
					return (
						<div
							key={chapterOrLesson.title}
							className="glass card flex flex-col gap-4 border border-slate-200"
						>
							<span className="text-xl font-bold">{chapterOrLesson.title}</span>
							{
								<ul className="flex flex-col">
									{chapterOrLesson.lessons?.data.map(lesson => (
										<li
											key={lesson.attributes?.slug}
											className="flex items-center justify-between rounded border border-slate-200 p-2"
										>
											<Link href={"/lessons/" + lesson.attributes?.slug}>
												<a className="hover:underline">
													{lesson.attributes?.title}
												</a>
											</Link>
											<div className="text-xs">4:20</div>
										</li>
									))}
								</ul>
							}
						</div>
					);
				}

				if (chapterOrLesson?.__typename === "ComponentNanomoduleCourseRelation") {
					const { title, description, course } = chapterOrLesson;
					const imgUrl = course?.data?.attributes?.image?.data?.attributes?.url ?? "";

					return (
						<div
							key={title}
							className="glass card flex flex-col gap-4 border border-slate-200"
						>
							<span className="text-xl font-bold">{title}</span>
							{description && description.length > 0 && (
								<div className="">{description}</div>
							)}
							<div className="flex rounded-lg bg-slate-100">
								<div className="relative w-[256px]">
									<Image
										src={`http://localhost:1337${imgUrl}`}
										alt=""
										layout="fill"
										objectFit="cover"
										className="rounded-l-lg"
									></Image>
								</div>
								<div className="flex flex-col gap-4 rounded-r-lg border border-slate-400 p-4">
									<span className="text-lg font-bold">
										{course?.data?.attributes?.title}
									</span>
									<span className="text-sm">
										{course?.data?.attributes?.subtitle}
									</span>
								</div>
							</div>
						</div>
					);
				}

				if (chapterOrLesson?.__typename === "ComponentNanomoduleNanomoduleRelation") {
					const nanomodule = chapterOrLesson.nanomodule?.data?.attributes;
					return (
						<div
							key={chapterOrLesson.nanomodule?.data?.attributes?.slug}
							className="glass card flex items-center justify-between border border-slate-200"
						>
							<Link href={"/lessons/" + nanomodule?.slug}>
								<a className="text-xl font-bold hover:underline">
									{nanomodule?.title}
								</a>
							</Link>
							<span className="text-xs">4:20</span>
						</div>
					);
				}
			})}
		</>
	);
}

function CreatedUpdatedDates({ createdAt, updatedAt }: { createdAt: string; updatedAt: string }) {
	return (
		<div className="flex flex-wrap gap-2 text-xs">
			<span>
				Created: <span>{createdAt}</span>
			</span>
			<span>|</span>
			<span>
				Last updated: <span>{updatedAt}</span>
			</span>
		</div>
	);
}

function Description({ content }: { content: CompiledMarkdown }) {
	return (
		<div className="glass card prose max-w-full">
			<MDXRemote {...content}></MDXRemote>
		</div>
	);
}

export function Competences() {
	return (
		<div className="grid gap-16 divide-y divide-slate-200 md:grid-cols-2 md:gap-0 md:divide-x md:divide-y-0">
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
