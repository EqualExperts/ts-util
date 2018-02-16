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

const authorize = (gsuiteClient: any) => {
    const alreadyAuthorized = (gsuiteClient.credentials && gsuiteClient.credentials.access_token)
    if (alreadyAuthorized) {
        return Promise.resolve(gsuiteClient.credentials)
    }
    return new Promise((resolve, reject) => {
        gsuiteClient.authorize((err: any, tokens: any) => {
            if (err) {
                return reject(err)
            }
            return resolve(tokens)
        })
    })
}

const insertAccount = (gsuiteClient: any, resource: any): Promise<AccountResultDto> => {
    const admin = google.admin("directory_v1")
    return new Promise((resolve, reject) => {
        admin.users.insert({
            auth: gsuiteClient,
            resource,
        }, (err: any, response: any) => {
            if (err) {
                return reject(err)
            }
            return resolve(response.data as AccountResultDto)
        })
    })
}

const removeAccount = (gsuiteClient: any, userEmail: string): Promise<boolean> => {
    const admin = google.admin("directory_v1")
    return new Promise((resolve, reject) => {
        admin.users.delete({
            auth: gsuiteClient,
            userKey: userEmail,
        }, (err: any, response: any) => {
            if (err) {
                return reject(err)
            }
            return resolve(response.status === 204)
        })
    })
}

export const buildOnboardingAccountCreatorAdapter = (gsuiteClient: any) =>
    async (accountParamsDto: AccountParametersDto) => {
        await authorize(gsuiteClient)
        return await insertAccount(gsuiteClient, accountParamsDto)
    }

export const buildOnboardingAccountRemoverAdapter = (gsuiteClient: any) =>
    async (userEmail: string) => {
        await authorize(gsuiteClient)
        return await removeAccount(gsuiteClient, userEmail)
    }
