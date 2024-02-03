export type ChartMode = "Date" | "Timeline";

export interface StarRecord {
  date: string;
  count: number;
}

export interface RepoStarData {
  repo: string;
  starRecords: StarRecord[];
}

export interface RepoData extends RepoStarData {
  logoUrl: string;
}

export interface DownloadRecord {
  date: string;
  count: number;
}

export interface DownloadData {
  repo: string;
  downloadRecords: DownloadRecord[];
}

export interface RepoDownloadData extends DownloadData {
  logoUrl: string;
}