import { redirect } from "next/navigation"
import { getCurrentUserId } from "@/lib/auth"
import { AccountsSwitchClient } from "./_components/accounts-switch-client"
import { accounts_getAccounts } from "./_lib/accounts-switch-functions"

export default async function Page() {
  if (!await getCurrentUserId()) redirect("/auth/login")
  const accounts = await accounts_getAccounts()

  return (
    <main className="flex flex-1 flex-col p-4 md:p-8">
      <AccountsSwitchClient accounts={accounts} />
    </main>
  )
}
