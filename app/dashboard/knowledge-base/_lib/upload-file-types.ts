export const UPLOAD_FILE_TYPES = [
    "csv",
    "doc",
    "docx",
    "eml",
    "epub",
    "html",
    "md",
    "msg",
    "odt",
    "org",
    "p7s",
    "pdf",
    "ppt",
    "pptx",
    "rst",
    "rtf",
    "txt",
    "tsv",
    "xls",
    "xlsx",
    "xml",
] as const

export type UploadFileType = (typeof UPLOAD_FILE_TYPES)[number]

export const UPLOAD_FILE_ACCEPT = UPLOAD_FILE_TYPES.map((type) => `.${type}`).join(",")