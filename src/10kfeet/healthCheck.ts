import * as fetch from "isomorphic-fetch"
import { ServiceHealthCheckAdapter, OK, FAIL, HealthCheckStatus } from "../healthcheck"

export const build10KFeetHealthCheckAdapter: (baseUrl: string) => ServiceHealthCheckAdapter =
    (baseUrl: string) =>
        () => {
            return (fetch(baseUrl)
                .then(
                (response: Response) => {
                    const tenKStatus = response.status >= 500 ? FAIL : OK
                    return {
                        name: "10KFeet",
                        status: tenKStatus,
                        reason: tenKStatus === OK ? "" : `status code is ${response.status}`,
                    }
                }))
                .catch(
                (err: any) => ({
                    name: "10KFeet",
                    status: FAIL,
                    reason: err.toString(),
                }))
        }
