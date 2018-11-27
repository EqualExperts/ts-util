import * as os from "os"
import * as fs from "fs"
import { authorize, GSuiteConfig, buildGSuiteClient } from "./client"
import { google } from "googleapis"
import * as path from "path"

export type GetGDriveFilesInFolderAdapter = (targetFolderId: string) => Promise<string[]>
export type BuildGetGDriveFilesInFolderAdapter = (gSuiteConfig: GSuiteConfig) => GetGDriveFilesInFolderAdapter

export type ListGDriveFilesInFoldersAdapter = (folderIds: string[]) => Promise<GDriveFileMetaInfoDto[]>
export type BuildListGDriveFilesInFoldersAdapter = (gSuiteConfig: GSuiteConfig) => ListGDriveFilesInFoldersAdapter

export type MoveGDriveFileToFolderAdapter = (fileId: string, targetFolderId: string) => Promise<boolean>
export type BuildMoveGDriveFileToFolderAdapter = (gSuiteConfig: GSuiteConfig) => MoveGDriveFileToFolderAdapter

export type UpdateGDriveFileParentFolderAdapter =
    (fileId: string, currentParentIds: string[], targetFolderId: string) => Promise<boolean>
export type BuildUpdateGDriveFileParentFolderAdapter =
    (gSuiteConfig: GSuiteConfig) => UpdateGDriveFileParentFolderAdapter

export type ReadGDriveFileAsyncHandler = (gdriveClient: any, fileId: string, fileName: string) => Promise<string>

export type ListGDriveFilePermissionsAdapter = (fileId: string) => Promise<GDrivePermissionDto[]>
export type BuildListGDriveFilePermissionsAdapter = (gSuiteConfig: GSuiteConfig) => ListGDriveFilePermissionsAdapter

export type RemoveGDriveFilePermissionsAdapter =
    (fileId: string, permissionIds: string[], impersonationEmail?: string) => Promise<GDrivePermissionStatusDto[]>
export type BuildRemoveGDriveFilePermissionsAdapter = (gSuiteConfig: GSuiteConfig) => RemoveGDriveFilePermissionsAdapter

export type AddGDriveFilePermissionsAdapter =
    (fileId: string, permissions: GDrivePermissionDto[], impersonationEmail?: string) => Promise<GDrivePermissionDto[]>
export type BuildAddGDriveFilePermissionsAdapter = (gSuiteConfig: GSuiteConfig) => AddGDriveFilePermissionsAdapter

export type GDriveFileMetaInfoDto = {
    id: string,
    name: string,
    mimeType?: string,
    fileExtension?: string,
    size?: number,
    trashed?: boolean,
    createdTime?: string,
    modifiedTime?: string,
    parents?: string[],
    owners?: GDriveFileOwnerDto[]
}

export type GDriveFileOwnerDto = {
    permissionId: string,
    emailAddress: string,
    displayName?: string,
    photoLink?: string,
    me?: boolean,
}

export type GDrivePermissionDto = {
    id?: string,
    role: string,
    type: string,
    emailAddress: string,
}

export type GDrivePermissionStatusDto = {
    fileId: string,
    permissionId: string,
    removed: boolean,
}

export const GDRIVE_SCOPES_READ: string[] = ["https://www.googleapis.com/auth/drive.readonly"]
export const GDRIVE_SCOPES_WRITE: string[] = ["https://www.googleapis.com/auth/drive"]
export const GDRIVE_VERSION = "v3"
export const GDRIVE_FINDFILESINFOLDER_PAGELIMIT = 1000
export const GDRIVE_LIST_ORDERBY = "createdTime desc"
export const GDRIVE_FILE_FIELDS =
    "id, mimeType, name, fileExtension, size, trashed, createdTime, modifiedTime, parents, owners"

export const buildGetGDriveFilesInFolderAdapter: BuildGetGDriveFilesInFolderAdapter = (gSuiteConfig: GSuiteConfig) => {
    const gsuiteClient = buildGSuiteClient(gSuiteConfig, GDRIVE_SCOPES_READ)
    return async (targetFolderId) => {
        await authorize(gsuiteClient)
        return getGDriveFilesInFolder(gsuiteClient, targetFolderId)
    }
}

