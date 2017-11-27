import "jest"
import { readFile } from "fs"
import { exportCsv } from "../../src/filesystem/csv"

describe("Exporting ", () => {
    xit("exports content to csv", () => {
        // given
        const content = [
            { name: "John Fraga", age: 30, height: 1.5 },
            { name: "Mary Perrera", age: 20, height: 3.2 },
        ]
        const transformer: (obj: any) => string = (obj: any) => `${obj.name}|${obj.age}|${obj.height}`

        // when
        const csvPath = exportCsv(content, transformer)

        // then
        expect(firstEntryOf(csvPath)).toBe("John Fraga|30|1.5")
        expect(secondEntryOf(csvPath)).toBe("Mary Perrera|20|3.2")
    })
})

const firstEntryOf = (csvPath: string) => {
    let a: string
    readFile(csvPath, (err, data) => {
        a = data.toString().split("\n")[0]
    })
    return a
}

const secondEntryOf = (csvPath: string) => {
    let a: string
    readFile(csvPath, (err, data) => {
        a = data.toString().split("\n")[1]
    })
    return a
}
