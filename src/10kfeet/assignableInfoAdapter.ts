import { AssignableInfo } from "./assignableInfoAdapter"
import * as fetch from "isomorphic-fetch"

export type FetchAssignableInfoAdapter = (assignableId: number) => Promise<AssignableInfo>
export type BuildFetchAssignableInfoAdapter = (baseUrl: string, token: string) => FetchAssignableInfoAdapter

export type AssignableInfo = {
    id: number,
    name: string,
}

export const buildFetchAssignableInfoAdapter: BuildFetchAssignableInfoAdapter =
    (baseUrl, token) => {
        return (assignableId) => {
            return fetch(`${baseUrl}/api/v1/projects/${assignableId}`, {
                headers: new Headers({ "content-type": "application/json", "auth": token }),
            }).then((response: Response) => (
                response.json().then(
                    (resp: any) => ({
                        id: assignableId,
                        name: resp.name,
                    } as AssignableInfo),
                )))
        }
    }
