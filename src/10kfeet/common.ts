import * as fetch from "isomorphic-fetch"

export const fetchPageData:
<T>(baseUrl: string,
    apiPath: string,
    token: string,
    dtoAccumulator: T[],
    extract: (element: any) => T) => Promise<T[]> =
<T>(baseUrl: string, apiPath: string, token: string, dtoAccumulator: T[], extract: (element: any) => T) =>
    (fetch(`${baseUrl}${apiPath}`, {
        headers: new Headers({ "content-type": "application/json", "auth": token }),
    }).then((response: Response) => (
        response.json().then(
            (nextPageJson: any) => extractPageData(nextPageJson, dtoAccumulator, baseUrl, token, extract))
    )))

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
