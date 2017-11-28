import "jest"
import { readFile, readFileSync, appendFileSync } from "fs"
import { exportCsv } from "../../src/filesystem/csv"

describe("Exporting ", () => {
    it("exports content to csv", async () => {
        // given
        const content = [
            { name: "John Fraga", age: 30, height: 1.5 },
            { name: "Mary Perrera", age: 20, height: 3.2 },
        ]
        const transformer: (obj: any) => string = (obj: any) => `${obj.name}|${obj.age}|${obj.height}`

        // when
        const csvPath = await exportCsv(content, transformer)

        // then
        expect(firstEntryOf(csvPath)).toBe("John Fraga|30|1.5")
        expect(secondEntryOf(csvPath)).toBe("Mary Perrera|20|3.2")
    })
})

// TODO remove me
function log(msg: string) {
    appendFileSync("/tmp/jest.log.txt", msg + "\n", { encoding: "utf8" })
}

const firstEntryOf = (csvFile: string) => {
    log("first line is " + readFileLine(csvFile, 0))
    return readFileLine(csvFile, 0)
}

const secondEntryOf = (csvFile: string) => {
    log("second line is " + readFileLine(csvFile, 1))
    return readFileLine(csvFile, 1)
}

const readFileLine = (csvFile: string, lineNum: number) => {
    return readFileSync(csvFile, "utf8").split("\n")[lineNum]
}
