import { google } from "googleapis"

export type GSuiteConfig = {
    clientEmail: string,
    privateKey: string,
    impersonationEmail: string,
    organisation: string
}

export const buildGSuiteClient = (config: GSuiteConfig, scopes?: string[], impersonationEmail?: string): any => {
    const requiredScopes = scopes || [
        "https://www.googleapis.com/auth/admin.directory.user"
    ]
    const client = new google.auth.JWT(
        config.clientEmail,
        undefined,
        config.privateKey,
        requiredScopes,
        impersonationEmail || config.impersonationEmail,
    )
    return client
}

export const authorize = (gSuiteClient: any) => {
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
