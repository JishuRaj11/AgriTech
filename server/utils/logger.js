/**
 * Tiny timestamped logger. Keeps logging dependency-free and predictable.
 */
const stamp = () => new Date().toISOString();

module.exports = {
  info: (message) => console.log(`[${stamp()}] INFO  ${message}`),
  warn: (message) => console.warn(`[${stamp()}] WARN  ${message}`),
  error: (message) => console.error(`[${stamp()}] ERROR ${message}`)
};
