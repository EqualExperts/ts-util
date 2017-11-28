import "jest"
import { readFile, readFileSync, appendFileSync } from "fs"
import { exportCsv } from "../../src/filesystem/csv"
import { appendFile } from "fs"
import * as nano from "nano-seconds"

describe("Exporting ", () => {
    it("exports content to csv", async () => {
        // given
        const content = [
            { name: "John Fraga", age: 30, height: 1.5 },
            { name: "Mary Perrera", age: 20, height: 3.2 },
        ]
        const transformer: (obj: any) => string = (obj: any) => `${obj.name}|${obj.age}|${obj.height}`

        // when
        const csvFile = await exportCsv(content, transformer)

        // then
        expect(firstEntryOf(csvFile)).toBe("John Fraga|30|1.5")
        expect(secondEntryOf(csvFile)).toBe("Mary Perrera|20|3.2")
    })

    it("exports to new csv file on each export call", async () => {
        // when
        const csvFile1 = await exportCsv([{ a: 1 }], (obj: any) => "1|2")
        const csvFile2 = await exportCsv([{ a: 1 }], (obj: any) => "1|2")

        // then
        const fileCreatedDt1 = fileCreatedTimestamp(csvFile1)
        const fileCreatedDt2 = fileCreatedTimestamp(csvFile2)
        expect(nano.difference(fileCreatedDt1, fileCreatedDt2)).toBeGreaterThan(0)
    })
})

const firstEntryOf = (csvFile: string) => readFileLine(csvFile, 0)

const secondEntryOf = (csvFile: string) => readFileLine(csvFile, 1)

const readFileLine = (csvFile: string, lineNum: number) =>
    readFileSync(csvFile, "utf8").split("\n")[lineNum]

const fileCreatedTimestamp = (file: string) => {
    const createdTime = file.substring(file.indexOf("-") + 1, file.indexOf(".csv"))
    return nano.fromISOString(createdTime)
}

// TODO remove me
function log(msg: string) {
    appendFileSync("/tmp/jest.log.txt", msg + "\n", { encoding: "utf8" })
}
