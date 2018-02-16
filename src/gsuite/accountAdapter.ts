import { google } from "googleapis"

export type GSuiteConfig = {
    clientEmail: string,
    privateKey: string,
    impersonationEmail: string,
}

export type AccountParametersDto = {
    primaryEmail: string,
    name: {
        givenName: string,
        familyName: string,
    },
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
    // TODO: implement this using functional lib?
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
    // TODO: implement this using functional lib?
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

export const buildOnboardingAccountCreatorAdapter = (gsuiteClient: any) =>
    async (accountParamsDto: AccountParametersDto) => {
        await authorize(gsuiteClient)
        const result = await insertAccount(gsuiteClient, accountParamsDto)
        return result
    }
