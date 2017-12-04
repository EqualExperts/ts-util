import "jest"
import BullhornClient from "bullhorn.ts"
import { appendFileSync } from "fs"

it("payrate", async () => {
    try {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 500000

        const client = new BullhornClient({
            server: "https://rest21.bullhornstaffing.com",
            authServer: "https://auth.bullhornstaffing.com",
            clientId: "a89d37d5-9704-4b12-8e82-1f589f54c335",
            secret: "P7DjeQ624BMI6wt7c5bwt5d4",
        })
        log("start authenticating....")
        const c = await client.login("esoftware", "esoft2017!")
        log("authenticating completed....")

        const email = "nikola.tesla@equalexperts.com"
        const candidate = await client.search("Candidate",
            {
                query: `email:${email} or email2:${email} or email3:${email}`,
                fields: ["id,firstName,lastName,placements"],
            })

        const placementsQuery = candidate.data[0].placements.data.map((p) => "id:" + p.id).join(" or ")

        const placementsList = await client.search("Placement",
            {
                query: placementsQuery,
                fields: ["id,payRate"],
            })

        log("Candidate" + JSON.stringify(placementsList))
        // const note = await c.getEntity("Placement", 1, ["id", "payRate"]).catch((err) => log(err))
        // log("Note" + JSON.stringify(note))
    } catch (e) {
        log("--------------------------")
        log(e)
    }
})

function log(msg: string) {
    appendFileSync("/tmp/jest.log.txt", new Date() + " - " + msg + "\n", { encoding: "utf8" })
}
