import * as os from "os"
import * as fs from "fs"
import { authorize, GSuiteConfig, buildGSuiteClient } from "./client"
import { google } from "googleapis"
import * as path from "path"

export type GetGDriveFilesInFolderAdapter = (targetFolderId: string) => Promise<string[]>
export type BuildGetGDriveFilesInFolderAdapter = (gSuiteClient: any) => GetGDriveFilesInFolderAdapter
export type ReadGDriveFileAsyncHandler = (gdriveClient: any, fileId: string, fileName: string) => Promise<string>

export const buildGetGDriveFilesInFolderAdapter: BuildGetGDriveFilesInFolderAdapter = (gSuiteConfig: GSuiteConfig) => {
    const gsuiteClient = buildGSuiteClient(gSuiteConfig, ["https://www.googleapis.com/auth/drive.readonly"])
    return async (targetFolderId) => {
        await authorize(gsuiteClient)
        return getGDriveFilesInFolder(gsuiteClient, targetFolderId)
    }
}

export const getGDriveFilesInFolder = async (gSuiteClient: any, targetFolderId: string) => {
        const gdrive = google.drive({
            version: "v3",
            auth: gSuiteClient
        })

        const maybeFilesContainer: Promise<Array<Promise<string>>> =
            new Promise<Array<Promise<string>>>((resolve, reject) => {
                gdrive.files.list({ pageSize: 20, q: `parents in '${targetFolderId}'` }, (err: any, response: any) => {
                    if (err) {
                        console.error("GDrive files.list API returned an error: " + err)
                        reject(err)
                    }

                    const files = response.data.files
                    if (!files || files.length === 0) {
                        console.log("No files found in folder")
                        resolve([])
                    }

                    const maybeFiles: Array<Promise<string>> = []
                    for (const file of files) {
                        console.log("Found file", file.id, " | ", file.name)
                        maybeFiles.push(readGDriveFileAsync(gdrive, file.id, file.name))
                    }

                    resolve(maybeFiles)
                })
            })

        const getMaybeFiles = await maybeFilesContainer
        return Promise.all(getMaybeFiles)
    }

export const readGDriveFileAsync: ReadGDriveFileAsyncHandler = (gdriveClient, fileId, fileName) => {
        return new Promise<string>((resolve, reject) => {
            const fileGet = gdriveClient.files.get({
                fileId: `${fileId}`,
                alt: "media"
            }, {
                    responseType: "stream"
                }, (fgetError: any, fgetResp: any) => {
                    if (fgetError) {
                        console.error(fgetError)
                        reject(fgetError)
                    }
                    const relativePath = path.join(os.tmpdir(), fileName)
                    const dest = fs.createWriteStream(relativePath)
                        .on("finish", () => {
                            console.log("Downloaded %s!", fileName)
                            resolve(path.resolve(relativePath))
                        })
                        .on("error", (errWritting) => {
                            console.error("Error writing file!")
                            reject(errWritting)
                        })

                    fgetResp.data
                        .on("error", (streamErr: any) => {
                            console.error("Error downloading file.")
                            reject(streamErr)
                        })
                        .pipe(dest)
                })
        })
    }
