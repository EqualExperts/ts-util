import * as os from "os"
import * as fs from "fs"
import { authorize, GSuiteConfig, buildGSuiteClient } from "./client"
import { google } from "googleapis"
import * as path from "path"

export type GetGDriveFilesInFolderAdapter = (targetFolderId: string) => Promise<string[]>
export type BuildGetGDriveFilesInFolderAdapter = (gSuiteConfig: GSuiteConfig) => GetGDriveFilesInFolderAdapter
export type ListGDriveFilesInFolderAdapter = (folderId: string) => Promise<any[]>
export type BuildListGDriveFilesInFolderAdapter = (gSuiteConfig: GSuiteConfig) => ListGDriveFilesInFolderAdapter
export type MoveGDriveFileToFolderAdapter = (fileId: string, targetFolderId: string) => Promise<boolean>
export type BuildMoveGDriveFileToFolderAdapter = (gSuiteConfig: GSuiteConfig) => MoveGDriveFileToFolderAdapter
export type UpdateGDriveFileParentFolderAdapter =
    (fileId: string, currentParentIds: string[], targetFolderId: string) => Promise<boolean>
export type BuildUpdateGDriveFileParentFolderAdapter =
    (gSuiteConfig: GSuiteConfig) => UpdateGDriveFileParentFolderAdapter
export type ReadGDriveFileAsyncHandler = (gdriveClient: any, fileId: string, fileName: string) => Promise<string>
export type GDriveFileMetaInfo = {
    id: string,
    name: string,
    mimeType?: string,
    fileExtension?: string,
    size?: number,
    trashed?: boolean,
    createdTime?: string,
    modifiedTime?: string,
    parents?: string[],
}
export type GDrivePermission = {
    id?: string,
    role: string,
    type: string,
    emailAddress: string,
}
export type GDrivePermissionStatus = {
    fileId: string,
    permissionId: string,
    removed: boolean,
}

export const GDRIVE_SCOPES_READ: string[] = ["https://www.googleapis.com/auth/drive.readonly"]
export const GDRIVE_SCOPES_WRITE: string[] = ["https://www.googleapis.com/auth/drive"]
export const GDRIVE_VERSION = "v3"
export const GDRIVE_FINDFILESINFOLDER_PAGELIMIT = 1000

export const buildGetGDriveFilesInFolderAdapter: BuildGetGDriveFilesInFolderAdapter = (gSuiteConfig: GSuiteConfig) => {
    const gsuiteClient = buildGSuiteClient(gSuiteConfig, GDRIVE_SCOPES_READ)
    return async (targetFolderId) => {
        await authorize(gsuiteClient)
        return getGDriveFilesInFolder(gsuiteClient, targetFolderId)
    }
}

export const buildListGDriveFilesInFolderAdapter: BuildListGDriveFilesInFolderAdapter =
    (gSuiteConfig: GSuiteConfig) => {
        const gsuiteClient = buildGSuiteClient(gSuiteConfig, GDRIVE_SCOPES_READ)
        return async (folderId) => {
            await authorize(gsuiteClient)
            return listGDriveFilesInFolder(gsuiteClient, folderId)
        }
    }

export const buildMoveGDriveFileToFolderAdapter: BuildMoveGDriveFileToFolderAdapter = (gSuiteConfig: GSuiteConfig) => {
    const gsuiteClient = buildGSuiteClient(gSuiteConfig, GDRIVE_SCOPES_WRITE)
    return async (fileId, targetFolderId) => {
        await authorize(gsuiteClient)
        return moveGDriveFileToFolder(gsuiteClient, fileId, targetFolderId)
    }
}

export const buildUpdateGDriveFileParentFolderAdapter: BuildUpdateGDriveFileParentFolderAdapter =
    (gSuiteConfig: GSuiteConfig) => {
        const gsuiteClient = buildGSuiteClient(gSuiteConfig, GDRIVE_SCOPES_WRITE)
        return async (fileId, currentParentIds, targetFolderId) => {
            await authorize(gsuiteClient)
            return updateGDriveFileParentFolder(gsuiteClient, fileId, currentParentIds, targetFolderId)
        }
    }

const getGDriveFilesInFolder = async (gSuiteClient: any, targetFolderId: string) => {
    const gdrive = google.drive({
        version: GDRIVE_VERSION,
        auth: gSuiteClient
    })
    const getMaybeFiles = await new Promise<Array<Promise<string>>>((resolve, reject) => {
        gdrive.files.list(
            {
                pageSize: GDRIVE_FINDFILESINFOLDER_PAGELIMIT,
                q: `parents in '${targetFolderId}' and trashed != true`,
                fields: "files(id, name, trashed)"
            },
            (err: any, response: any) => {
                if (err) {
                    reject(err)
                }
                const files = response.data.files
                if (!files || files.length === 0) {
                    resolve([])
                }
                const maybeFiles: Array<Promise<string>> =
                    files.map((f: GDriveFileMetaInfo) => {
                        return readGDriveFileAsync(gdrive, f.id, f.name)
                    })
                resolve(maybeFiles)
            })
    })
    return Promise.all(getMaybeFiles)
}

