export interface ReviewResult {
  summary: string;
  overall_assessment: 'LGTM' | 'NEEDS_CHANGES' | 'CRITICAL_ISSUES';
  bugs: BugItem[];
  security_issues: SecurityIssueItem[];
  suggestions: SuggestionItem[];
  positive_observations: string[];
  test_coverage_assessment: 'good' | 'insufficient' | 'missing';
  review_markdown: string;
  parseError?: boolean;
}

export interface BugItem {
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line_range: string;
  description: string;
  suggestion: string;
}

export interface SecurityIssueItem {
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line_range: string;
  description: string;
  owasp_category: string;
  suggestion: string;
}

export interface SuggestionItem {
  type: 'performance' | 'maintainability' | 'test-coverage' | 'error-handling' | 'design';
  file: string;
  line_range: string;
  description: string;
  suggestion: string;
}

export function buildSystemPrompt(): string {
  return `You are an expert software engineer conducting a pull request code review.
You are thorough, constructive, and precise. You identify real problems, not stylistic nitpicks.
You must always respond with valid JSON matching the requested schema exactly.
Do not include any text before or after the JSON object.`;
}

export function buildUserPrompt(params: {
  repoFullName: string;
  prTitle: string;
  prAuthor: string;
  baseBranch: string;
  headBranch: string;
  focusRules: string[];
  diff: string;
  prType?: string;
  reviewFocus?: string[];
}): string {
  const { repoFullName, prTitle, prAuthor, baseBranch, headBranch, focusRules, diff, prType, reviewFocus } = params;

  const allFocus = [...(focusRules ?? []), ...(reviewFocus ?? [])];
  const focusSection =
    allFocus.length > 0
      ? `Pay special attention to: ${[...new Set(allFocus)].join(', ')}.`
      : 'Apply standard review criteria.';

  const prTypeSection = prType
    ? `- PR Type: ${prType} (review focus tuned accordingly)`
    : '';

  return `Review the following GitHub pull request and return a JSON object.

## PR Metadata
- Repository: ${repoFullName}
- PR Title: ${prTitle}
- Author: ${prAuthor}
- Branch: ${baseBranch} ← ${headBranch}
${prTypeSection}
- Review Focus: ${focusSection}

## Diff
\`\`\`diff
${diff}
\`\`\`

## Required JSON Schema
Return ONLY a JSON object with this exact structure:

{
  "summary": "2-3 sentence overview of what this PR does",
  "overall_assessment": "LGTM | NEEDS_CHANGES | CRITICAL_ISSUES",
  "bugs": [
    {
      "severity": "critical | high | medium | low",
      "file": "path/to/file",
      "line_range": "42-47",
      "description": "Description of the bug",
      "suggestion": "How to fix it"
    }
  ],
  "security_issues": [
    {
      "severity": "critical | high | medium | low",
      "file": "path/to/file",
      "line_range": "10-15",
      "description": "Description of the security issue",
      "owasp_category": "A01:2021-Broken Access Control | ... | N/A",
      "suggestion": "How to fix it"
    }
  ],
  "suggestions": [
    {
      "type": "performance | maintainability | test-coverage | error-handling | design",
      "file": "path/to/file",
      "line_range": "20-25",
      "description": "Description of the improvement",
      "suggestion": "What to change"
    }
  ],
  "positive_observations": [
    "Things done well in this PR"
  ],
  "test_coverage_assessment": "good | insufficient | missing",
  "review_markdown": "Full review formatted as GitHub-flavored markdown"
}`;
}

export function parseReviewResponse(rawText: string): ReviewResult {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as ReviewResult;

    if (!parsed.review_markdown || !parsed.overall_assessment) {
      throw new Error('Missing required fields in LLM response');
    }

    // Ensure arrays are present
    parsed.bugs = parsed.bugs ?? [];
    parsed.security_issues = parsed.security_issues ?? [];
    parsed.suggestions = parsed.suggestions ?? [];
    parsed.positive_observations = parsed.positive_observations ?? [];

    return parsed;
  } catch {
    // Fallback: use raw text as markdown if JSON is malformed
    return {
      summary: 'AI review generated (JSON parsing failed — see full text below)',
      overall_assessment: 'NEEDS_CHANGES',
      bugs: [],
      security_issues: [],
      suggestions: [],
      positive_observations: [],
      test_coverage_assessment: 'insufficient',
      review_markdown: rawText,
      parseError: true,
    };
  }
}
