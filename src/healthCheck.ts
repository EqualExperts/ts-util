
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
