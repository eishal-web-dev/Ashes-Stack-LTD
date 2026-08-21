import jwt from "jsonwebtoken";
import cookie from "cookie";

const ROOT_SECRET = process.env.WORKOS_JWT_SECRET || `${process.env.JWT_SECRET || "dev-secret-change-me"}:ashes-work-os`;
const COOKIE_NAME = "ashes_brain_token";
const ISSUER = "ashes-work-os";

export function signWorkOSSession(payload) {
  return jwt.sign({ ...payload, typ: "workos_user" }, ROOT_SECRET, { issuer: ISSUER, expiresIn: "30d" });
}

export function verifyWorkOSSession(token) {
  try {
    const payload = jwt.verify(String(token || ""), ROOT_SECRET, { issuer: ISSUER });
    return payload?.typ === "workos_user" ? payload : null;
  } catch {
    return null;
  }
}

export function setWorkOSCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
  );
}

export function clearWorkOSCookie(res) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: -1,
    })
  );
}

export function getWorkOSUserFromReq(req) {
  const cookies = cookie.parse(req.headers.cookie || "");
  return verifyWorkOSSession(cookies[COOKIE_NAME]);
}
