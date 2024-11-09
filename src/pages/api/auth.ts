import type { APIRoute } from "astro";
import { authSchema } from "../../actions/schema";
import { db, schema } from "../../server/db";
import { eq } from "drizzle-orm";
import { Argon2id } from "oslo/password";
import { auth } from "../../server/auth";
import { AUTH_RATELIMIT_WINDOW, authRateLimit } from "../../lib/upstash";

export const POST: APIRoute = async ({ request }) => {
  const headers = new Headers();
  const ip = request.headers.get("x-real-ip") ?? "dev";
  const { success, limit, remaining, reset } = await authRateLimit.limit(ip);

  const resetInSeconds = Math.floor(
    (new Date(reset).getTime() - Date.now()) / 1000,
  );

  headers.set("Content-Type", "application/json");
  headers.set("Ratelimit-Limit", limit.toString());
  headers.set("Ratelimit-Remaining", remaining.toString());
  headers.set("Ratelimit-Reset", resetInSeconds.toString());
  headers.set(
    "Ratelimit-Policy",
    `${limit.toString()};w=${AUTH_RATELIMIT_WINDOW.toString()}`,
  );

  if (!success) {
    return Response.json(
      {
        ok: false,
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests try again after some time",
      },
      { status: 429, headers },
    );
  }

  const contentType = request.headers.get("content-type");
  if (!contentType || contentType !== "application/json") {
    return Response.json(
      { ok: false, code: "FORBIDDEN", message: "Forbidden" },
      { status: 403, headers },
    );
  }

  const json = await request.json();

  const result = authSchema.safeParse(json);

  if (!result.success) {
    return Response.json(
      {
        ok: false,
        code: "BAD_REQUEST",
        message: "Missing required fields",
        errors: result.error.flatten().fieldErrors,
      },
      { status: 400, headers },
    );
  }

  const { username, password, action } = result.data;
  const usernameInLowercase = username.toLowerCase();

  if (action === "signup") {
    const [user] = await db
      .select({ id: schema.usersTable.id })
      .from(schema.usersTable)
      .where(eq(schema.usersTable.username, usernameInLowercase));

    if (user) {
      return Response.json(
        {
          ok: false,
          code: "CONFLICT",
          message: "Username already taken",
        },
        { status: 409, headers },
      );
    }

    try {
      const user = await db.transaction(async (tx) => {
        const [u] = await tx
          .insert(schema.usersTable)
          .values({
            username: usernameInLowercase,
          })
          .returning();

        const hashedPassword = await new Argon2id().hash(password);

        await tx.insert(schema.userPasswordsTable).values({
          userId: u.id,
          hashedPassword,
        });

        return u;
      });

      const session = await auth.createSession(user.id);
      const sessionCookie = auth.createSessionCookie(session.id);
      headers.append("Set-Cookie", sessionCookie.serialize());
      return Response.json(
        {
          ok: true,
          code: "OK",
          user: { id: user.id, username: user.username },
        },
        { status: 201, headers },
      );
    } catch (error) {
      return Response.json(
        {
          ok: false,
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        },
        { status: 500, headers },
      );
    }
  }

  try {
    const [user] = await db
      .select({
        id: schema.usersTable.id,
        username: schema.usersTable.username,
        hashedPassword: schema.userPasswordsTable.hashedPassword,
      })
      .from(schema.usersTable)
      .innerJoin(
        schema.userPasswordsTable,
        eq(schema.userPasswordsTable.userId, schema.usersTable.id),
      )
      .where(eq(schema.usersTable.username, usernameInLowercase));

    if (!user) {
      return Response.json(
        {
          ok: false,
          code: "BAD_REQUEST",
          message: "Username or password invalid",
        },
        { status: 400, headers },
      );
    }

    if (!user.hashedPassword) {
      return Response.json(
        {
          ok: false,
          code: "BAD_REQUEST",
          message: "Username or password invalid",
        },
        { status: 400, headers },
      );
    }

    const isPasswordValid = await new Argon2id().verify(
      user.hashedPassword,
      password,
    );

    if (!isPasswordValid) {
      return Response.json(
        {
          ok: false,
          code: "BAD_REQUEST",
          message: "Username or password invalid",
        },
        { status: 400, headers },
      );
    }

    const session = await auth.createSession(user.id);
    const sessionCookie = auth.createSessionCookie(session.id);
    headers.append("Set-Cookie", sessionCookie.serialize());

    return Response.json(
      {
        ok: true,
        code: "OK",
        user: { id: user.id, username: user.username },
      },
      { status: 200, headers },
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
      },
      { status: 500, headers },
    );
  }
};
