import { fetchPageData } from "./common"
import { buildGetUsersInfoAdapterWithResultsPerPage, UserInfoDto, UNDEFINED_USER } from "./usersInfoAdapter"
import { uniq } from "ramda"
import {
    buildFetchProjectInfoAdapter, ProjectInfo, ProjectState, UNDEFINED_PROJECT,
} from "./projectAdapter"
import { fromNullable, none, some } from "fp-ts/lib/Option"
import { buildFetchAssignmentsAdapter, FetchAssignmentsAdapater, AssignmentDto } from "./assignmentsAdapter"
import * as log4js from "log4js"

enum AssignmentType {
    PROJECT = "Project",
    LEAVE_TYPE = "LeaveType",
}

export type TimeEntryDto = {
    hours: number
    day: Date
    userId: number,

    firstName: string,
    lastName: string,
    email: string,

    projectName: string,
    projectOrPhaseStartDate: string,
    projectOrPhaseEndDate: string,
    resourceStartDateOnProjectOrPhase: string,
    resourceEndDateOnProjectOrPhase: string,
    assignableId: number,
    assignableType: string,
    parentId: number,
    assignableName: string,
    billable: boolean,
    approved: boolean,
    hourlyBillRate: number,
    createdAt: string,
    updatedAt: string,
    status: StatusDto[],
}

export type StatusDto = {
    id: number,
    status: string,
    approvable_id: number,
    approvable_type: string,
    submitted_by: number,
    submitted_at: string,
    approved_by: number,
    approved_at: string,
    created_at: string,
    updated_at: string
}

export const buildFetchTimeEntryAdapter: (baseUrl: string, token: string) => FetchTimeEntryAdapter =
    (baseUrl: string, token: string) =>
        buildFetchTimeEntryAdapterWithResultsPerPage(baseUrl, token, 50)

export type FetchTimeEntryAdapter = (from: string, to: string) => Promise<TimeEntryDto[]>

// TODO: this adapter is no more either the TimeEntries adapter or a ts-util adapter
// we need to refactor this code into an adapter at the backend layer.
// TimeEntries Adapter should just fetch time entries and all this orchestration should be done at the backend level.
// Making it work now, but this will need refactoring work in it on the future.
// author: @jpinho
export const buildFetchTimeEntryAdapterWithResultsPerPage
    : (baseUrl: string, token: string, resultsPerPage: number) => FetchTimeEntryAdapter =
    (baseUrl: string, token: string, resultsPerPage: number) =>
        async (from: string, to: string) => {
            try {
                const timeEntries: TimeEntryDto[] = await fetchPageData(
                    baseUrl,
                    `/api/v1/time_entries?fields=approvals&from=${from}&to=${to}&per_page=${resultsPerPage}`,
                    token,
                    [] as TimeEntryDto[],
                    extractDto)

                const getUsersInfoAdapter = buildGetUsersInfoAdapterWithResultsPerPage(baseUrl, token, resultsPerPage)
                const usersInfo: UserInfoDto[] = await getUsersInfoAdapter(
                    uniq(timeEntries.map((te: TimeEntryDto) => te.userId)))

                const uniqueAssignableIds = uniq(timeEntries
                    .filter((te: TimeEntryDto) => te.assignableType !== "LeaveType")
                    .map((te: TimeEntryDto) => te.assignableId))

                const fetchProjectInfo = buildFetchProjectInfoAdapter(baseUrl, token)
                const projects: ProjectInfo[] = await Promise.all(
                    uniqueAssignableIds.map(async (projectId: number) => await fetchProjectInfo(projectId)))

                const fetchAssignmentsForAProjectAdapter = buildFetchAssignmentsAdapter(baseUrl, token)
                const assignmentsMap = new Map<number, AssignmentDto[]>()
                await Promise.all(uniqueAssignableIds.map(async (assignableId) => {
                    const assignmentsDtos = await fetchAssignmentsForAProjectAdapter(assignableId)
                    assignmentsMap.set(assignableId, assignmentsDtos)
                    return
                }))

                const genuineTimeentries = timeEntries.filter((t) => t.hours > 0)
                return populateTE(genuineTimeentries, usersInfo, assignmentsMap, projects)

            } catch (error) {
                return Promise.reject(error)
            }
        }

