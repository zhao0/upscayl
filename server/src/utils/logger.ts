function timestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  log(...args: any[]) {
    console.log(`[${timestamp()}]`, ...args);
  },
  error(...args: any[]) {
    console.error(`[${timestamp()}]`, ...args);
  },
};
