import "jest"
import {
    HealthCheckStatus,
    ServiceHealthCheck,
    OK,
    FAIL,
} from "../src/healthCheck"
import { buildWebServiceHealthCheckAdapter } from "../src/healthCheck"

describe("Healthcheck Adapter", () => {
    it("returns healthcheck status as ok when service is in good health", async () => {
        // given
        const baseUrl = "https://httpstat.us/200"
        const underTest: () => Promise<ServiceHealthCheck> = buildWebServiceHealthCheckAdapter(baseUrl, "some-service")

        // when
        const serviceHealthCheck: ServiceHealthCheck = await underTest()

        // then
        const expectedServiceHealthCheck = {
            name: "some-service",
            status: OK,
            reason: "",
        }
        expect(serviceHealthCheck).toEqual(expectedServiceHealthCheck)
    })

    it("returns healthcheck status as fail when service is not responding", async () => {
        // given
        const fakeBaseUrl = "http://x:0"
        const underTest = buildWebServiceHealthCheckAdapter(fakeBaseUrl, "some-service")

        // when
        const serviceHealthCheck: ServiceHealthCheck = await underTest()

        // then
        const expectedServiceHealthCheck = {
            name: "some-service",
            status: FAIL,
            reason: "FetchError: request to http://x:0 failed, reason: getaddrinfo ENOTFOUND x x:0",
        }
        expect(serviceHealthCheck).toEqual(expectedServiceHealthCheck)
    })

    it("returns healthcheck status as fail when service is not in good health", async () => {
        // given
        const baseUrl = "https://httpstat.us/500"
        const underTest = buildWebServiceHealthCheckAdapter(baseUrl, "some-service")

        // when
        const serviceHealthCheck: ServiceHealthCheck = await underTest()

        // then
        const expectedServiceHealthCheck = {
            name: "some-service",
            status: FAIL,
            reason: "status code is 500",
        }
        expect(serviceHealthCheck).toEqual(expectedServiceHealthCheck)
    })
})
