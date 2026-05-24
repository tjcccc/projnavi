import { describe, expect, it } from "vitest";
import { getUsers } from "./users";

describe("getUsers", () => {
  it("lists users", async () => {
    await expect(getUsers()).resolves.toHaveLength(2);
  });
});
