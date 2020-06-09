const path = require("path");

import ConfigurationError from "./configuration-error";
import * as Git from "./git";
import fetch from "./fetch";

export interface GitHubUserResponse {
  login: string;
  name: string;
  html_url: string;
}
export interface GitHubIssueResponse {
  number: number;
  title: string;
  files: { name: string }[];
  sha: string;
  pull_request?: {
    html_url: string;
  };
  labels: Array<{
    name: string;
  }>;
  user: {
    login: string;
    html_url: string;
  };
}

export interface Options {
  repo: string;
  rootPath: string;
  cacheDir?: string;
}

interface GithubPullRequest {
  commits: GitHubIssueResponse[];
  number: string;
  files: string[];
  user: { login: string };
  username: string;
}

export default class GithubAPI {
  private cacheDir: string | undefined;
  private auth: string;

  constructor(config: Options) {
    this.cacheDir = config.cacheDir && path.join(config.rootPath, config.cacheDir, "github");
    this.auth = this.getAuthToken();
    if (!this.auth) {
      throw new ConfigurationError("Must provide GITHUB_AUTH");
    }
  }

  public getBaseIssueUrl(repo: string): string {
    return `https://github.com/${repo}/issues/`;
  }

  public async getIssueData(repo: string, issue: string): Promise<GitHubIssueResponse> {
    return this._fetch(`https://api.github.com/repos/${repo}/issues/${issue}`);
  }

  public async getUserData(login: string): Promise<GitHubUserResponse> {
    return this._fetch(`https://api.github.com/users/${login}`);
  }

  public async getPullRequests(repo: string, fromDate: string) {
    const date = fromDate.split(" ");
    const fromDateString = `${date[0]}T${date[1]}Z`;
    const { items } = await this._fetch(
      `https://api.github.com/search/issues?q=repo:${repo}+is:pr+is:merged+merged:>${fromDateString}`
    );

    const pullRequests = await Promise.all(
      items.map(async (item: GithubPullRequest) => {
        const files = await this._fetch(`https://api.github.com/repos/${repo}/pulls/${item.number}/files`);
        item.username = item.user.login;
        item.files = files.map((file: { filename: string }) => file.filename);
        return item;
      })
    );

    return pullRequests;
  }

  private async _fetch(url: string): Promise<any> {
    const res = await fetch(url, {
      cacheManager: this.cacheDir,
      headers: {
        Authorization: `token ${this.auth}`,
      },
    });
    const parsedResponse = await res.json();
    if (res.ok) {
      return parsedResponse;
    }
    throw new ConfigurationError(`Fetch error: ${res.statusText}.\n${JSON.stringify(parsedResponse)}`);
  }

  private getAuthToken(): string {
    return process.env.GITHUB_AUTH || "";
  }
}
