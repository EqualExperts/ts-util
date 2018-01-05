import * as fetch from "isomorphic-fetch"

export type FetchAssignableInfoAdapter = (assignableId: number) => Promise<ProjectInfo>
export type BuildFetchProjectInfoAdapter = (baseUrl: string, token: string) => FetchAssignableInfoAdapter

export type ProjectInfo = {
    id: number,
    name: string,
    state: string,
    billable: boolean,
    clientName: string,
}

export enum ProjectState {
    INTERNAL = "Internal",
    TENTATIVE = "Tentative",
    CONFIRMED = "Confirmed",
}

export const UNDEFINED_PROJECT = { id: -1, name: "[#UNDEF]", state: "[#UNDEF]" } as ProjectInfo

export const buildFetchProjectInfoAdapter: BuildFetchProjectInfoAdapter =
    (baseUrl, token) => {
        return (projectId) => {
            return fetch(`${baseUrl}/api/v1/projects/${projectId}`, {
                headers: new Headers({ "content-type": "application/json", "auth": token }),
            }).then((response: Response) => (
                response.json().then(toProjectInfo)))
        }
    }

const toProjectInfo: (resp: any) => ProjectInfo =
    (resp: any) => ({
        id: resp.id,
        name: resp.name,
        state: resp.project_state,
        billable: resp.project_state !== undefined && resp.project_state !== ProjectState.INTERNAL,
        clientName: resp.client,
    } as ProjectInfo)
