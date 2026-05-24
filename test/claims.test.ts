import { describe, expect, it } from "vitest";
import { parseClaimsJsonl } from "../src/core/claims.js";

describe("parseClaimsJsonl", () => {
  it("keeps valid claims and warns on invalid lines", () => {
    const result = parseClaimsJsonl(
      [
        '{"id":"claim-1","type":"route","claim":"GET /users is handled by src/api/users.ts","topics":["users"],"keywords":["get users"],"paths":["src/api/users.ts"],"evidence":[{"path":"src/api/users.ts","lines":[1,10]}],"confidence":0.8,"source":"manual","updatedAt":"2026-05-23T00:00:00.000Z"}',
        "{not-json",
        '{"id":"bad","type":"route","claim":"Bad","topics":[],"keywords":[],"paths":[],"evidence":[],"confidence":2,"source":"manual","updatedAt":"2026-05-23T00:00:00.000Z"}'
      ].join("\n")
    );

    expect(result.value).toHaveLength(1);
    expect(result.value[0]?.id).toBe("claim-1");
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0]?.line).toBe(2);
  });
});
