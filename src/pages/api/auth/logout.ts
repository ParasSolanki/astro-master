import type { APIContext, APIRoute } from "astro";
import { parseCookies } from "oslo/cookie";
import { auth } from "../../../server/auth";

export const POST: APIRoute = async (context: APIContext) => {
  if (!context.locals.session) {
    return new Response(null, { status: 401 });
  }

  const cookies = context.request.headers.get("cookie");

  if (!cookies) {
    return new Response(null, { status: 401 });
  }

  const parsedCookies = parseCookies(cookies);

  if (!parsedCookies.has(auth.sessionCookieName)) {
    return new Response(null, { status: 401 });
  }

  await auth.invalidateSession(context.locals.session.id);

  const sessionCookie = auth.createBlankSessionCookie();
  context.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  return context.redirect("/", 302);
};
