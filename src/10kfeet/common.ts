import * as fetch from "isomorphic-fetch"
import { appendFileSync } from "fs"

export const fetchPageData:
    <T>(baseUrl: string,
        apiPath: string,
        token: string,
        dtoAccumulator: T[],
        extract: (element: any) => T) => Promise<T[]> =
    <T>(baseUrl: string, apiPath: string, token: string, dtoAccumulator: T[], extract: (element: any) => T) =>
        (fetch(`${baseUrl}${apiPath}`, {
            headers: new Headers({ "content-type": "application/json", "auth": token }),
        }).then((response: Response) => {
            if (!response.ok) {
                return response.text().then((body) =>
                    Promise.reject(
                        "[Request Error]" +
                        `[${response.url}][HTTP ${response.status} - ${response.statusText}][payload:${body}]`,
                    ))
            }
            return response.json().then(
                (nextPageJson: any) => extractPageData(nextPageJson, dtoAccumulator, baseUrl, token, extract))
        }))

const extractPageData =
    <T>(responseJson: any, dtoAccumulator: T[], baseUrl: string, token: string, extract: (element: any) => T) => {
        const currentPageDtos = responseJson.data.map(extract)
        dtoAccumulator.push(...currentPageDtos)

        if (responseJson.paging.next != null) {
            return fetchPageData(baseUrl, responseJson.paging.next, token, dtoAccumulator, extract)
        } else {
            return Promise.resolve(dtoAccumulator)
        }
    }

function log(msg: string) {
    appendFileSync("/tmp/jest.log.txt", new Date() + " - " + msg + "\n", { encoding: "utf8" })
}
