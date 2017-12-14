import { fetchPageData } from "./common"

export type TimeEntryDto = {
    hours: number
    day: Date
    userId: number,
    assignableId: number,
}

export type FetchTimeEntryAdapter = (from: string, to: string) => Promise<TimeEntryDto[]>

export const buildFetchTimeEntryAdapterWithResultsPerPage
    : (baseUrl: string, token: string, resultsPerPage: number) => FetchTimeEntryAdapter =
    (baseUrl: string, token: string, resultsPerPage: number) =>
        (from: string, to: string) => {
            return fetchPageData(baseUrl, `/api/v1/time_entries?from=${from}&to=${to}&per_page=${resultsPerPage}`
                , token, [] as TimeEntryDto[], extractDto)
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
