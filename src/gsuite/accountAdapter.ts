import { google } from "googleapis"
import { AccountResultDto } from "./accountAdapter"
import * as util from "util"
import { authorize } from "./client"

// reference: https://developers.google.com/apis-explorer/#s/admin/directory_v1/directory.users.list
export type GSuiteListAccountOptions = {
    domain: string,
    maxResults: number,
    showDeleted: boolean,
    viewType: string,
    fields: string,
    projection: string,
    orderBy: string
}

// reference: https://developers.google.com/admin-sdk/directory/v1/reference/users/insert
export type AccountParametersDto = {
    primaryEmail: string,
    name: {
        givenName: string,
        familyName: string,
    },
    password: string,
    changePasswordAtNextLogin?: boolean,
    orgUnitPath?: string,
}

export type AccountResultDto = {
    kind: string,
    id: string,
    etag: string,
    primaryEmail: string,
    name: {
        givenName: string,
        familyName: string,
    },
    isAdmin: boolean,
    isDelegatedAdmin: boolean,
    creationTime: string,
    suspended: boolean,
    suspensionReason?: string,
    customerId: string,
    orgUnitPath: string,
    isMailboxSetup: boolean,
}

export type GSuiteAccountCreatorAdapter = (accountParametersDto: AccountParametersDto) => Promise<AccountResultDto>
export type GSuiteAccountCatalogAdapter = (listAccountOptions: GSuiteListAccountOptions) => Promise<AccountResultDto[]>

export type BuildAccountCreatorAdapter = (gSuiteClient: any) => GSuiteAccountCreatorAdapter
export type BuildAccountCatalogAdapter = (gSuiteClient: any) => GSuiteAccountCatalogAdapter

export const buildAccountCatalogAdapter: BuildAccountCatalogAdapter = (gsuiteClient: any) =>
    async (listAccountOptions) => {
        await authorize(gsuiteClient)
        return listAccounts(gsuiteClient, listAccountOptions)
    }

export const buildAccountCreatorAdapter: BuildAccountCreatorAdapter = (gSuiteClient) =>
    async (accountParamsDto) => {
        await authorize(gSuiteClient)
        return createAccount(gSuiteClient, accountParamsDto)
    }

export const buildAccountRemoverAdapter = (gSuiteClient: any) =>
    async (userEmail: string) => {
        await authorize(gSuiteClient)
        return removeAccount(gSuiteClient, userEmail)
    }

const createAccount = (gSuiteClient: any, resource: any): Promise<AccountResultDto> => {
    const admin = google.admin("directory_v1")
    return new Promise((resolve, reject) => {
        admin.users.insert({
            auth: gSuiteClient,
            resource,
        }, (err: any, response: any) => {
            if (err) {
                return reject("GSuite Create Account Error -" + err + " " + JSON.stringify(err))
            }
            return resolve(response.data as AccountResultDto)
        })
    })
}

const removeAccount = (gSuiteClient: any, userEmail: string): Promise<boolean> => {
    const admin = google.admin("directory_v1")
    return new Promise((resolve, reject) => {
        admin.users.delete({
            auth: gSuiteClient,
            userKey: userEmail,
        }, (err: any, response: any) => {
            if (err) {
                return reject("GSuite Remove Account Error -" + err + " " + JSON.stringify(err))
            }
            return resolve(response.status === 204)
        })
    })
}

const listAccounts = (gsuiteClient: any, listAccountsOptions: GSuiteListAccountOptions):
    Promise<AccountResultDto[]> => {

    const admin = google.admin("directory_v1")
    return new Promise((resolve, reject) => {
        admin.users.list({
            auth: gsuiteClient,
            ...listAccountsOptions
        }, (err: any, response: any) => {
            if (err) {
                return reject("GSuite List Account Error -" + err + " " + JSON.stringify(err))
            }
            return resolve(response.data.users ?
                response.data.users.map((user: any) => user as AccountResultDto) :
                [] as AccountResultDto[]
            )
        })
    })
}
