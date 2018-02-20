import { google } from "googleapis"

export type GSuiteConfig = {
    clientEmail: string,
    privateKey: string,
    impersonationEmail: string,
}

// reference: https://developers.google.com/admin-sdk/directory/v1/reference/users/insert
export type AccountParametersDto = {
    primaryEmail: string,
    name: {
        givenName: string,
        familyName: string,
    },
    password: string,
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
export type BuildAccountCreatorAdapter = (gSuiteClient: any) => GSuiteAccountCreatorAdapter

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

export const buildGSuiteClient = (config: GSuiteConfig): any => {
    const requiredScopes = [
        "https://www.googleapis.com/auth/admin.directory.user",
    ]
    const client = new google.auth.JWT(
        config.clientEmail,
        undefined,
        config.privateKey,
        requiredScopes,
        config.impersonationEmail,
    )
    return client
}

const authorize = (gSuiteClient: any) => {
    const alreadyAuthorized = (gSuiteClient.credentials && gSuiteClient.credentials.access_token)
    if (alreadyAuthorized) {
        return Promise.resolve(gSuiteClient.credentials)
    }
    return new Promise((resolve, reject) => {
        gSuiteClient.authorize((err: any, tokens: any) => {
            if (err) {
                return reject(err)
            }
            return resolve(tokens)
        })
    })
}

const createAccount = (gSuiteClient: any, resource: any): Promise<AccountResultDto> => {
    const admin = google.admin("directory_v1")
    return new Promise((resolve, reject) => {
        admin.users.insert({
            auth: gSuiteClient,
            resource,
        }, (err: any, response: any) => {
            if (err) {
                return reject(err)
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
                return reject(err)
            }
            return resolve(response.status === 204)
        })
    })
}
