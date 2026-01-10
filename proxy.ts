import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

// API routes - let them handle their own auth (they return JSON errors)
const isApiRoute = createRouteMatcher(['/api(.*)']);

export default clerkMiddleware(async (auth, request) => {
  // API routes: Don't protect here - let each route handle auth and return JSON
  if (isApiRoute(request)) {
    return; // Allow API routes through, they'll check auth themselves
  }
  
  // Protect all other routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
