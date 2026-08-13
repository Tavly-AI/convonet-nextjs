import { GoogleOAuth } from "@/app/auth/_components/GoogleOAuth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { CommandIcon } from "lucide-react"

export default function SignupPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-sky-50 px-4 py-10 dark:bg-background">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2">
          <CommandIcon className="size-5" />
          <span className="text-base font-semibold">Tavly AI</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>
              <h1>Create your account</h1>
            </CardTitle>
            <CardDescription>
              Start building your AI workspace in minutes.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  autoComplete="new-password"
                />
              </div>

              <Button type="button" size="lg" className="w-full">
                Create account
              </Button>

              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  Or continue with
                </span>
                <Separator className="flex-1" />
              </div>

              <GoogleOAuth />
            </form>
          </CardContent>

          <CardFooter className="justify-center text-xs text-muted-foreground">
            Already have an account?
            <Button
              variant="link"
              size="sm"
              className="h-auto px-1 text-xs"
              render={<a href="/auth/login" />}
            >
              Sign in
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
