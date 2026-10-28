export type ApiFieldError = {
  response?: { data?: { message?: string; fields?: Record<string, string> } }
}

export function readApiError(reason: unknown, fallback: string) {
  const data = (reason as ApiFieldError).response?.data
  return {
    message: data?.message ?? fallback,
    fields: data?.fields ?? {},
  }
}
