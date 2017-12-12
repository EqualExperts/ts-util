import "jest"
import { readFile, readFileSync, appendFileSync } from "fs"
import { buildCsvExporter, FilePath, CsvExporter } from "../../src/filesystem/csv"
import { appendFile } from "fs"
import * as nano from "nano-seconds"

describe("Csv", () => {
    it("exports content to csv using separator defined in transformers", async () => {
        const content = [
            { name: "John Fraga", age: 30, height: 1.5 },
            { name: "Mary Perrera", age: 20, height: 3.2 },
        ]
        const headerTransformer: () => string = () => "Full Name,Age,Height"
        const itemTransformer: (obj: any) => string = (obj: any) => `${obj.name},${obj.age},${obj.height}`
        const exportCsv: CsvExporter<any> = buildCsvExporter(headerTransformer, itemTransformer)

        const csvFile = await exportCsv(content)

        expect(headersOf(csvFile)).toBe("Full Name,Age,Height")
        expect(firstEntryOf(csvFile)).toBe("John Fraga,30,1.5")
        expect(secondEntryOf(csvFile)).toBe("Mary Perrera,20,3.2")
    })

    it("exports to new csv file on each export call", async () => {
        const content = [{ a: 1 }]
        const itemTransformer = (obj: any) => "1|2"
        const headerTransformer = () => "Num1|Num2"
        const exportCsv: CsvExporter<any> = buildCsvExporter(headerTransformer, itemTransformer)

        const aCsvFile = await exportCsv(content)
        const anotherCsvFile = await exportCsv(content)

        expect(filesAreDifferent(aCsvFile, anotherCsvFile)).toBeTruthy()
    })
})

const filesAreDifferent = (aCsvFile: string, anotherCsvFile: string) =>
    nano.difference(creationTimeOf(aCsvFile), creationTimeOf(anotherCsvFile)) > 0

const headersOf = (csvFile: string) => readFileLine(csvFile, 0)

const firstEntryOf = (csvFile: string) => readFileLine(csvFile, 1)

const secondEntryOf = (csvFile: string) => readFileLine(csvFile, 2)

const readFileLine = (csvFile: string, lineNum: number) =>
    readFileSync(csvFile, "utf8").split("\n")[lineNum]

const creationTimeOf = (file: string) => {
    const createdTime = file.substring(file.indexOf("-") + 1, file.indexOf(".csv"))
    return nano.fromISOString(createdTime)
}
