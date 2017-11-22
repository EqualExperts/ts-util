import * as fetch from "isomorphic-fetch"

export type UserInfoDto = {}

export type GetUserInfoAdapter = (userId: number) => Promise<UserInfoDto>

export const buildGetUserInfoAdapter: (apiUrl: string, token: string) => GetUserInfoAdapter =
    (apiUrl, token) => (userId) => (fetch(apiUrl))
