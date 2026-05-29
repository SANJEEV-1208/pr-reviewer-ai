CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    github_id       BIGINT UNIQUE NOT NULL,
    github_login    VARCHAR(255) NOT NULL,
    github_email    VARCHAR(255),
    avatar_url      TEXT,
    access_token    TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repos (
    id                  SERIAL PRIMARY KEY,
    github_repo_id      BIGINT UNIQUE NOT NULL,
    owner               VARCHAR(255) NOT NULL,
    name                VARCHAR(255) NOT NULL,
    full_name           VARCHAR(511) NOT NULL,
    installation_id     BIGINT NOT NULL,
    user_id             INTEGER REFERENCES users(id) ON DELETE SET NULL,
    focus_rules         JSONB DEFAULT '[]',
    enabled             BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pull_requests (
    id              SERIAL PRIMARY KEY,
    repo_id         INTEGER REFERENCES repos(id) ON DELETE CASCADE,
    github_pr_id    BIGINT NOT NULL,
    pr_number       INTEGER NOT NULL,
    title           TEXT NOT NULL,
    author_login    VARCHAR(255) NOT NULL,
    base_branch     VARCHAR(255) NOT NULL,
    head_branch     VARCHAR(255) NOT NULL,
    html_url        TEXT NOT NULL,
    state           VARCHAR(50) DEFAULT 'open',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(repo_id, github_pr_id)
);

CREATE TABLE IF NOT EXISTS reviews (
    id                  SERIAL PRIMARY KEY,
    pull_request_id     INTEGER REFERENCES pull_requests(id) ON DELETE CASCADE,
    commit_sha          VARCHAR(40) NOT NULL,
    status              VARCHAR(50) DEFAULT 'pending',
    raw_diff_size_bytes INTEGER,
    prompt_tokens       INTEGER,
    completion_tokens   INTEGER,
    model_used          VARCHAR(100),
    review_body         TEXT,
    bugs_found          JSONB DEFAULT '[]',
    security_issues     JSONB DEFAULT '[]',
    suggestions         JSONB DEFAULT '[]',
    github_comment_id   BIGINT,
    error_message       TEXT,
    duration_ms         INTEGER,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_pull_request_id ON reviews(pull_request_id);
CREATE INDEX IF NOT EXISTS idx_pull_requests_repo_id ON pull_requests(repo_id);
CREATE INDEX IF NOT EXISTS idx_repos_installation_id ON repos(installation_id);
CREATE INDEX IF NOT EXISTS idx_repos_user_id ON repos(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
