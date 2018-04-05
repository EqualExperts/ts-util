import "jest"
import { buildXeroClient, buildXeroCreateInvoiceAdapter, InvoiceDto, Config } from "../../src/xero/invoiceAdapter"
import * as path from "path"
import fs = require("fs")
import { buildConfigAdapter } from "../../src/config/adapter"

let xeroClient: any

beforeAll(() => {
    prepareProcessEnvVars()

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000

    const envVars = buildConfigAdapter({
        XERO_CONSUMER_KEY: {},
        XERO_CONSUMER_SECRET: {},
        XERO_PRIVATE_KEY_PATH: {},
    }).getOrElse(
        (wrongConfigMessage) => { throw new Error(wrongConfigMessage) },
    )

    const config: Config = {
        userAgent: "XERO_INTEGRATION_TESTS",
        consumerKey: envVars("XERO_CONSUMER_KEY"),
        consumerSecret: envVars("XERO_CONSUMER_SECRET"),
        privateKey: fs.readFileSync(envVars("XERO_PRIVATE_KEY_PATH"), "utf8"),
    }

    xeroClient = buildXeroClient(config)
})

describe("Invoice Adapter", () => {
    it("creates an invoice", async () => {
        // when
        const createInvoiceAdapter = buildXeroCreateInvoiceAdapter(xeroClient)

        const invoiceDto: InvoiceDto = {
            Type: "ACCREC",
            Contact: { ContactID: "6295e95a-24c5-4c75-891d-ab085cbf0b3c" },
            Date: "2018-01-01",
            DueDate: "2018-01-30",
            LineItems: [{
                Description: "Richard Davie Hamilthon - December 2017",
                Quantity: 20,
                UnitAmount: 495.00,
                TaxType: "OUTPUT2",
            }],
            Reference: "PO 1234567",
        }

        const result = await createInvoiceAdapter(invoiceDto)

        // then
        expect(result.id).toBeTruthy() // containsAnId
        expect(result.total).toBe(11880) // containsAnId

    })
})

async function prepareProcessEnvVars() {
    const keyBaseFilePath = "/keybase/team/ee_software/aslive/xero-credentials"

    // To run locally
    if (fs.existsSync(keyBaseFilePath)) {
        const keybaseXeroPrivateKeyFile = path.join(keyBaseFilePath, "privatekey.pem")
        const xeroConsumerKeyFile = path.join(keyBaseFilePath, "consumer-key.txt")
        const xeroConsumerSecretFile = path.join(keyBaseFilePath, "consumer-secret.txt")

        process.env.XERO_CONSUMER_KEY = fs.readFileSync(xeroConsumerKeyFile, "utf-8")
        process.env.XERO_CONSUMER_SECRET = fs.readFileSync(xeroConsumerSecretFile, "utf-8")
        process.env.XERO_PRIVATE_KEY_PATH = keybaseXeroPrivateKeyFile
    } else {
        // To run on Travis
        const secretDir = path.join(__dirname, "../secrets")
        process.env.XERO_PRIVATE_KEY_PATH = path.join(secretDir, "xeropkey.pem")
    }
}
