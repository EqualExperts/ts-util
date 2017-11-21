import * as fetch from "isomorphic-fetch"

export type TimeEntryDto = {
    hours: number
    day: Date
    userId: number,
}

export type FetchTimeEntryAdapter = (from: string, to: string) => Promise<TimeEntryDto[]>

export const buildFetchTimeEntryAdapterWithResultsPerPage
    : (baseUrl: string, token: string, resultsPerPage: number) => FetchTimeEntryAdapter =
    (baseUrl: string, token: string, resultsPerPage: number) =>
        (from: string, to: string) => {
            return fetchPageData(baseUrl, `/api/v1/time_entries?from=${from}&to=${to}&per_page=${resultsPerPage}`
                , token, [] as TimeEntryDto[])
        }

export const buildFetchTimeEntryAdapter: (baseUrl: string, token: string) => FetchTimeEntryAdapter =
    (baseUrl: string, token: string) =>
        buildFetchTimeEntryAdapterWithResultsPerPage(baseUrl, token, 50)

const fetchPageData:
    (baseUrl: string, apiPath: string, token: string, dtoAccumulator: TimeEntryDto[]) => Promise<TimeEntryDto[]> =
    (baseUrl: string, apiPath: string, token: string, dtoAccumulator: TimeEntryDto[]) =>
        (fetch(`${baseUrl}${apiPath}`, {
            headers: new Headers({ "content-type": "application/json", "auth": token }),
        }).then((response: Response) => (
            response.json().then(
                (nextPageJson: any) => extractPageData(nextPageJson, dtoAccumulator, baseUrl, token))
        )))

const extractPageData =
    (responseJson: any, dtoAccumulator: TimeEntryDto[], baseUrl: string, token: string) => {
        const currentPageDtos = transform(responseJson.data)
        dtoAccumulator.push(...currentPageDtos)

        if (responseJson.paging.next != null) {
            return fetchPageData(baseUrl, responseJson.paging.next, token, dtoAccumulator)
        } else {
            return Promise.resolve(dtoAccumulator)
        }
    }

export const transform =
    (data: any) =>
        (data.map(
            (element: any) => ({
                hours: element.hours,
                day: new Date(element.date),
                userId: element.user_id,
            } as TimeEntryDto)))
