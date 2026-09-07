"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

import { type PhoneNumberWithConfig } from "../../_lib/phone-number-config-actions"

export function UserPhoneNumbersList({
    phoneNumbers,
}: {
    phoneNumbers: PhoneNumberWithConfig[]
}) {
    const searchParams = useSearchParams()
    const phoneNumberId = searchParams.get("phoneNumberId")

    const selectedPhoneNumberId =
        phoneNumbers.some((phoneNumber) => phoneNumber.id === phoneNumberId)
            ? phoneNumberId
            : phoneNumbers[0]?.id

    return (
        <div className="flex flex-col gap-1">
            {phoneNumbers.map((phoneNumber) => {
                const label =
                    phoneNumber.config?.nickname?.trim() ||
                    phoneNumber.phoneNumber

                return (
                    <Link
                        key={phoneNumber.id}
                        href={`/dashboard/phone-numbers?phoneNumberId=${encodeURIComponent(
                            phoneNumber.id
                        )}`}
                        className={cn(
                            buttonVariants({
                                variant:
                                    phoneNumber.id === selectedPhoneNumberId
                                        ? "secondary"
                                        : "ghost",
                            }),
                            "h-10 justify-start px-3 text-left"
                        )}
                    >
                        {label}
                    </Link>
                )
            })}

            {!phoneNumbers.length && (
                <div className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
                    No phone numbers yet.
                </div>
            )}
        </div>
    )
}