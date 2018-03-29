import * as fetch from "isomorphic-fetch"

export type BuildFetchSettingsAdapter = (baseUrl: string, token: string) =>
    FetchSettingsAdapter

export type FetchSettingsAdapter = () => Promise<SettingsDto>

export type SettingDto = {
    id: number,
    name: string,
    value: string,
}

export type SettingsDto = SettingDto[]

export const buildFetchSettingsAdapter: BuildFetchSettingsAdapter =
    (baseUrl, token) =>
        () =>
            fetch(`${baseUrl}/api/v1/settings`, {
                headers: new Headers({ "content-type": "application/json", "auth": token }),
            }).then((response: Response) => (
                response.json().then(toSettings)))

const toSettings: (resp: any) => SettingsDto =
    (resp: any) =>
        resp.data as SettingsDto
