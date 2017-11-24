import "jest"
import {
    HealthCheckStatus,
    ServiceHealthCheck,
    OK,
    FAIL,
} from "../../src/healthCheck"
import { build10KFeetHealthCheckAdapter } from "../../src/10kfeet/healthCheck"

describe("10KFeet Adapter", () => {
    it("returns healthcheck status as ok when 10kFeet service is in good health", async () => {
        // given
        const baseUrl = "https://api.10000ft.com"
        const underTest: () => Promise<ServiceHealthCheck> = build10KFeetHealthCheckAdapter(baseUrl)

        // when
        const serviceHealthCheck: ServiceHealthCheck = await underTest()

        // then
        const expectedServiceHealthCheck = {
            name: "10KFeet",
            status: OK,
            reason: "",
        }
        expect(serviceHealthCheck).toEqual(expectedServiceHealthCheck)
    })

    it("returns healthcheck status as fail when 10kFeet service is not responding", async () => {
        // given
        const fakeBaseUrl = "http://x:0"
        const underTest: () => Promise<ServiceHealthCheck> = build10KFeetHealthCheckAdapter(fakeBaseUrl)

        // when
        const serviceHealthCheck: ServiceHealthCheck = await underTest()

        // then
        const expectedServiceHealthCheck = {
            name: "10KFeet",
            status: FAIL,
            reason: "FetchError: request to http://x:0 failed, reason: getaddrinfo ENOTFOUND x x:0",
        }
        expect(serviceHealthCheck).toEqual(expectedServiceHealthCheck)
    })

    it("returns healthcheck status as fail when 10kFeet service is not in good health", async () => {
        // given
        const baseUrl = "https://httpstat.us/500"
        const underTest: () => Promise<ServiceHealthCheck> = build10KFeetHealthCheckAdapter(baseUrl)

        // when
        const serviceHealthCheck: ServiceHealthCheck = await underTest()

        // then
        const expectedServiceHealthCheck = {
            name: "10KFeet",
            status: FAIL,
            reason: "status code is 500",
        }
        expect(serviceHealthCheck).toEqual(expectedServiceHealthCheck)
    })

})
