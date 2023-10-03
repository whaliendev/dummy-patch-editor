
// eslint-disable-next-line @typescript-eslint/ban-types
export function throttle(func: Function, timeout = 300) {
  let ready = true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any[]) => {
    if (!ready)
      return

    ready = false
    func(...args)
    setTimeout(() => {
      ready = true
    }, timeout)
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function debounce(func: Function, timeout = 500) {
  let timer: NodeJS.Timeout
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func(...args)
    }, timeout)
  }
}
