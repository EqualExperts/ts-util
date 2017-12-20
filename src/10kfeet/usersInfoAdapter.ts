import * as fetch from "isomorphic-fetch"
import { fetchPageData } from "./common"

export type UserInfoDto = {
    firstName: string,
    lastName: string,
    email: string,
    userId: number,
}

export const UNDEFINED_USER = {
    userId: -1, firstName: "[#UNDEF]", lastName: "[#UNDEF]", email: "[#UNDEF]",
} as UserInfoDto

export type GetUsersInfoAdapter = (userIds: number[]) => Promise<UserInfoDto[]>

export const buildFetchTimeEntryAdapter: (baseUrl: string, token: string) => GetUsersInfoAdapter =
    (baseUrl, token) => buildGetUsersInfoAdapterWithResultsPerPage(baseUrl, token, 20)

export const buildGetUsersInfoAdapterWithResultsPerPage: (baseUrl: string, token: string, resultsPerPage: number)
    => GetUsersInfoAdapter =
    (baseUrl, token, perPage) => (userIds) =>
        (fetchPageData(baseUrl, `/api/v1/users?id=${userIds.join(",")}&per_page=${perPage}`, token, [], extractDtos))

const extractDtos: (json: any) => UserInfoDto =
    (element: any) => ({
        firstName: element.first_name,
        lastName: element.last_name,
        email: element.email,
        userId: element.id,
    })
