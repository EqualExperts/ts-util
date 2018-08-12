import "jest"
import * as mysql from "mysql2/promise"
import { appendFileSync } from "fs"
import * as util from "util"

let conn
let pool

// let connection
beforeAll(async () => {
    // create connection
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000

    conn = await mysql.createConnection({
        host: "mysql.aslive.equalexperts.pt",
        user: "eebudget_user",
        password: "54Of7iIAiG",
        database: "eebudget"
    })

    pool = mysql.createPool({
        host: "mysql.aslive.equalexperts.pt",
        user: "eebudget_user",
        password: "54Of7iIAiG",
        database: "eebudget"
    })

    // pool = mysql.createPool({
    //     host: "mysql.prod.equalexperts.pt",
    //     user: "eebudget_user",
    //     password: "a4677iIAiG",
    //     database: "eebudget"
    // })

})

describe("MySql Adaptor", () => {
    it("HHHHHHH", async () => {

        const p = await mysql.createPool({
            host: "mysql.aslive.equalexperts.pt",
            user: "eebudget_user",
            password: "54Of7iIAiG",
            database: "eebudget"
        })
        const prom = await pool.getConnection()
            .then((co) => {
                // tslint:disable-next-line:max-line-length
                const res = co.execute("SELECT * from payrate_schedule where month=3 and year=2017", ["month", 3, "year", 2017])
                co.release()
                return res
            })

        log("RESULT=" + JSON.stringify(prom[0]))

        // .then((result) => {
        //     console.log(result[0])
        // }).catch((err) => {
        //     console.log(err) // any of connection time or query time errors from above
        // })
    })

    function log(msg: string) {
        appendFileSync("/tmp/jest.log.txt", new Date() + " - " + msg + "\n", { encoding: "utf8" })
    }
