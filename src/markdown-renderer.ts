import { Release, Issue } from "./interfaces";

interface Options {
  categories: string[];
  baseIssueUrl: string;
  unreleasedName: string;
  repo: string;
}

export default class MarkdownRenderer {
  private options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  public renderMarkdown(release: Release): string {
    return this.renderRelease(release);
  }

  private renderRelease(release: Release): string {
    return `## ${release.tag} (${release.releaseDate})\n\n${this.renderIssues(release.issues)}`;
  }

  private renderIssues(issues: Issue[]) {
    return issues
      .map((issue: Issue) => {
        const packages = issue.packages
          ? `  * Измененные пакеты: ${issue.packages.map(pkg => `\`${pkg}\``).join(", ")}\n`
          : "";
        return `* ${issue.title} [#${issue.number}](https://github.com/${this.options.repo}/pull/${issue.number})\n${packages}   * Автор PR: [@${issue.username}](https://github.com/${issue.username})`;
      })
      .join("\n\n");
  }
}
