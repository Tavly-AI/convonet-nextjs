import { getCurrentWorkspaceId } from "@/app/agents/_lib/helper-actions"
import { saveByobDetails } from "@/app/dashboard/phone-numbers/_lib/setup-byob-modal"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { prisma } from "@/lib/prisma"

type SetupByobModalProps = {
  phoneNumber?: string
}

type TransportType = "tcp" | "udp" | "tls"

export async function SetupByobModal({ phoneNumber }: SetupByobModalProps) {
  const workspaceId = await getCurrentWorkspaceId()

  const existingPhoneNumber = phoneNumber
    ? await prisma.phoneNumber.findFirst({
      where: {
        workspaceId,
        phoneNumber,
      },
      include: {
        config: true,
        sipTrunkConnection: true,
      },
    })
    : null

  async function submitByobDetails(formData: FormData) {
    "use server"

    await saveByobDetails({
      existingPhoneNumber: existingPhoneNumber?.phoneNumber,
      phoneNumber: readString(formData.get("phoneNumber")),
      terminationUri: readString(formData.get("terminationUri")),
      authUsername: readOptionalString(formData.get("authUsername")),
      authPassword: readOptionalString(formData.get("authPassword")),
      transport: normalizeTransport(readString(formData.get("transport"))),
    })
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" className="rounded-t-none" />}>
        Setup BYOB
      </DialogTrigger>

      <DialogContent className="max-w-xl p-0">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Connect to your number via SIP trunking</DialogTitle>
          <DialogDescription className="sr-only">
            Configure a custom phone number with SIP trunk credentials.
          </DialogDescription>
        </DialogHeader>

        <form action={submitByobDetails}>
          <div className="space-y-5 px-5 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="byob-phone-number">Phone Number</Label>
                <span className="text-sm text-muted-foreground">Format to E.164</span>
              </div>
              <Input
                id="byob-phone-number"
                name="phoneNumber"
                defaultValue={existingPhoneNumber?.phoneNumber ?? phoneNumber}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="byob-termination-uri">Termination URI</Label>
              <Input
                id="byob-termination-uri"
                name="terminationUri"
                defaultValue={existingPhoneNumber?.sipTrunkConnection?.terminationUri ?? ""}
                placeholder="Enter termination URI (NOT Retell SIP server uri)"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="byob-username">SIP Trunk User Name (encouraged)</Label>
              <Input
                id="byob-username"
                name="authUsername"
                defaultValue={existingPhoneNumber?.sipTrunkConnection?.authUsername ?? ""}
                placeholder="Enter SIP Trunk User Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="byob-password">SIP Trunk Password (encouraged)</Label>
              <Input
                id="byob-password"
                name="authPassword"
                type="password"
                defaultValue={existingPhoneNumber?.sipTrunkConnection?.authPassword ?? ""}
                placeholder="Enter SIP Trunk Password"
              />
            </div>

          </div>

          <DialogFooter className="items-center justify-between border-t px-5 py-4 sm:justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="byob-transport" className="text-muted-foreground">
                Outbound Transport:
              </Label>
              <select
                id="byob-transport"
                name="transport"
                defaultValue={normalizeTransport(
                  existingPhoneNumber?.sipTrunkConnection?.transport
                )}
                className="flex h-8 min-w-32 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
                <option value="tls">TLS</option>
              </select>
            </div>

            <div className="flex gap-2">
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit">Save</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function readString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

function readOptionalString(value: FormDataEntryValue | null) {
  const parsed = readString(value)
  return parsed || null
}

function normalizeTransport(value?: string | null): TransportType {
  return value === "udp" || value === "tls" ? value : "tcp"
}
