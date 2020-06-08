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
