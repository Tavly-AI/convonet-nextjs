import { WebsiteCustomLoader } from "@/components/custom/website-custom-loader"

export default function Loading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <WebsiteCustomLoader
        title="Loading page"
        detail="Preparing page..."
      />
    </main>
  )
}
