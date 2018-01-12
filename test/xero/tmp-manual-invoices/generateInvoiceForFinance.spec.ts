import { TrackingItemDto } from './../../../src/xero/invoiceAdapter';
import "jest"
import { buildXeroClient, buildCreateInvoiceAdapter, InvoiceDto, Config } from "../../../src/xero/invoiceAdapter"
import * as path from "path"
import fs = require("fs")
import { buildConfigAdapter } from "../../../src/config/adapter"

let xeroClient: any

beforeAll(() => {
    prepareProcessEnvVars()

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
        privateKeyPath: envVars("XERO_PRIVATE_KEY_PATH"),
    }
    xeroClient = buildXeroClient(config)
})

/**
 * This code enables us to quickly generate an invoice on Xero with hardcoded data.
 * This kind of report is mainly used to produce reports to Jonathan Mundy, so that
 * he can ASAP validate with our stakeholders that we are producing the desired output
 * requested by the Finance Team.
 *
 * Disclaimer: As soon as we have an entire e2e flow generating invoices from the backend,
 * we can discard these, and start using our application to produce these invoices.
 *
 * @author @jpinho @rfiume
 */
describe("Invoice Adapter", () => {

    /**
     * Enable test to generate 1 sample.
     * These tests are intentionally ignored.
     */
    xit("generate invoice manually to send to finance", async () => {

        // when
        const createInvoiceAdapter = buildCreateInvoiceAdapter(xeroClient)

        const invoiceDto: InvoiceDto = {
            Type: "ACCREC",
            Contact: { ContactID: "6295e95a-24c5-4c75-891d-ab085cbf0b3c" },
            Date: "2017-12-01",
            DueDate: "2017-12-31",
            LineItems: [{
                Description: "Richard Sherman",
                Quantity: 18,
                UnitAmount: Math.round(100.00 * 8),
                TaxType: "OUTPUT2",
                AccountCode: "1",
                Tracking: [{
                    Name: "Client",
                    Option: "Amplience",
                }, {
                    Name: "Costing Month",
                    Option: "Dec 2017",
                }],
            }, {
                Description: "Steve Bakhtiari",
                Quantity: 12,
                UnitAmount: Math.round(90.63 * 8),
                TaxType: "OUTPUT2",
                AccountCode: "1",
                Tracking: [{
                    Name: "Client",
                    Option: "Amplience",
                }, {
                    Name: "Costing Month",
                    Option: "Dec 2017",
                }],
            }],
            Reference: "PO002539",
        }

        const result = await createInvoiceAdapter(invoiceDto)

        // then
        expect(result).toBeTruthy() // containsAnId
    })
})

function prepareProcessEnvVars() {
    const keyBaseFilePath = "/keybase/team/ee_software/aslive/xero-credentials"
    const keybaseXeroPrivateKeyFile = path.join(keyBaseFilePath, "privatekey.pem")
    const xeroConsumerKeyFile = path.join(keyBaseFilePath, "consumer-key.txt")
    const xeroConsumerSecretFile = path.join(keyBaseFilePath, "consumer-secret.txt")

    if (fs.existsSync(xeroConsumerKeyFile) && fs.existsSync(xeroConsumerSecretFile)) {
        process.env.XERO_CONSUMER_KEY = fs.readFileSync(xeroConsumerKeyFile, "utf-8")
        process.env.XERO_CONSUMER_SECRET = fs.readFileSync(xeroConsumerSecretFile, "utf-8")
    }
    if (fs.existsSync(keybaseXeroPrivateKeyFile)) {
        process.env.XERO_PRIVATE_KEY_PATH = keybaseXeroPrivateKeyFile
    }
}
