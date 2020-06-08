const execa = require("execa");
const execSync = require("child_process").execSync;

export async function changedPaths(sha: string): Promise<string[]> {
  try {
    const result = await execa("git", ["show", "-m", "--name-only", "--pretty=format:", "--first-parent", sha]);
    return result.stdout.split("\n");
  } catch {
    return [];
  }
}

/**
 * All existing tags in the repository
 */
export function listTagNames(): string[] {
  return execa
    .sync("git", ["tag"])
    .stdout.split("\n")
    .filter(Boolean);
}

export function getPackageTags(mainPackage: string): string {
  return execSync(`git for-each-ref --sort=creatordate --format '%(tag)' | grep "${mainPackage}"`)
    .toString()
    .split("\n")
    .filter((tag: string) => tag.length > 0);
}

export function getDateByTag(tag: string): string {
  return execa.sync("git", ["log", "-1", "--format=%ai", tag]).stdout;
}

export function lastTag(mainPackage: string): string {
  const mainPackageTags = getPackageTags(mainPackage);
  const lastTag = mainPackageTags[mainPackageTags.length - 1];
  return lastTag;
}

export function previousTagDate(mainPackage: string = "vega-ui"): string {
  const mainPackageTags = getPackageTags(mainPackage);
  const previousTag = mainPackageTags[mainPackageTags.length - 2];
  return getDateByTag(previousTag);
}

export interface CommitListItem {
  sha: string;
  refName: string;
  summary: string;
  date: string;
}

export function parseLogMessage(commit: string): CommitListItem | null {
  const parts = commit.match(/hash<(.+)> ref<(.*)> message<(.*)> date<(.*)>/) || [];

  if (!parts || parts.length === 0) {
    return null;
  }

  return {
    sha: parts[1],
    refName: parts[2],
    summary: parts[3],
    date: parts[4],
  };
}

export function listCommits(from: string, to: string = ""): CommitListItem[] {
  // Prints "hash<short-hash> ref<ref-name> message<summary> date<date>"
  // This format is used in `getCommitInfos` for easily analize the commit.
  return execa
    .sync("git", [
      "log",
      "--oneline",
      "--pretty=hash<%h> ref<%D> message<%s> date<%cd>",
      "--date=short",
      `${from}..${to}`,
    ])
    .stdout.split("\n")
    .filter(Boolean)
    .map(parseLogMessage)
    .filter(Boolean);
}
