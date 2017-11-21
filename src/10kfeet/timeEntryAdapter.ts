import * as fetch from "isomorphic-fetch"

export type TimeEntryDto = {
    hours: number
    day: Date
    userId: number,
}

export const transform: (json: any) => TimeEntryDto[] = (json: any) =>
        (json.data.map(
            (data: any) => ({
                hours: data.hours,
                day: new Date(data.date),
                userId: data.user_id,
            } as TimeEntryDto)))

export type FetchTimeEntryAdapter = (from: string, to: string) => Promise<TimeEntryDto[]>

export const buildFetchTimeEntryAdapter: (apiUrl: string, token: string) => FetchTimeEntryAdapter =
    (apiUrl: string, token: string) =>
        (from: string, to: string) => {
            return fetch(`${apiUrl}/time_entries?from=${from}&to=${to}`, {
                headers: new Headers({ "content-type": "application/json", "auth": token }),
            }).then((response: Response) => (
                response.json().then(transform)
            ),
            )
        }
