import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  isAuthenticatedNextjs,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isPublicRoute = createRouteMatcher(["/login", "/register"]);

export default convexAuthNextjsMiddleware(async (request) => {
  const isAuthed = await isAuthenticatedNextjs();
  const { pathname } = request.nextUrl;

  // Root and setup pages handle their own redirect logic
  if (pathname === "/" || pathname === "/setup") return;

  // Public routes — redirect to home if already authed
  if (isPublicRoute(request)) {
    if (isAuthed) return nextjsMiddlewareRedirect(request, "/");
    return;
  }

  // Protected routes
  if (!isAuthed) {
    return nextjsMiddlewareRedirect(request, "/login");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};