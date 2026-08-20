export const scriptApiErrorMessageFn = `fun apiErrorMessage(response) {
  return response.body.error ?? response.body.detail ?? response.body
}`
