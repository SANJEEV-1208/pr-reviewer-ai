import { ChatGroq } from '@langchain/groq';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export type PRType =
  | 'feature'
  | 'bugfix'
  | 'refactor'
  | 'docs'
  | 'test'
  | 'security-patch'
  | 'chore';

export interface PRClassification {
  prType: PRType;
  confidence: string;
  reviewFocus: string[];
}

const PR_TYPE_FOCUS: Record<PRType, string[]> = {
  feature: ['design', 'test-coverage', 'edge-cases', 'error-handling'],
  bugfix: ['correctness', 'root-cause', 'regression-risk', 'edge-cases'],
  refactor: ['behavior-preservation', 'complexity', 'maintainability'],
  docs: ['clarity', 'accuracy', 'completeness'],
  test: ['coverage-quality', 'assertion-strength', 'test-isolation'],
  'security-patch': ['security', 'owasp', 'attack-surface', 'correctness'],
  chore: ['correctness', 'maintainability'],
};

const model = new ChatGroq({
  apiKey: env.GROQ_API_KEY,
  model: 'llama-3.3-70b-versatile',
  temperature: 0,
});

const classifierPrompt = PromptTemplate.fromTemplate(`
You are a pull request classifier. Analyze the PR title and diff and classify the PR type.

PR Title: {prTitle}
Branch: {headBranch} → {baseBranch}

Diff (first 3000 chars):
{diffSnippet}

Respond with ONLY one of these exact words (no explanation):
feature | bugfix | refactor | docs | test | security-patch | chore
`);

const classifierChain = RunnableSequence.from([
  classifierPrompt,
  model,
  new StringOutputParser(),
]);

export async function classifyPR(params: {
  prTitle: string;
  headBranch: string;
  baseBranch: string;
  diff: string;
}): Promise<PRClassification> {
  const { prTitle, headBranch, baseBranch, diff } = params;

  try {
    const raw = await classifierChain.invoke({
      prTitle,
      headBranch,
      baseBranch,
      diffSnippet: diff.slice(0, 3000),
    });

    const prType = raw.trim().toLowerCase() as PRType;
    const validTypes: PRType[] = ['feature', 'bugfix', 'refactor', 'docs', 'test', 'security-patch', 'chore'];
    const resolvedType: PRType = validTypes.includes(prType) ? prType : 'feature';

    const classification: PRClassification = {
      prType: resolvedType,
      confidence: resolvedType === prType ? 'high' : 'low',
      reviewFocus: PR_TYPE_FOCUS[resolvedType],
    };

    logger.info('PR classified', { prTitle, prType: resolvedType });
    return classification;
  } catch (err) {
    logger.warn('PR classification failed, defaulting to feature', {
      error: (err as Error).message,
    });
    return {
      prType: 'feature',
      confidence: 'low',
      reviewFocus: PR_TYPE_FOCUS['feature'],
    };
  }
}
