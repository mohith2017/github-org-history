import { XYChartData, XYData } from "../packages/xy-chart";
import { ChartMode, RepoStarData, RepoData } from "../types/chart";
import api from "./api";
import utils from "./utils";

export const DEFAULT_MAX_REQUEST_AMOUNT = 15;

const STAR_HISTORY_LOGO_URL =
  "https://avatars.githubusercontent.com/u/124480067";

export const getReposStarData = async (
  repos: string[],
  token = "",
  maxRequestAmount = DEFAULT_MAX_REQUEST_AMOUNT
): Promise<RepoStarData[]> => {
  const repoStarDataCacheMap = new Map();

  for (const repo of repos) {
    try {
      const starRecords = await api.getRepoStarRecords(
        repo,
        token,
        maxRequestAmount
      );
      repoStarDataCacheMap.set(repo, starRecords);
    } catch (error: any) {
      let message = "";
      let status = 500;

      if (error?.response?.status === 404) {
        message = `Repo ${repo} not found`;
        status = 404;
      } else if (error?.response?.status === 403) {
        message = "GitHub API rate limit exceeded";
        status = 403;
      } else if (error?.response?.status === 401) {
        message = "Access Token Unauthorized";
        status = 401;
      } else if (Array.isArray(error?.data) && error.data?.length === 0) {
        message = `Repo ${repo} has no star history`;
        status = 501;
      } else {
        message = "Some unexpected error happened, try again later";
      }

      return Promise.reject({
        message,
        status,
        repo,
      });
    }
  }

  const reposStarData: RepoStarData[] = [];
  for (const repo of repos) {
    const records = repoStarDataCacheMap.get(repo);
    if (records) {
      reposStarData.push({
        repo,
        starRecords: records,
      });
    }
  }

  return reposStarData.sort((d1, d2) => {
    return (
      Math.max(...d2.starRecords.map((s) => s.count)) -
      Math.max(...d1.starRecords.map((s) => s.count))
    );
  });
};


export const getRepoData = async (
  repos: string[],
  token = "",
  maxRequestAmount = DEFAULT_MAX_REQUEST_AMOUNT
): Promise<RepoData[]> => {
  const repoDataCacheMap: Map<
    string,
    {
      star: {
        date: string;
        count: number;
      }[];
      logo: string;
    }
  > = new Map();

  for (const repo of repos) {
    try {
      const starRecords = await api.getRepoStarRecords(
        repo,
        token,
        maxRequestAmount
      );
      console.log("Star record data for ", repo, ": ", starRecords);
      const logo = await api.getRepoLogoUrl(repo, token);
      repoDataCacheMap.set(repo, { star: starRecords, logo });
    } catch (error: any) {
      let message = "";
      let status = 500;

      if (error?.response?.status === 404) {
        message = `Repo ${repo} not found`;
        status = 404;
      } else if (error?.response?.status === 403) {
        message = "GitHub API rate limit exceeded";
        status = 403;
      } else if (error?.response?.status === 401) {
        message = "Access Token Unauthorized";
        status = 401;
      } else if (Array.isArray(error?.data) && error.data?.length === 0) {
        message = `Repo ${repo} has no star history`;
        continue;
      } else {
        message = "Some unexpected error happened, try again later";
      }

      console.error("Failed to request data:", status, message);

      // If encountering not found or no star error, we will return an empty image so that cache can be set.
      if (status === 404 || status === 501) {
        return [
          {
            repo,
            starRecords: [
              {
                date: utils.getDateString(Date.now(), "yyyy/MM/dd"),
                count: 0,
              },
            ],
            logoUrl: STAR_HISTORY_LOGO_URL,
          },
        ];
      }

      return Promise.reject({
        message,
        status,
        repo,
      });
    }
  }

  let reposStarData: RepoData[] = [];
  for (const repo of repos) {
    const records = repoDataCacheMap.get(repo);
    if (records) {
      console.log("Records exist");
      reposStarData.push({
        repo,
        starRecords: records.star,
        logoUrl: records.logo,
      });
    }
  }

  // Step 1: Flatten the array
  let flatArray = reposStarData.flatMap(repo => 
    repo.starRecords.map(record => ({date: record.date, count: record.count}))
  );
  console.log("Flat array: ", flatArray);
  
  // Step 2: Sort the array by date
  flatArray.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  console.log("Sorted Flat array: ", flatArray);
  
  // Step 3: Group the array by date
  let groupedByDate = flatArray.reduce((acc, cur) => {
    let date = cur.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(cur);
    return acc;
  }, {} as Record<string, typeof flatArray>);
  console.log("Array grouped by date: ", groupedByDate);
  
  // Step 4: Sum the counts for each group
  let summedCounts = Object.entries(groupedByDate).map(([date, records]) => {
    let totalCount = records.reduce((sum, record) => sum + record.count, 0);
    return {date, count: totalCount};
  });
  

  // Needs updating to dynamic logo URL and repo
  console.log("Summed counts of stars: ", summedCounts);
  reposStarData = [{
    logoUrl: 'https://avatars.githubusercontent.com/u/79945230?v=4',
    repo: 'nixtla', 
    starRecords: summedCounts, 
  }];


  console.log("repoStarData: ", reposStarData);
  console.log("Return data for repoStarData: ", reposStarData.sort((d1, d2) => {
    return (
      Math.max(...d2.starRecords.map((s) => s.count)) -
      Math.max(...d1.starRecords.map((s) => s.count))
    );
  }));

  return reposStarData.sort((d1, d2) => {
    return (
      Math.max(...d2.starRecords.map((s) => s.count)) -
      Math.max(...d1.starRecords.map((s) => s.count))
    );
  });
};

export const convertStarDataToChartData = (
  reposStarData: RepoStarData[],
  chartMode: ChartMode
): XYChartData => {
  if (chartMode === "Date") {
    const datasets: XYData[] = reposStarData.map((item) => {
      const { repo, starRecords } = item;

      return {
        label: repo,
        logo: "",
        data: starRecords.map((item) => {
          return {
            x: new Date(item.date),
            y: Number(item.count),
          };
        }),
      };
    });

    return {
      datasets,
    };
  } else {
    const datasets: XYData[] = reposStarData.map((item) => {
      const { repo, starRecords } = item;

      const started = starRecords[0].date;

      return {
        label: repo,
        logo: "",
        data: starRecords.map((item) => {
          return {
            x:
              utils.getTimeStampByDate(new Date(item.date)) -
              utils.getTimeStampByDate(new Date(started)),
            y: Number(item.count),
          };
        }),
      };
    });

    return {
      datasets,
    };
  }
};
// Main data to chart data function
export const convertDataToChartData = (
  repoData: RepoData[],
  chartMode: ChartMode
): XYChartData => {
  if (chartMode === "Date") {
    const datasets: XYData[] = repoData.map(
      ({ repo, starRecords, logoUrl }) => ({
        label: repo,
        logo: logoUrl,
        data: starRecords.map((item) => {
          return {
            x: new Date(item.date),
            y: Number(item.count),
          };
        }),
      })
    );

    return { datasets };
  } else {
    const datasets: XYData[] = repoData.map(
      ({ repo, starRecords, logoUrl }) => ({
        label: repo,
        logo: logoUrl,
        data: starRecords.map((item) => {
          return {
            x:
              utils.getTimeStampByDate(new Date(item.date)) -
              utils.getTimeStampByDate(new Date(starRecords[0].date)),
            y: Number(item.count),
          };
        }),
      })
    );

    return { datasets };
  }
};
