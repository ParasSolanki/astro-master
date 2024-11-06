import crypto from "node:crypto";
import { eq, lte } from "drizzle-orm";
import { Cookie } from "oslo/cookie";
import { sha256 } from "@oslojs/crypto/sha2";
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from "@oslojs/encoding";
import { db, schema } from "./db";
import { env } from "../env";

const SESSION_TOKEN_LENGTH = 26 as const;
const SESSION_COOKIE_NAME = "astro-master-session" as const;
const SESSION_EXPIRES_IN = 1000 * 60 * 60 * 24 * 3; // 3 days
const SESSION_REFRSH_IN = SESSION_EXPIRES_IN / 2; // half time of expires in

export type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
};

export type User = {
  id: string;
  username: string;
};

type SessionValidationResult =
  | { session: Session & { fresh?: boolean }; user: user }
  | { session: null; user: null };

/**
 * Generates a random session token.
 * @returns {string} A base32 encoded session token.
 */
function generateSessionToken(): string {
  const bytes = new Uint8Array(SESSION_TOKEN_LENGTH);
  crypto.getRandomValues(bytes);

  return encodeBase32LowerCaseNoPadding(bytes);
}

export const auth = {
  /**
   * Gets the session cookie name.
   * @returns {string} The session cookie name.
   */
  get sessionCookieName(): string {
    return SESSION_COOKIE_NAME;
  },

  /**
   * Creates a new session for a user.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Session>} A promise that resolves to the created session.
   */
  createSession: async (userId: string): Promise<Session> => {
    const sessionToken = generateSessionToken();
    const sessionId = encodeHexLowerCase(
      sha256(new TextEncoder().encode(sessionToken)),
    );

    const [session] = await db
      .insert(schema.userSessionsTable)
      .values({
        id: sessionId,
        userId,
        expiresAt: new Date(Date.now() + SESSION_EXPIRES_IN),
      })
      .returning();

    return session;
  },

  /**
   * Validates a session and returns the associated user information.
   * @param {string} sessionId - The ID of the session to validate.
   * @returns {Promise<SessionValidationResult>} A promise that resolves to the validation result.
   */
  validateSession: async (
    sessionId: string,
  ): Promise<SessionValidationResult> => {
    const result = await db
      .select({
        session: {
          id: schema.userSessionsTable.id,
          userId: schema.userSessionsTable.userId,
          expiresAt: schema.userSessionsTable.expiresAt,
        },
        user: {
          id: schema.usersTable.id,
          username: schema.usersTable.username,
        },
      })
      .from(schema.userSessionsTable)
      .innerJoin(
        schema.usersTable,
        eq(schema.usersTable.id, schema.userSessionsTable.userId),
      )
      .where(eq(schema.userSessionsTable.id, sessionId));

    if (result.length < 1) {
      return { session: null, user: null };
    }

    const { user, session } = result[0];

    if (!session || !user) return { session: null, user: null };

    // if session is expired
    if (Date.now() >= session.expiresAt.getTime()) {
      await auth.invalidateSession(session.id);
      return { session: null, user: null };
    }

    // if session is half expired then update the session expiration time
    // to consider as new and update expiresAt time in db
    if (Date.now() >= session.expiresAt.getTime() - SESSION_REFRSH_IN) {
      const newExpiresAt = new Date(Date.now() + SESSION_EXPIRES_IN);
      await db
        .update(schema.userSessionsTable)
        .set({
          expiresAt: newExpiresAt,
        })
        .where(eq(schema.userSessionsTable.id, session.id));

      Object.assign(session, { fresh: true, expiresAt: newExpiresAt });
    }

    return { session, user };
  },

  /**
   * Invalidates a session by deleting it from the database.
   * @param {string} sessionId - The ID of the session to invalidate.
   * @returns {Promise<void>} A promise that resolves when the session is invalidated.
   */
  invalidateSession: async (sessionId: string): Promise<void> => {
    await db
      .delete(schema.userSessionsTable)
      .where(eq(schema.userSessionsTable.id, sessionId));
  },

  /**
   * Invalidates all sessions for a specific user.
   * @param {string} userId - The ID of the user whose sessions should be invalidated.
   * @returns {Promise<void>} A promise that resolves when all sessions are invalidated.
   */
  invalidateUserSessions: async (userId: string): Promise<void> => {
    await db
      .delete(schema.userSessionsTable)
      .where(eq(schema.userSessionsTable.userId, userId));
  },

  /**
   * Deletes all expired sessions from the database.
   * @returns {Promise<void>} A promise that resolves when all expired sessions are deleted.
   */
  deleteExpiredSessions: async (): Promise<void> => {
    await db
      .delete(schema.userSessionsTable)
      .where(lte(schema.userSessionsTable.expiresAt, new Date()));
  },

  /**
   * Creates a session cookie.
   * @param {string} sessionId - The ID of the session to be stored in the cookie.
   * @returns {Cookie} The created session cookie.
   */
  createSessionCookie: (sessionId: string): Cookie => {
    return new Cookie(SESSION_COOKIE_NAME, sessionId, {
      expires: new Date(),
      maxAge: SESSION_EXPIRES_IN,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: env.PROD,
    });
  },

  /**
   * Creates a blank session cookie, typically used for logging out.
   * @returns {Cookie} The created blank session cookie.
   */
  createBlankSessionCookie: (): Cookie => {
    return new Cookie(SESSION_COOKIE_NAME, "", {
      expires: new Date(),
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: env.PROD,
    });
  },
};
