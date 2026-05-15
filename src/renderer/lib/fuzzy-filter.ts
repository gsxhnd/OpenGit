/**
 * VS Code–style fuzzy filter: query characters must appear in order in the target.
 * Returns a score (higher = better) and matched character indices for highlighting.
 */

export interface FuzzyMatch {
  score: number
  matches: readonly number[]
}

const WORD_SEPARATORS = /[\s\-_./:\\()[\]{}]/

export function fuzzyMatch(query: string, target: string): FuzzyMatch | null {
  const pattern = query.trim().toLowerCase()
  if (!pattern) return { score: 0, matches: [] }

  const text = target.toLowerCase()
  const matches: number[] = []
  let patternIndex = 0
  let score = 0
  let lastMatch = -1
  let consecutive = 0

  for (let i = 0; i < text.length && patternIndex < pattern.length; i++) {
    if (text[i] !== pattern[patternIndex]) continue

    matches.push(i)

    if (lastMatch === i - 1) {
      consecutive++
      score += 2 + consecutive
    } else {
      consecutive = 0
      score += 1
    }

    if (i === 0) score += 6
    else if (WORD_SEPARATORS.test(target[i - 1] ?? '')) score += 5

    lastMatch = i
    patternIndex++
  }

  if (patternIndex < pattern.length) return null

  const span = matches.length > 1 ? matches[matches.length - 1] - matches[0] : 0
  score -= span * 0.3

  return { score, matches }
}
