import * as fetch from "isomorphic-fetch"

export type FetchAssignableInfoAdapter = (assignableId: number) => Promise<string>
export type BuildFetchAssignableInfoAdapter = (baseUrl: string, token: string) => FetchAssignableInfoAdapter

export const buildFetchAssignableInfoAdapter: BuildFetchAssignableInfoAdapter =
    (baseUrl, token) => {
        return (assignableId) => {
            return fetch(`${baseUrl}/api/v1/projects/${assignableId}`, {
                headers: new Headers({ "content-type": "application/json", "auth": token }),
            }).then((response: Response) => (
                response.json().then(
                    (resp: any) => resp.name,
                )))
        }
    }
