//optimize file
"use client"

import { useEffect, useState } from "react"
import { ChevronDownIcon, LoaderCircleIcon, SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  getCloudflareCrawlResults,
  getCompletedCrawlRecords,
  getMarkdownFileName,
  getOrigin,
  startCloudflareCrawl,
  type CompletedCrawlRecord,
} from "../_lib/cloudflare-functions"

type CrawlState =
  | { status: "idle" }
  | { status: "starting" }
  | { status: "polling"; jobId: string }
  | { status: "ready"; records: CompletedCrawlRecord[] }
  | { status: "error"; message: string }

export function HandleWebPages({
  open,
  onOpenChange,
  onAddFiles,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddFiles: (files: File[]) => void
}) {
  const [url, setUrl] = useState("")
  const [search, setSearch] = useState("")
  const [selectedPages, setSelectedPages] = useState<string[]>([])
  const [crawl, setCrawl] = useState<CrawlState>({ status: "idle" })

  const origin = getOrigin(url)
  const crawlRecords = crawl.status === "ready" ? crawl.records : []
  const pages = Array.from(new Set(crawlRecords.map((record) => record.url)))
  const isBusy = crawl.status === "starting" || crawl.status === "polling"
  const crawlError = crawl.status === "error" ? crawl.message : null
  const isSelectingPages = crawl.status === "ready"
  const matchingPages = pages.filter((page) => page.toLowerCase().includes(search.trim().toLowerCase()))
  const allVisibleSelected = matchingPages.length > 0 && matchingPages.every((page) => selectedPages.includes(page))

  useEffect(() => {
    if (crawl.status !== "polling") return

    const { jobId } = crawl
    let cancelled = false
    let timeout: ReturnType<typeof setTimeout> | undefined

    async function pollCrawl() {
      try {
        const result = await getCloudflareCrawlResults(jobId)
        if (cancelled) return

        if (result.status === "completed") {
          const completedRecords = getCompletedCrawlRecords(result.records)

          setCrawl({ status: "ready", records: completedRecords })
          setSelectedPages(Array.from(new Set(completedRecords.map((record) => record.url))))
          return
        }

        if (result.status === "running") {
          timeout = setTimeout(pollCrawl, 2000)
          return
        }

        throw new Error(`Crawl ${result.status ?? "did not complete"}.`)
      } catch (error) {
        if (cancelled) return

        setCrawl({ status: "error", message: error instanceof Error ? error.message : "Could not retrieve the crawl." })
      }
    }

    void pollCrawl()

    return () => {
      cancelled = true
      if (timeout) clearTimeout(timeout)
    }
  }, [crawl])

  async function startCrawl() {
    if (!origin) return

    try {
      setCrawl({ status: "starting" })
      setSelectedPages([])

      setCrawl({ status: "polling", jobId: await startCloudflareCrawl(origin) })
    } catch (error) {
      setCrawl({ status: "error", message: error instanceof Error ? error.message : "Could not start the crawl." })
    }
  }

  function togglePage(page: string, checked: boolean) {
    setSelectedPages((current) =>
      checked ? [...new Set([...current, page])] : current.filter((item) => item !== page)
    )
  }

  function toggleVisiblePages(checked: boolean) {
    setSelectedPages((current) => {
      if (checked) return [...new Set([...current, ...matchingPages])]

      return current.filter((page) => !matchingPages.includes(page))
    })
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setUrl("")
      setSearch("")
      setSelectedPages([])
      setCrawl({ status: "idle" })
    }

    onOpenChange(nextOpen)
  }

  function handleAddSelectedPages() {
    const selectedPageSet = new Set(selectedPages)
    const files = crawlRecords
      .filter((record) => selectedPageSet.has(record.url))
      .map(
        (record) =>
          new File([record.markdown], getMarkdownFileName(record.url), {
            type: "text/markdown",
            lastModified: Date.now(),
          })
      )

    if (!files.length) return

    onAddFiles(files)
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl overflow-hidden p-0" showCloseButton={!isSelectingPages}>
        {!isSelectingPages ? (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void startCrawl()
            }}
          >
            <DialogHeader className="border-b bg-muted/20 px-6 py-5 pr-14">
              <DialogTitle className="text-xl">Add Web Pages</DialogTitle>
            </DialogHeader>

            <div className="space-y-2 px-6 py-6">
              <label htmlFor="web-page-url" className="text-sm font-medium">
                URL Address
              </label>
              <Input
                id="web-page-url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="Enter URL"
                className="h-11"
                autoFocus
              />
              {isBusy ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  Searching the site map for pages...
                </p>
              ) : null}
              {crawlError ? <p className="text-sm text-destructive">{crawlError}</p> : null}
            </div>

            <DialogFooter className="border-t bg-muted/10 px-6 py-4">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!origin || isBusy}>
                {isBusy ? "Searching..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex h-[min(760px,88svh)] flex-col">
            <DialogHeader className="border-b bg-muted/20 px-6 py-5 pr-14">
              <DialogTitle className="text-xl">Select Site Maps</DialogTitle>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="relative">
                <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search..."
                  className="h-11 pl-9"
                />
              </div>

              <div className="mt-5 space-y-4">
                <label className="flex w-fit items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={(checked) => toggleVisiblePages(checked === true)}
                  />
                  Select All ({matchingPages.length})
                </label>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-2 font-medium">
                      <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                      <Checkbox
                        checked={pages.length > 0 && pages.every((page) => selectedPages.includes(page))}
                        onCheckedChange={(checked) =>
                          setSelectedPages(checked === true ? pages : [])
                        }
                      />
                      <span className="truncate">{origin ? new URL(origin).hostname : "Website"}</span>
                      <span className="text-sm font-normal text-muted-foreground">({pages.length})</span>
                    </div>
                  </div>

                  <div className="space-y-3 pl-8">
                    {matchingPages.map((page) => (
                      <label key={page} className="flex w-fit items-center gap-2 text-sm">
                        <Checkbox
                          checked={selectedPages.includes(page)}
                          onCheckedChange={(checked) => togglePage(page, checked === true)}
                        />
                        <span className="break-all">{page}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t bg-muted/10 px-6 py-4">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={!selectedPages.length} onClick={handleAddSelectedPages}>
                Save
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
