import { GoogleOAuth } from "@/app/auth/_components/GoogleOAuth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { COMPANY_LOGO, COMPANY_NAME } from "@/lib/constants"

export default function SignupPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-sky-50 px-4 py-10 dark:bg-background">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Card>
          <CardHeader className="gap-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <span
                className="[&_svg]:size-8"
                dangerouslySetInnerHTML={{ __html: COMPANY_LOGO }}
              />
              <span className="text-base font-semibold">{COMPANY_NAME}</span>
            </div>
            <CardTitle>
              <h1 className="text-xl">Create Your Account</h1>
            </CardTitle>
            <CardDescription>
              Sign up to {COMPANY_NAME} to continue to your workspace.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="work@email.com"
                  autoComplete="email"
                />
              </div>

              <Button type="button" size="lg" className="w-full">
                Continue
              </Button>

              <div className="flex items-center justify-center text-xs text-muted-foreground">
                Already have an account?
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto px-1 text-xs"
                  render={<a href="/auth/login" />}
                >
                  Log in
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">OR</span>
                <Separator className="flex-1" />
              </div>

              <GoogleOAuth />

              <div className="flex flex-wrap items-center justify-center text-xs text-muted-foreground">
                By signing up, you agree to our
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto px-1 text-xs"
                  render={<a href="#" />}
                >
                  Terms of Service
                </Button>
                and
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto px-1 text-xs"
                  render={<a href="#" />}
                >
                  Privacy Policy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
