import { fetchPageData } from "./common"
import { buildGetUsersInfoAdapterWithResultsPerPage, UserInfoDto } from "./usersInfoAdapter"
import { uniq } from "ramda"
import { buildFetchAssignableInfoAdapter, AssignableInfo } from "./assignableInfoAdapter"

export type TimeEntryDto = {
    hours: number
    day: Date
    userId: number,

    firstName: string,
    lastName: string,
    email: string,

    assignableId: number,
    assignableName: string,
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

            const fetchAssignableInfo = buildFetchAssignableInfoAdapter(baseUrl, token)

            const assignables: AssignableInfo[] = await Promise.all(
                uniq(timeEntries.map((te: TimeEntryDto) => te.assignableId))
                    .map(async (assignId: number) => await fetchAssignableInfo(assignId)))

            const result: TimeEntryDto[] = timeEntries.map((te: TimeEntryDto) => {
                const userInfo: UserInfoDto | undefined =
                    usersInfo.find((u) => u.userId === te.userId)
                const assignableInfo: AssignableInfo | undefined =
                    assignables.find((assign) => assign.id === te.assignableId)

                if (userInfo !== undefined) {
                    te.firstName = userInfo.firstName
                    te.lastName = userInfo.lastName
                    te.email = userInfo.email
                }
                if (assignableInfo !== undefined) {
                    te.assignableName = assignableInfo.name
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
    } as TimeEntryDto)
