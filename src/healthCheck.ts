import * as fetch from "isomorphic-fetch"

export type ServiceHealthCheckAdapter = () => Promise<ServiceHealthCheck>

export enum HealthCheckStatus {
    OK = "OK",
    FAIL = "FAIL",
}
export const FAIL = HealthCheckStatus.FAIL
export const OK = HealthCheckStatus.OK

export type ServiceHealthCheck = {
    name: string,
    status: HealthCheckStatus,
    reason?: string,
}

export const buildWebServiceHealthCheckAdapter: (baseUrl: string, serviceName: string) => ServiceHealthCheckAdapter =
    (baseUrl: string, serviceName: string) =>
        () => webServiceHealthCheckAdapter(baseUrl, serviceName)

export const webServiceHealthCheckAdapter: (baseUrl: string, serviceName: string) => Promise<ServiceHealthCheck> =
    (baseUrl: string, serviceName: string) => {
        return (fetch(baseUrl)
            .then(
            (response: Response) => {
                const tenKStatus = response.status >= 500 ? FAIL : OK
                return {
                    name: serviceName,
                    status: tenKStatus,
                    reason: tenKStatus === OK ? "" : `status code is ${response.status}`,
                }
            }))
            .catch(
            (err: any) => ({
                name: serviceName,
                status: FAIL,
                reason: err.toString(),
            }))
    }
