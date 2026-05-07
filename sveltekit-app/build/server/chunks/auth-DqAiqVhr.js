const COOKIE_NAME = "sas-auth";
const SECRET = () => process.env.DASHBOARD_SECRET ?? "";
function verifyPassword(input) {
  const secret = SECRET();
  if (!secret) return false;
  return input === secret;
}
function cookieOptions(secure) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/"
  };
}

export { COOKIE_NAME as C, cookieOptions as c, verifyPassword as v };
//# sourceMappingURL=auth-DqAiqVhr.js.map
