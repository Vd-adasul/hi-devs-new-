import { EnkryptService } from '../services/enkrypt.service.js'

/**
 * Checks input query for safety (toxicity, prompt injection attacks).
 * Throws an error if flagged, preventing LLM execution.
 */
export async function verifyInputSafety(text: string, context?: string): Promise<void> {
  if (!text || !text.trim()) return
  
  try {
    const enkrypt = EnkryptService.getInstance()
    const result = await enkrypt.evaluate(text, context)
    
    if (!result.safe) {
      throw new Error(`Input flagged as unsafe by Enkrypt AI: ${result.flags.join(', ')}`)
    }
  } catch (err: any) {
    if (err.message?.includes('Input flagged as unsafe')) {
      throw err
    }
    console.error('[Enkrypt AI] Input safety check failed to execute. Degrading gracefully:', err)
  }
}

/**
 * Checks LLM output for safety (toxicity, PII leakage, legal compliance).
 * Returns a safety block message if flagged, preventing output exposure.
 */
export async function verifyResponseSafety(text: string, context?: string): Promise<string> {
  if (!text || !text.trim()) return text
  
  try {
    const enkrypt = EnkryptService.getInstance()
    const result = await enkrypt.evaluate(text, context)
    
    if (!result.safe) {
      console.warn(`[Enkrypt AI] Unsafe response flagged. Flags: ${result.flags.join(', ')}`)
      return `[SAFETY BLOCK] The generated response was blocked by Enkrypt AI Safety Check for security compliance: ${result.flags.join(', ')}.`
    }
  } catch (err: any) {
    console.error('[Enkrypt AI] Response safety check failed to execute. Degrading gracefully:', err)
  }
  
  return text
}
