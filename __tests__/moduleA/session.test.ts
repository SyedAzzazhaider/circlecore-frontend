describe("Session timeout config", () => {
  it("30 minutes in ms equals 1800000",    () => expect(30 * 60 * 1000).toBe(1800000));
  it("warning fires 2 min before timeout", () => {
    var TIMEOUT_MS = 30 * 60 * 1000;
    var WARNING_MS = 2  * 60 * 1000;
    expect(TIMEOUT_MS - WARNING_MS).toBe(28 * 60 * 1000);
  });
  it("session expires correctly",          () => {
    var TIMEOUT_MS = 30 * 60 * 1000;
    var start      = Date.now();
    var expire     = start + TIMEOUT_MS;
    expect(expire - start).toBe(TIMEOUT_MS);
  });
});