import * as fetch from "isomorphic-fetch"

export type BuildFetchSettingsAdapter = (baseUrl: string, token: string) =>
    () => Promise<Settings>

export type Setting = {
    id: number,
    name: string,
    value: string,
}

export type Settings = Setting[]

export const buildFetchSettingsAdapter: BuildFetchSettingsAdapter =
    (baseUrl, token) =>
        () =>
            fetch(`${baseUrl}/api/v1/settings`, {
                headers: new Headers({ "content-type": "application/json", "auth": token }),
            }).then((response: Response) => (
                response.json().then(toSettings)))

const toSettings: (resp: any) => Settings =
    (resp: any) =>
        resp.data as Settings
