import { postRouter } from "./routers/post/post.procedure";
import { stripeRouter } from "./routers/stripe/stripe.procedure";
import { userRouter } from "./routers/user/user.procedure";
import { apiKeyRouter } from "./routers/api-keys/apiKey.procedure";
import { createTRPCRouter } from "./trpc";
import { activityRouter } from "./routers/activity/activity.procedure";
import { calendarEventRouter } from "./routers/calendar/calendar.procedure";
import { aiSuggestedEventsRouter } from "./routers/ai-suggestions/aiSuggestions.procedure";
import { projectRouter } from "./routers/project/project.procedure";
import { userSettingsRouter } from "./routers/user-settings/user-settings.procedure";
import { wakatimeDataRouter } from "./routers/wakatime/wakatime.procedure";
import { integrationTokensRouter } from "./routers/integration-tokens/integration-tokens.procedure";
import { outlookCalendarRouter } from "./routers/integrations/integrations.procedure";
import { githubRouter } from "./routers/github/github.procedure";

export const appRouter = createTRPCRouter({
  user: userRouter,
  post: postRouter,
  stripe: stripeRouter,
  apiKey: apiKeyRouter,
  activity: activityRouter,
  calendar: calendarEventRouter,
  aiSuggestions: aiSuggestedEventsRouter,
  integrationTokens: integrationTokensRouter,
  project: projectRouter,
  userSettings: userSettingsRouter,
  wakatime: wakatimeDataRouter,
  outlookCalendar: outlookCalendarRouter,
  github: githubRouter,
});

export type AppRouter = typeof appRouter;
