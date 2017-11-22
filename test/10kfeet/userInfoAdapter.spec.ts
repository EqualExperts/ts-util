import "jest"
import { buildGetUserInfoAdapter } from "../../src/10kfeet/userInfoAdapter"

describe("10kft User Info Adapter", () => {
    xit("should return user information for a given user", () => {
        // given
        const baseUrl = "https://api.10000ft.com"
        /*tslint:disable*/
        const token = ""
        /*tslint:enable*/
        const userId = 123

        const getUserInfoAdapter = buildGetUserInfoAdapter(baseUrl, token)
        // when
        const result = getUserInfoAdapter(userId)
        // then
        const expectedUserInfo = {
            firstName: "Jonh",
            lastName: "Doe",
            email: "jonh@doe.com",
        }
        expect(result).toEqual(expectedUserInfo)
    })
})
