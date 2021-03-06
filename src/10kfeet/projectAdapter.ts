import * as fetch from "isomorphic-fetch"
import { fromNullable, none, some } from "fp-ts/lib/Option"
import { fetchPageData } from "./common"
import { category } from "fp-ts"

export type FetchAssignableInfoAdapter = (assignableId: number) => Promise<ProjectInfo>
export type BuildFetchProjectInfoAdapter = (baseUrl: string, token: string) => FetchAssignableInfoAdapter

export type ProjectInfo = {
    id: number,
    parentId: number,
    name: string,
    state: string,
    billable: boolean,
    clientName: string,
    startDate: string,
    endDate: string
}

export enum ProjectState {
    INTERNAL = "Internal",
    TENTATIVE = "Tentative",
    CONFIRMED = "Confirmed",
}

export const UNDEFINED_PROJECT = { id: -1, name: "[#UNDEF]", state: "[#UNDEF]" } as ProjectInfo

export const buildFetchProjectInfoAdapter: BuildFetchProjectInfoAdapter =
    (baseUrl, token) =>
        (projectId) =>
            fetch(`${baseUrl}/api/v1/projects/${projectId}`, {
                headers: new Headers({ "content-type": "application/json", "auth": token }),
            }).then((response: Response) => (
                response.json().then(toProjectInfo)))

export type PhaseDto = {
    id: number,
    projectName: string,
    phaseName: string,
    budgetItems: BudgetItemsDto,
}

export type BudgetItemsDto = {
    category: string,
}

export type FetchPhasesAdapter = (projectId: number) => Promise<PhaseDto[]>

export const buildFetchPhasesAdapter: (baseUrl: string, token: string) => FetchPhasesAdapter =
    (baseUrl, token) =>
        async (projectId) =>
            fetchPageData(
                baseUrl,
                `/api/v1/projects/${projectId}/phases?fields=budget_items&per_page=${PHASES_FOR_PAGE}`,
                token,
                [],
                toPhaseDto)

const toProjectInfo: (resp: any) => ProjectInfo =
    (resp: any) => ({
        id: resp.id,
        parentId: resp.parent_id,
        name: resp.name,
        state: resp.project_state,
        billable: resp.project_state !== undefined && resp.project_state !== ProjectState.INTERNAL,
        clientName: resp.client,
        startDate: resp.starts_at,
        endDate: resp.ends_at,
    } as ProjectInfo)

const toPhaseDto = (resp: any) =>
    ({
        id: resp.id,
        projectName: resp.name,
        phaseName: resp.phase_name,
        budgetItems: toBudgetItemsDto(resp.budget_items.data),
    })

const toBudgetItemsDto = (maybeBudgetItems: BudgetItemsDto[]) =>
    fromEmpty(maybeBudgetItems).fold(
        () => ({ category: "" }),
        (budgetItems: BudgetItemsDto[]) => ({ category: budgetItems[0].category }),
    )

// This is DUPLICATED in timeEntryAdapter
const fromEmpty = <T>(maybeArray: T[]) => {
    return fromNullable(maybeArray).fold(
        () => none,
        (array: T[]) => array.length === 0 ? none : some(array),
    )
}

const PHASES_FOR_PAGE = 50
