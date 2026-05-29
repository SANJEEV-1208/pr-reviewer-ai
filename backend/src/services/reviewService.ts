import { ReviewJobData } from '../queue/reviewQueue';
import { fetchPRDiff, postPRComment } from './githubApi';
import { callGroq, GROQ_MODEL } from './groqClient';
import { buildSystemPrompt, buildUserPrompt, parseReviewResponse } from './reviewPrompt';
import { classifyPR } from './prClassifier';
import { getRepoByGithubId } from '../db/queries/repos';
import { upsertPullRequest } from '../db/queries/pullRequests';
import { insertReview, updateReview } from '../db/queries/reviews';
import { logger } from '../utils/logger';

export async function processReview(jobData: ReviewJobData): Promise<void> {
  const {
    installationId,
    repoGithubId,
    repoFullName,
    owner,
    repoName,
    prNumber,
    prGithubId,
    prTitle,
    prAuthor,
    prHtmlUrl,
    commitSha,
    headBranch,
    baseBranch,
  } = jobData;

  logger.info('Processing review', { repoFullName, prNumber, commitSha });

  // 1. Resolve repo DB record (inserted by installation webhook)
  const repo = await getRepoByGithubId(repoGithubId);
  if (!repo) {
    logger.warn('Repo not found in DB — App may not have sent installation event', {
      repoGithubId,
      repoFullName,
    });
    return;
  }

  if (!repo.enabled) {
    logger.info('Reviews disabled for repo', { repoFullName });
    return;
  }

  // 2. Upsert pull_request record
  const pr = await upsertPullRequest({
    repoId: repo.id,
    githubPrId: prGithubId,
    prNumber,
    title: prTitle,
    authorLogin: prAuthor,
    baseBranch,
    headBranch,
    htmlUrl: prHtmlUrl,
  });

  // 3. Insert review record
  const review = await insertReview({
    pullRequestId: pr.id,
    commitSha,
    modelUsed: GROQ_MODEL,
  });

  try {
    // 4. Fetch diff
    const { diff, sizeBytes } = await fetchPRDiff(installationId, owner, repoName, prNumber);

    // 5. Classify PR type with LangChain, then build tuned prompt
    const classification = await classifyPR({ prTitle, headBranch, baseBranch, diff });

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt({
      repoFullName,
      prTitle,
      prAuthor,
      baseBranch,
      headBranch,
      focusRules: repo.focus_rules ?? [],
      diff,
      prType: classification.prType,
      reviewFocus: classification.reviewFocus,
    });

    const groqResponse = await callGroq(systemPrompt, userPrompt);

    // 6. Parse response
    const result = parseReviewResponse(groqResponse.content);

    // 7. Post comment on GitHub PR
    const commentId = await postPRComment(
      installationId,
      owner,
      repoName,
      prNumber,
      result.review_markdown
    );

    // 8. Save completed review
    await updateReview(review.id, {
      status: 'completed',
      reviewBody: result.review_markdown,
      overallAssessment: result.overall_assessment,
      bugsFound: result.bugs,
      securityIssues: result.security_issues,
      suggestions: result.suggestions,
      githubCommentId: commentId,
      promptTokens: groqResponse.promptTokens,
      completionTokens: groqResponse.completionTokens,
      durationMs: groqResponse.durationMs,
      rawDiffSizeBytes: sizeBytes,
    });

    logger.info('Review completed', {
      repoFullName,
      prNumber,
      reviewId: review.id,
      prType: classification.prType,
      assessment: result.overall_assessment,
      durationMs: groqResponse.durationMs,
    });
  } catch (err) {
    const errorMessage = (err as Error).message;
    logger.error('Review failed', { repoFullName, prNumber, error: errorMessage });

    await updateReview(review.id, {
      status: 'failed',
      errorMessage,
    });

    throw err; // Re-throw so Bull retries the job
  }
}
