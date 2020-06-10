import { Configuration } from "./configuration";
import { Issue, Release } from "./interfaces";
import * as Git from "./git";
import GithubAPI from "./github-api";
import MarkdownRenderer from "./markdown-renderer";

interface Options {
  tagFrom?: string;
  tagTo?: string;
}

export default class Changelog {
  private readonly config: Configuration;
  private github: GithubAPI;
  private renderer: MarkdownRenderer;

  constructor(config: Configuration) {
    this.config = config;
    this.github = new GithubAPI(this.config);
    this.renderer = new MarkdownRenderer({
      categories: Object.keys(this.config.labels).map(key => this.config.labels[key]),
      baseIssueUrl: this.github.getBaseIssueUrl(this.config.repo),
      unreleasedName: this.config.nextVersion || "Unreleased",
      repo: this.config.repo,
    });
  }

  private async getFrom(options: Options): Promise<string> {
    if (options.tagFrom) {
      return await Git.getDateByTag(options.tagFrom);
    }

    if (this.config.mainPackage) {
      return await Git.previousTagDate(this.config.mainPackage);
    }

    return await Git.previousTagDate();
  }

  public async createMarkdown(options: Options = {}) {
    const from = await this.getFrom(options);

    const to = await Git.getDateByTag(options.tagTo || "HEAD");

    const release = await this.getRelease(from, to);

    if (options.tagTo) {
      release.tag = options.tagTo;
    }

    return this.renderer.renderMarkdown(release);
  }

  private async getIssuesInfo(from: string, to: string): Promise<Issue[]> {
    const isMonorepo = this.config.mode === "monorepo";
    const issues = await this.github.getPullRequests(this.config.repo, from, to);
    const issuesByCategories = issues.map((issue: any) => {
      const packages = issue.files.map((file: string) => this.packageFromPath(file));
      if (isMonorepo) {
        issue.packages = packages
          .filter(onlyUnique)
          .filter((p: string) => p.length > 0 && !this.config.ignorePaths.includes(p));
      }
      return { title: issue.title, packages: issue.packages, username: issue.username, number: issue.number };
    });

    if (this.config.mode === "monorepo") {
      return issuesByCategories.filter((issue: Issue) => issue.packages && issue.packages.length > 0);
    }

    return issuesByCategories;
  }

  private async getRelease(from: string, to: string): Promise<Release> {
    const issues = await this.getIssuesInfo(from, to);

    const releaseTag = Git.lastTag(this.config.mainPackage);

    return { issues, tag: releaseTag, releaseDate: to.split(" ")[0] };
  }

  private packageFromPath(path: string): string {
    const parts = path.split("/");
    if (parts[0] !== "packages" || parts.length < 3) {
      return "";
    }

    if (parts.length >= 4 && this.config.ignorePaths.includes(parts[1])) {
      return `${parts[2]}`;
    }

    return parts[1];
  }
}

function onlyUnique(value: any, index: number, self: any[]): boolean {
  return self.indexOf(value) === index;
}
