import { fetchPageData } from "./common"

export type BuildFetchAssignmentsAdapter =
    (baseUrl: string, token: string) => FetchAssignmentsAdapater
export type FetchAssignmentsAdapater = (assignableId: number) => Promise<AssignmentDto[]>

export type AssignmentDto = {
    id: number
    user_id: number,
    assignable_id: number,
    starts_at: string,
    ends_at: string
}

export const buildFetchAssignmentsAdapter: BuildFetchAssignmentsAdapter =
    (baseUrl, token) =>
        async (assignableId) => fetchPageData(
            baseUrl,
            `/api/v1/projects/${assignableId}/assignments?fields=per_page=200`,
            token,
            [],
            toAssignmentDto)

export const toAssignmentDto: (resp: any) => AssignmentDto =
    (resp: any) => ({
        id: resp.id,
        user_id: resp.user_id,
        assignable_id: resp.assignable_id,
        starts_at: resp.starts_at,
        ends_at: resp.ends_at,
    } as AssignmentDto)