const readGDriveFileAsync: ReadGDriveFileAsyncHandler = (gdriveClient, fileId, fileName) => {
    return new Promise<string>((resolve, reject) => {
        const fileGet = gdriveClient.files.get(
            { fileId: `${fileId}`, alt: "media" },
            { responseType: "stream" },
            (fgetError: any, fgetResp: any) => {
                if (fgetError) {
                    reject(fgetError)
                }
                const relativePath = path.join(os.tmpdir(), fileName)
                const dest = fs.createWriteStream(relativePath)
                    .on("finish", () => resolve(path.resolve(relativePath)))
                    .on("error", reject)
                fgetResp.data
                    .on("error", reject)
                    .pipe(dest)
            })
    })
}

const listGDriveFilesInFolder = (gSuiteClient: any, targetFolderId: string) => {
    const gdrive = google.drive({
        version: GDRIVE_VERSION,
        auth: gSuiteClient
    })
    return new Promise<any[]>((resolve, reject) => {
        gdrive.files.list(
            {
                pageSize: GDRIVE_FINDFILESINFOLDER_PAGELIMIT,
                q: `'${targetFolderId}' in parents and trashed != true`,
                fields: "files(id, mimeType, name, fileExtension, size, trashed, createdTime, modifiedTime, parents)"
            },
            (err: any, response: any) => {
                if (err) {
                    reject(err)
                }
                resolve(response.data.files as GDriveFileMetaInfo[])
            })
    })
}

const getGDriveFile = (gSuiteClient: any, fileId: string) => {
    const gdrive = google.drive({
        version: GDRIVE_VERSION,
        auth: gSuiteClient
    })
    return new Promise<any>((resolve, reject) => {
        gdrive.files.get({
            fileId,
            fields: "id, mimeType, name, fileExtension, size, trashed, createdTime, modifiedTime, parents",
        }, (err: any, result: any) => {
            if (err) {
            return reject(err)
            }
            resolve(result.data as GDriveFileMetaInfo)
        })
    })
}

const updateGDriveFileParentFolder =
    (gSuiteClient: any, fileId: string, currentParentIds: string[], targetFolderId: string) => {
        const gdrive = google.drive({
            version: GDRIVE_VERSION,
            auth: gSuiteClient
        })
        return new Promise<boolean>((resolve, reject) => {
            const previousParents = currentParentIds.join(",")
            gdrive.files.update({
                fileId,
                addParents: targetFolderId,
                removeParents: previousParents,
                fields: "id, parents"
            }, (err: any) => {
                if (err) {
                    return reject(err)
                }
                resolve(true)
            })
        })
}

const moveGDriveFileToFolder = async (gSuiteClient: any, fileId: string, targetFolderId: string) => {
    const file = await getGDriveFile(gSuiteClient, fileId)
    return await updateGDriveFileParentFolder(gSuiteClient, fileId, file.parents, targetFolderId)
}

const listGDriveFilePermissions = (gSuiteClient: any, fileId: string) => {
    const gdrive = google.drive({
        version: GDRIVE_VERSION,
        auth: gSuiteClient,
    })
    return new Promise((resolve, reject) => {
        gdrive.permissions.list({
            fileId,
            fields: "*",
        }, (err: any, result: any) => {
            if (err) {
                return reject(err)
            }
            resolve(result.data.permissions as GDrivePermission[])
        })
    })
}

const removeGDriveFilePermissions = (gSuiteClient: any, fileId: string, permissionIds: string[]) => {
    const gdrive = google.drive({
        version: GDRIVE_VERSION,
        auth: gSuiteClient,
    })
    const promises = permissionIds.map((permissionId) =>
        new Promise((resolve, reject) => {
            gdrive.permissions.delete({
                fileId,
                permissionId,
            }, (err: any, result: any) => {
                if (err) {
                    return reject(err)
                }
                resolve({
                    fileId,
                    permissionId,
                    removed: (result.data === "")
                } as GDrivePermissionStatus)
            })
        }))
    return Promise.all(promises)
}

const addGDriveFilePermissions = (gSuiteClient: any, fileId: string, permissions: GDrivePermission[]) => {
    const gdrive = google.drive({
        version: GDRIVE_VERSION,
        auth: gSuiteClient,
    })
    const promises = permissions.map((permission) =>
        new Promise((resolve, reject) => {
            const resource = {
                role: permission.role,
                type: permission.type,
                emailAddress: permission.emailAddress
            }
            gdrive.permissions.create({
                fileId,
                transferOwnership: (resource.role === "owner"),
                resource,
            }, (err: any, result: any) => {
                if (err) {
                    return reject(err)
                }
                resolve(result.data as GDrivePermission)
            })
        }))
    return Promise.all(promises)
}
