"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DiscordLogoIcon, StitchesLogoIcon } from "@/components/icons";
import { APP_TITLE } from "@/lib/constants";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

export function Login() {

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>{APP_TITLE} Log In</CardTitle>
        <CardDescription>Log in to your account to access your dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="my-2 items-center flex-col space-y-2">
        <Button variant="outline" className="w-full" asChild>
          <Link href="/login/discord" prefetch={false}>
            <DiscordLogoIcon className="mr-2 h-5 w-5" />
            Log in with Discord
          </Link>
        </Button>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/login/entraId" prefetch={false}>
            <StitchesLogoIcon className="mr-2 h-5 w-5" />
            Log in with Azure
          </Link>
        </Button>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/login/github" prefetch={false}>
            <GitHubLogoIcon className="mr-2 h-5 w-5" />
            Log in with GitHub
          </Link>
        </Button>
        </div>
      </CardContent>
    </Card>
  );
}
