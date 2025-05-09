import { LinkIcon, PencilIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { SearchCourseDialog } from "@self-learning/admin";
import { trpc } from "@self-learning/api-client";
import {
	ImageOrPlaceholder,
	LoadingBox,
	OnDialogCloseFn,
	Paginator,
	SectionHeader,
	showToast,
	Table,
	TableDataColumn,
	TableHeaderColumn
} from "@self-learning/ui/common";
import { SearchField } from "@self-learning/ui/forms";
import { CenteredContainerXL, TopicHeader, Unauthorized } from "@self-learning/ui/layouts";
import { TRPCClientError } from "@trpc/client";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { withTranslations } from "@self-learning/api";

export default function SpecializationManagementPage() {
	const router = useRouter();
	const { page = 1, title = "" } = router.query;
	const [titleFilter, setTitle] = useState(title);

	const { data: permissions } = trpc.me.permissions.useQuery();
	const { data: specialization } = trpc.specialization.getForEdit.useQuery(
		{
			specializationId: router.query.specializationId as string
		},
		{
			enabled: !!router.query.specializationId
		}
	);
	const { data: courses } = trpc.course.findMany.useQuery(
		{
			page: Number(page),
			title: titleFilter as string,
			specializationId: specialization?.specializationId
		},
		{
			enabled: !!specialization?.specializationId,
			staleTime: 10_000,
			keepPreviousData: true
		}
	);

	const [addCourseDialog, setAddCourseDialog] = useState(false);
	const { mutateAsync: addCourse } = trpc.specialization.addCourse.useMutation();
	const { mutateAsync: removeCourse } = trpc.specialization.removeCourse.useMutation();

	const handleAddCourse: OnDialogCloseFn<{ courseId: string; title: string }> = async course => {
		setAddCourseDialog(false);
		if (!course || !specialization) return;

		try {
			await addCourse({
				subjectId: specialization.subjectId,
				specializationId: specialization.specializationId,
				courseId: course.courseId
			});
			showToast({
				type: "success",
				title: "Kurs hinzugefügt",
				subtitle: `Kurs "${course.title}" wurde erfolgreich hinzugefügt.`
			});
		} catch (error) {
			console.error(error);

			if (error instanceof TRPCClientError) {
				showToast({ type: "error", title: "Fehler", subtitle: error.message });
			}
		}
	};

	async function handleRemoveCourse(course: { title: string; courseId: string }): Promise<void> {
		const confirmed = window.confirm(
			`Kurs "${course.title}" wirklich aus dieser Spezialisierung entfernen?}"`
		);

		if (!specialization || !confirmed) return;

		try {
			await removeCourse({
				subjectId: specialization.subjectId,
				specializationId: specialization?.specializationId,
				courseId: course.courseId
			});
			showToast({
				type: "success",
				title: "Kurs entfernt",
				subtitle: `Kurs "${course.title}" wurde entfernt.`
			});
		} catch (error) {
			console.error(error);

			if (error instanceof TRPCClientError) {
				showToast({ type: "error", title: "Fehler", subtitle: error.message });
			}
		}
	}

	const canView =
		specialization &&
		permissions &&
		(permissions.role === "ADMIN" ||
			permissions.author?.subjectAdmin.find(s => s.subjectId === specialization.subjectId) ||
			permissions?.author?.specializationAdmin.find(
				s => s.specializationId === specialization.specializationId
			));

	if (!canView) {
		return (
			<Unauthorized>
				<ul className="list-inside list-disc">
					<li>Admininstratoren</li>
					<li>Admininstratoren für Fachbereich ({router.query.subjectId})</li>
					<li>Admininstratoren für Spezialisierung ({router.query.specializationId})</li>
				</ul>
			</Unauthorized>
		);
	}

	return (
		<div className="flex flex-col gap-8 bg-gray-50 pb-32">
			<TopicHeader
				imgUrlBanner={specialization.imgUrlBanner}
				parentLink="/subjects"
				parentTitle="Fachgebiet"
				title={specialization.title}
				subtitle={specialization.subtitle}
			>
				<Link
					href={`/teaching/subjects/${specialization.subjectId}/${specialization.specializationId}/edit`}
					className="btn-primary absolute top-8 w-fit self-end"
				>
					<PencilIcon className="icon h-5" />
					<span>Editieren</span>
				</Link>
			</TopicHeader>

			<CenteredContainerXL>
				<SectionHeader
					title="Kurse"
					subtitle="Kurse, die dieser Spezialisierung zugeordnet sind."
				/>

				<div className="mb-8 flex flex-wrap gap-4">
					<Link
						className="btn-primary w-fit"
						href={`/teaching/courses/create?specializationId=${specialization.specializationId}&subjectId=${specialization.subjectId}`}
					>
						<PlusIcon className="icon h-5" />
						<span>Neuen Kurs erstellen</span>
					</Link>

					<button className="btn-stroked w-fit" onClick={() => setAddCourseDialog(true)}>
						<LinkIcon className="icon h-5" />
						<span>Existierenden Kurs hinzufügen</span>
					</button>

					{addCourseDialog && (
						<SearchCourseDialog open={addCourseDialog} onClose={handleAddCourse} />
					)}
				</div>

				<SearchField
					placeholder="Suche nach Titel"
					onChange={e => setTitle(e.target.value)}
				/>

				{!courses ? (
					<LoadingBox />
				) : (
					<>
						<Table
							head={
								<>
									<TableHeaderColumn></TableHeaderColumn>
									<TableHeaderColumn>Titel</TableHeaderColumn>
									<TableHeaderColumn>Von</TableHeaderColumn>
									<TableHeaderColumn></TableHeaderColumn>
								</>
							}
						>
							{courses?.result.map(course => (
								<tr key={course.courseId}>
									<TableDataColumn>
										<ImageOrPlaceholder
											src={course.imgUrl ?? undefined}
											className="h-16 w-24 rounded-lg object-cover"
										/>
									</TableDataColumn>

									<TableDataColumn>
										<Link
											className="text-sm font-medium hover:text-secondary"
											href={`/courses/${course.slug}`}
										>
											{course.title}
										</Link>
									</TableDataColumn>

									<TableDataColumn>
										<span className="text-light">
											{course.authors.map(a => a.displayName).join(", ")}
										</span>
									</TableDataColumn>
									<TableDataColumn>
										<div className="flex justify-end">
											<button
												className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500"
												title="Aus Spezialisierung entfernen"
												onClick={() => handleRemoveCourse(course)}
											>
												<XMarkIcon className="h-5" />
											</button>
										</div>
									</TableDataColumn>
								</tr>
							))}
						</Table>

						{courses?.result && (
							<Paginator
								pagination={courses}
								url={`${router.asPath}?title=${titleFilter}`}
							/>
						)}
					</>
				)}
			</CenteredContainerXL>
		</div>
	);

	return;
}

export const getServerSideProps = withTranslations(["common"]);