export const buildListGDriveFilesInFoldersAdapter: BuildListGDriveFilesInFoldersAdapter =
    (gSuiteConfig: GSuiteConfig) => {
        const gsuiteClient = buildGSuiteClient(gSuiteConfig, GDRIVE_SCOPES_READ)
        return async (folderIds) => {
            await authorize(gsuiteClient)
            return listGDriveFilesInFolders(gsuiteClient, folderIds)
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

export const buildListGDriveFilePermissionsAdapter: BuildListGDriveFilePermissionsAdapter =
    (gSuiteConfig: GSuiteConfig) => {
        const gsuiteClient = buildGSuiteClient(gSuiteConfig, GDRIVE_SCOPES_READ)
        return async (fileId) => {
            await authorize(gsuiteClient)
            return listGDriveFilePermissions(gsuiteClient, fileId)
        }
    }

export const buildRemoveGDriveFilePermissionsAdapter: BuildRemoveGDriveFilePermissionsAdapter =
    (gSuiteConfig: GSuiteConfig) => {
        return async (fileId, permissionIds, impersonationEmail) => {
            const gsuiteClient = buildGSuiteClient(gSuiteConfig, GDRIVE_SCOPES_WRITE, impersonationEmail)
            await authorize(gsuiteClient)
            return removeGDriveFilePermissions(gsuiteClient, fileId, permissionIds)
        }
    }

export const buildAddGDriveFilePermissionsAdapter: BuildAddGDriveFilePermissionsAdapter =
    (gSuiteConfig: GSuiteConfig) => {
        return async (fileId, permissions, impersonationEmail) => {
            const gsuiteClient = buildGSuiteClient(gSuiteConfig, GDRIVE_SCOPES_WRITE, impersonationEmail)
            await authorize(gsuiteClient)
            return addGDriveFilePermissions(gsuiteClient, fileId, permissions)
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
                    reject("GSuite Get Files and Folders Error - " + err)
                }
                const files = response.data.files
                if (!files || files.length === 0) {
                    resolve([])
                }
                const maybeFiles: Array<Promise<string>> =
                    files.map((f: GDriveFileMetaInfoDto) => {
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
                    reject("GSuite Read File Error -" + fgetError)
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

const listGDriveFilesInFolders = (gSuiteClient: any, folderIds: string[]) => {
    const gdrive = google.drive({
        version: GDRIVE_VERSION,
        auth: gSuiteClient
    })
    const parentsQuery = folderIds.map((folderId) => `'${folderId}' in parents`).join(" or ")
    const query = `(${parentsQuery}) and trashed != true`
    return new Promise<GDriveFileMetaInfoDto[]>((resolve, reject) => {
        gdrive.files.list(
            {
                pageSize: GDRIVE_FINDFILESINFOLDER_PAGELIMIT,
                q: query,
                fields: "files(" + GDRIVE_FILE_FIELDS + ")",
                orderBy: GDRIVE_LIST_ORDERBY
            },
            (err: any, response: any) => {
                if (err) {
                    reject("GSuite List Files Error -" + err)
                }
                resolve(response.data.files as GDriveFileMetaInfoDto[])
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
            fields: GDRIVE_FILE_FIELDS,
        }, (err: any, result: any) => {
            if (err) {
                return reject("GSuite Get GDrive Files Error -" + err)
            }
            resolve(result.data as GDriveFileMetaInfoDto)
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
                    return reject("GSuite move folder Error  -" + err)
                }
                resolve(true)
            })
        })
    }

const listGDriveFilePermissions =
    (gSuiteClient: any, fileId: string) => {
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
                    return reject("GSuite List GDrive File Permission -" + err)
                }
                resolve(result.data.permissions as GDrivePermissionDto[])
            })
        }) as Promise<GDrivePermissionDto[]>
    }

const removeGDriveFilePermissions =
    (gSuiteClient: any, fileId: string, permissionIds: string[]) => {
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
                        return reject("GSuite Remove GDrive File Permission -" + err)
                    }
                    resolve({
                        fileId,
                        permissionId,
                        removed: (result.data === "")
                    } as GDrivePermissionStatusDto)
                })
            }) as Promise<GDrivePermissionStatusDto>)
        return Promise.all(promises)
    }

const addGDriveFilePermissions =
    (gSuiteClient: any, fileId: string, permissions: GDrivePermissionDto[]) => {
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
                        return reject("GSuite Add GDrive File Permission -" + err)
                    }
                    resolve(result.data as GDrivePermissionDto)
                })
            }) as Promise<GDrivePermissionDto>)
        return Promise.all(promises)
    }
