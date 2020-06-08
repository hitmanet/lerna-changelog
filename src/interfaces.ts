import { GitHubIssueResponse } from "./github-api";

export interface CommitInfo {
  commitSHA: string;
  message: string;
  tags?: string[];
  date: string;
  issueNumber: string | null;
  githubIssue?: GitHubIssueResponse;
  categories?: string[];
  packages?: string[];
}

export interface Issue {
  title: string;
  packages: string[];
  username: string;
  number: string;
}

export interface Release {
  issues: Issue[];
  tag: string;
  releaseDate: string;
}
