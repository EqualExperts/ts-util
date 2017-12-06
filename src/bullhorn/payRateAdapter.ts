import BullhornClient from "tmp-fork-bullhorn/lib/Client"
import { appendFileSync } from "fs"

export type BuildBullhornClient = (config: BullhornConfig) => Promise<BullhornClient>
export const buildBullhornClient: BuildBullhornClient =
    (config: BullhornConfig) => {
        const client = new BullhornClient({
            server: config.bhServer,
            authServer: config.bhAuthServer,
            clientId: config.bhClientId,
            secret: config.bhSecret,
        })

        return client.login(config.bhUserName, config.bhPassowrd)
    }

export type BullhornPayRateAdapter = (emails: [string]) => Promise<PayRateDto[]>
export type BuildBullhornPayRateAdapter = (bhClient: BullhornClient) => BullhornPayRateAdapter

export const buildBullhornPayRateAdapter: BuildBullhornPayRateAdapter =
    (bhClient: BullhornClient) => {
        return (emails: [string]) => {
            // TODO - for each candidate (email), we are making a separate api call
            // if this is an issue think of optimising it just by making 1 api call
            // Load test this
            const associatePayRates = emails.map(async (emailAddress) => {
                const candidate = await bhClient.search("Candidate",
                    {
                        query: `email:${emailAddress} or email2:${emailAddress} or email3:${emailAddress}`,
                        fields: ["id,firstName,lastName,placements"],
                    })

                const placementsQuery = candidate.data[0].placements.data.map((p: any) => "id:" + p.id).join(" or ")

                const placementsList = await bhClient.search("Placement",
                    {
                        query: placementsQuery,
                        fields: ["id,payRate"],
                    })

                const payRates = placementsList.data.map((placement: any) => placement.payRate)
                return { email: emailAddress, rates: payRates } as PayRateDto
            })
            return Promise.all(associatePayRates)
        }
    }

export type BullhornConfig = {
    bhServer: string,
    bhAuthServer: string,
    bhClientId: string,
    bhSecret: string,
    bhUserName: string,
    bhPassowrd: string,
}

export type PayRateDto = {
    email: string,
    rates: number[],
}

function log(msg: string) {
    appendFileSync("/tmp/jest.log.txt", new Date() + " - " + msg + "\n", { encoding: "utf8" })
}

// TODO
// intermittent error from bullhorn api (and not from library)
// Could not access HTTP invoker remote service at
// [http://sl121dataservices.vip.bos.bullhorn.com/data-services-2.6/sr/DataService];
// nested exception is java.io.InvalidObjectException: enum constant VIEW_CANDIDATE_VIEWABLE_CONFIDENTIAL_FIELDS
// does not exist in class com.bullhorn.entity.acl.AclAction
