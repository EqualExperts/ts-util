import { fetchPageData } from "./common"
import { buildGetUsersInfoAdapterWithResultsPerPage, UserInfoDto, UNDEFINED_USER } from "./usersInfoAdapter"
import { uniq } from "ramda"
import { buildFetchProjectInfoAdapter, ProjectInfo, ProjectState, UNDEFINED_PROJECT } from "./projectAdapter"

enum AssignmentType {
    PROJECT = "Project",
    LEAVE_TYPE = "LeaveType",
}

export type TimeEntryDto = {
    hours: number
    day: Date
    userId: number,

    firstName: string,
    lastName: string,
    email: string,

    assignableId: number,
    assignableType: string,
    assignableName: string,
    billable: boolean,
}

export type FetchTimeEntryAdapter = (from: string, to: string) => Promise<TimeEntryDto[]>

export const buildFetchTimeEntryAdapterWithResultsPerPage
    : (baseUrl: string, token: string, resultsPerPage: number) => FetchTimeEntryAdapter =
    (baseUrl: string, token: string, resultsPerPage: number) =>
        async (from: string, to: string) => {
            const timeEntries: TimeEntryDto[] = await fetchPageData(
                baseUrl,
                `/api/v1/time_entries?from=${from}&to=${to}&per_page=${resultsPerPage}`,
                token,
                [] as TimeEntryDto[],
                extractDto)

            const getUsersInfoAdapter = buildGetUsersInfoAdapterWithResultsPerPage(baseUrl, token, resultsPerPage)
            const usersInfo: UserInfoDto[] = await getUsersInfoAdapter(
                uniq(timeEntries.map((te: TimeEntryDto) => te.userId)))

            const fetchProjectInfo = buildFetchProjectInfoAdapter(baseUrl, token)

            const projects: ProjectInfo[] = await Promise.all(
                    uniq(timeEntries
                        .filter((te: TimeEntryDto) => te.assignableType !== "LeaveType")
                        .map((te: TimeEntryDto) => te.assignableId))
                    .map(async (projectId: number) => await fetchProjectInfo(projectId)))

            const result: TimeEntryDto[] = timeEntries.map((te: TimeEntryDto) => {
                const userInfo: UserInfoDto | undefined =
                    usersInfo.find((u) => u.userId === te.userId) || UNDEFINED_USER

                te.firstName = userInfo.firstName
                te.lastName = userInfo.lastName
                te.email = userInfo.email

                if (te.assignableType !== AssignmentType.LEAVE_TYPE) {
                    const projectInfo: ProjectInfo | undefined =
                        projects.find((project) => project.id === te.assignableId) || UNDEFINED_PROJECT

                    te.assignableName = projectInfo.name
                    te.billable = projectInfo.state !== ProjectState.INTERNAL
                } else {
                    te.assignableName = te.assignableType
                    te.billable = false
                }

                return te
            })

            return result
        }

export const buildFetchTimeEntryAdapter: (baseUrl: string, token: string) => FetchTimeEntryAdapter =
    (baseUrl: string, token: string) =>
        buildFetchTimeEntryAdapterWithResultsPerPage(baseUrl, token, 50)

export const extractDto =
    (element: any) => ({
        hours: element.hours,
        day: new Date(element.date),
        userId: element.user_id,
        assignableId: element.assignable_id,
        assignableType: element.assignable_type,
    } as TimeEntryDto)
