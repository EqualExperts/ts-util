import { appendFile, appendFileSync } from "fs"

// TODO remove me
function log(msg: string) {
    appendFileSync("/tmp/jest.log.txt", msg + "\n", { encoding: "utf8" })
}
// TODO return type should be promise (Exporting should be an async operation)
export const exportCsv = async <T>(content: T[], transformer: (item: T) => string): Promise<string> => {
    const csvFileName = "/tmp/csv-" + Date.now() + ".csv"
    content.forEach((c) => {
        const item = `${transformer(c)}\n`
        appendFileSync(csvFileName, item)
    })
    return csvFileName
}
