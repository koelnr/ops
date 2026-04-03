import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Returns a 401 NextResponse if the request is not authenticated, null otherwise.
 * Use at the top of route handlers that require sign-in.
 */
export async function requireSignedIn(): Promise<NextResponse | null> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * Returns a 401/403 NextResponse if the user is not an admin, null otherwise.
 * Admin is determined by publicMetadata.role === "admin" on the Clerk user.
 * Use at the top of route handlers that require admin access.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