const populateTE = (
    timeEntries: TimeEntryDto[],
    usersInfo: UserInfoDto[],
    assignmentsMap: Map<number, AssignmentDto[]>,
    projects: ProjectInfo[]) =>
    timeEntries.map((te: TimeEntryDto) => {
        const userInfo: UserInfoDto | undefined =
            usersInfo.find((u) => u.userId === te.userId)
        if (!userInfo) {
            throw new Error(`Could not find userId ${te.userId}`)
        }

        te.firstName = userInfo.firstName
        te.lastName = userInfo.lastName
        te.email = userInfo.email

        if (te.assignableType !== AssignmentType.LEAVE_TYPE) {
            const projectInfo: ProjectInfo | undefined =
                projects.find((project) => project.id === te.assignableId) || UNDEFINED_PROJECT

            te.projectName = projectInfo.name
            te.assignableName = projectInfo.clientName
            te.billable = projectInfo.billable
            te.parentId = projectInfo.parentId
            te.projectOrPhaseStartDate = projectInfo.startDate
            te.projectOrPhaseEndDate = projectInfo.endDate

            populateResourceStartAndEndDate(assignmentsMap, te)
        } else {
            te.assignableName = te.assignableType
            te.billable = false
        }
        return te
    })

const populateResourceStartAndEndDate = (assignmentsMap: Map<number, AssignmentDto[]>, te: TimeEntryDto) => {
    const log = log4js.getLogger()
    const assignmentsDtos = assignmentsMap.get(te.assignableId)
    if (assignmentsDtos) {
        const assignmentsDtoForUser = assignmentsDtos.filter((dto) => dto.user_id === te.userId)
        if (assignmentsDtoForUser.length === 0) {
            const errorMsg = `No matching assignments for a user ${te.userId} for project ${te.assignableId}.` +
                `This might have happened because, consultant is removed from project.` +
                `Best terminate a resource assigning a end date on project than removing from it. `
            log.warn(errorMsg)
            te.resourceStartDateOnProjectOrPhase = te.projectOrPhaseStartDate
            te.resourceEndDateOnProjectOrPhase = te.projectOrPhaseEndDate
        } else {
            te.resourceStartDateOnProjectOrPhase = assignmentsDtoForUser[0].starts_at
            te.resourceEndDateOnProjectOrPhase = assignmentsDtoForUser[0].ends_at
        }
    } else {
        throw new Error(`Assignment not found for ${te.assignableId}`)
    }
}

export const extractDto =
    (element: any) => ({
        hours: element.hours,
        day: new Date(element.date),
        userId: element.user_id,
        assignableId: element.assignable_id,
        assignableType: element.assignable_type,
        approved: toApprovedOrNot(element.approvals.data),
        status: element.approvals.data,
        hourlyBillRate: element.bill_rate,
        createdAt: element.created_at,
        updatedAt: element.updated_at,
    } as TimeEntryDto)

// TODO RF : 27/12/2017 : We have a small dillema here (here comes the story):
// 1) toApprovedOrNot is clearly an internal function, thus it shouldn't have a unit test.
//    1.a) another sign that a unit test for toApprovedOrNot is a smell: it deals with external data
//         (10KFT, that we don't control).
// 2) the other option is to have integration tests covering all the toApprovedOrNot paths, but that's not good either.
//    2.a) integration tests are not meant to cover different paths, but to be sure a component "talks" correctly with
//         the external world.
//    2.b) these tests would be very fragile and complex to maintain, since they would depend on very specific
//         combination of data in a staging environment.
// Conclusion 1: This seems to confirm what our team members are already feeling: that we have too much logic
//               happening in ts-util adaptors.
//               If we leave ts-util to convert a external domain to EE domain, and implement business logic in the
//               backend, we solve this problem.
// Conclusion 2: Until we refactor the adaptors in ts-util and move domain related logic to the backend,
//               we have to choose the "less" bad option.
//               So we are exposing toApprovedOrNot and implementing unit tests for it.
export const toApprovedOrNot: (maybeApprovals: Approval[]) => boolean = (maybeApprovals: Approval[]) =>
    fromEmpty(maybeApprovals).fold(
        () => false,
        (approvals: Approval[]) => {
            const approved = true
            return approvals.reduce<boolean>(
                (acc, current) => acc && isApproved(current)
                , approved,
            )
        })

// TODO RF : 27/12/2017 : Should be internal (see comments above)
export type Approval = {
    status: string,
}

const isApproved = (a: Approval) => a.status === "approved"

// This is DUPLICATED in projectAdapter
const fromEmpty = <T>(maybeArray: T[]) => {
    return fromNullable(maybeArray).fold(
        () => none,
        (array: T[]) => array.length === 0 ? none : some(array),
    )
}
