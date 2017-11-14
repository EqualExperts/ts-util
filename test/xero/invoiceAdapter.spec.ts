import "jest"
import { buildXeroClient, buildCreateInvoiceAdapter, InvoiceDto } from "../../src/xero/invoiceAdapter"
import * as path from "path"

describe("Invoice Adapter", () => {
    it("should create invoice", async () => {
        // given
        const pemPath = path.join(__dirname, "xero-int-test-privatekey.pem")
        // TODO - Think about the appropriate place for these creds (This is test account)
        const config = {
            userAgent: "XERO_INTEGRATION_TESTS",
            consumerKey: "MX7882OECQWAPJUC6F6TAZZWWP8K2O",
            consumerSecret: "UQYQKKPXRAVZGYMBL9DQVNPJVO9XQF",
            privateKeyPath: pemPath,
            privateKey: "",
        }
        const xeroClient = buildXeroClient(config)
        const createInvoiceAdapter = buildCreateInvoiceAdapter(xeroClient)
        const invoiceDto: InvoiceDto = {
            Type: "ACCPAY",
            Contact: { Name: "Mary" },
            LineItems: [{
                Description: "Monthly rental for property at 56a Wilkins Avenue",
                Quantity: 6,
                UnitAmount: 495.00,
                AccountCode: "200",
            }],
        }

        // when
        const result = await createInvoiceAdapter(invoiceDto)

        // then
        expect(result.entities[0]._obj.InvoiceID).toBeTruthy()
    })
})
