import type { APIRoute } from "astro";
import { authSchema } from "../../actions/schema";
import { error } from "console";
import { db, schema } from "../../server/db";
import { eq } from "drizzle-orm";
import { Argon2id } from "oslo/password";
import { auth } from "../../server/auth";

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get("content-type");
  if (!contentType || contentType !== "application/json") {
    return Response.json(
      JSON.stringify({ ok: false, code: "FORBIDDEN", message: "Forbidden" }),
      { status: 403 },
    );
  }

  const json = await request.json();

  const result = await authSchema.safeParse(json);

  if (!result.success) {
    return Response.json(
      JSON.stringify({
        ok: false,
        code: "BAD_REQUEST",
        message: "Missing required fields",
        errors: result.error.flatten().fieldErrors,
      }),
      { status: 400 },
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
        JSON.stringify({
          ok: false,
          code: "CONFLICT",
          message: "Username already taken",
        }),
        { status: 409 },
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
      const sessionCookie = await auth.createSessionCookie(session.id);

      return Response.json(
        JSON.stringify({
          ok: true,
          code: "OK",
          user: { id: user.id, username: user.username },
        }),
        {
          status: 201,
          headers: {
            "Set-Cookie": sessionCookie.serialize(),
          },
        },
      );
    } catch (error) {
      return Response.json(
        JSON.stringify({
          ok: false,
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        }),
        { status: 500 },
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
        JSON.stringify({
          ok: false,
          code: "BAD_REQUEST",
          message: "Username or password invalid",
        }),
        { status: 400 },
      );
    }

    if (!user.hashedPassword) {
      return Response.json(
        JSON.stringify({
          ok: false,
          code: "BAD_REQUEST",
          message: "Username or password invalid",
        }),
        { status: 400 },
      );
    }

    const isPasswordValid = await new Argon2id().verify(
      user.hashedPassword,
      password,
    );

    if (!isPasswordValid) {
      return Response.json(
        JSON.stringify({
          ok: false,
          code: "BAD_REQUEST",
          message: "Username or password invalid",
        }),
        { status: 400 },
      );
    }

    const session = await auth.createSession(user.id);
    const sessionCookie = await auth.createSessionCookie(session.id);

    return Response.json(
      JSON.stringify({
        ok: true,
        code: "OK",
        user: { id: user.id, username: user.username },
      }),
      {
        status: 200,
        headers: {
          "Set-Cookie": sessionCookie.serialize(),
        },
      },
    );
  } catch (error) {
    return Response.json(
      JSON.stringify({
        ok: false,
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
      }),
      { status: 500 },
    );
  }
};
