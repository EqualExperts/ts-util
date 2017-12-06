import BullhornClient from "tmp-fork-bullhorn/lib/Client"

export const buildBullhornClient: (config: BullhornConfig) => Promise<BullhornClient> =
    (config: BullhornConfig) => {
        const client = new BullhornClient({
            server: config.bhServer,
            authServer: config.bhAuthServer,
            clientId: config.bhClientId,
            secret: config.bhSecret,
        })

        return client.login(config.bhUserName, config.bhPassowrd)
    }

export type BullhornConfig = {
    bhServer: string,
    bhAuthServer: string,
    bhClientId: string,
    bhSecret: string,
    bhUserName: string,
    bhPassowrd: string,
}
