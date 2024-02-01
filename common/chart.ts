import { XYChartData, XYData } from "../packages/xy-chart";
import { ChartMode, RepoStarData, RepoData } from "../types/chart";
import api from "./api";
import utils from "./utils";
import axios from 'axios';
import moment from 'moment';


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
      orgName: string;
      star: {
        date: string;
        count: any;
      }[];
      logo: string;
    }
  > = new Map();

  console.log("Repos input value: ", repos);
  let reposStarData: RepoData[] = [];



  for (const repo of repos) {
    //Org repo names
    console.log("Org initial value: ", repo);
    let repoNames = await api.getOrgRepos(repo);
    console.log("Repo direct names: ", repoNames);

    // Python packages logic
    // for (const subrepo of repoNames){
    //   const pythonPackageData = await api.getDownloadData(subrepo);
    //   console.log("Pepytech API result for ", subrepo, " : ", pythonPackageData);
    // }

    repoNames = repoNames.map(item => `${repo}/${item}`)
    console.log("Repo Names: ", repoNames);
    

    
    for(const subrepo of repoNames){
  
    try {
      const starRecords = await api.getRepoStarRecords(
        subrepo,
        token,
        maxRequestAmount
      );
      console.log("Star record data for ", subrepo, ": ", starRecords);
      const logo = await api.getRepoLogoUrl(subrepo, token);
      reposStarData.push({repo: subrepo, logoUrl: logo, starRecords: starRecords});
      
      
      
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

   
  console.log("Repo star data: " , reposStarData);
  console.log("Repo star data type: ", typeof reposStarData);


   //New logic - Before coming to this part, first make every value within a repositories star count = value - prevValue(increase from previous star value)
   // Then while going through each repo - isolate all of the objects and add it to another object.
   // sort it
   // incrementally add from one date to the next till it reaches the last, by adding its previous object's count value

  // Step 1: Flatten the array
  let flatArray = reposStarData.flatMap(repo => 
    repo.starRecords.map(record => ({date: record.date, count: record.count}))
  );
  console.log("Flat array: ", flatArray);
  
  // Step 2: Sort the array by date
  flatArray.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  console.log("Sorted Flat array: ", flatArray);


  let tempSummedCounts: {} = {};
  let prevCount = 0;
  console.log("Flat array first value: ", flatArray[0]);
  for (let i = 0; i<flatArray.length; i++ ){
    const month = new Date(flatArray[i]["date"]).getMonth() + 1;
    console.log("Month: ", month);
    const year = new Date(flatArray[i]["date"]).getFullYear();
    const date = year.toString() + "/" + month.toString();

    if (date in tempSummedCounts){
      tempSummedCounts[date] += flatArray[i]["count"];
    }
    else{
      tempSummedCounts[date] = flatArray[i]["count"] + prevCount;
    }

    prevCount = tempSummedCounts[date];
  }

  
  // // Step 3: Group the array by date
  // let groupedByDate = flatArray.reduce((acc, cur) => {
  //   let date = cur.date;
  //   if (!acc[date]) {
  //     acc[date] = [];
  //   }
  //   acc[date].push(cur);
  //   return acc;
  // }, {} as Record<string, typeof flatArray>);
  // console.log("Array grouped by date: ", groupedByDate);

  
  // // Step 4: Sum the counts for each group
  // let summedCounts = Object.entries(groupedByDate).map(([date, records]) => {
  //   let totalCount = records.reduce((sum, record) => sum + record.count, 0);
  //   return {date, count: totalCount};
  // });

  // let groupedByWeek: Record<string, typeof flatArray> = flatArray.reduce((acc, cur) => {
  //   const yearWeek = `${moment(cur.date).year()}-${moment(cur.date).week()}`;
   
  //   if (!acc[yearWeek]) {
  //      acc[yearWeek] = [];
  //   }
   
  //   acc[yearWeek].push(cur);
   
  //   return acc;
  //  }, {} as Record<string, typeof flatArray>);
  //  console.log("Array grouped by week: ", groupedByWeek);

  // let runningTotal = 0;
  // let summedCounts: {date: string, count: number}[] = Object.entries(groupedByWeek).map(([week, records]: [string, typeof flatArray]) => {
  //     let totalCount = records.reduce((sum, record) => sum + record.count, 0);
  //     runningTotal += totalCount;
      
  //     // Calculate the middle date of the week
  //     let year = parseInt(week.split('-')[0]);
  //     let weekNumber = parseInt(week.split('-')[1]);
  //     let startOfWeek = moment().year(year).week(weekNumber).day(1).format();
  //     let endOfWeek = moment().year(year).week(weekNumber).day(7).format();
  //     let middleOfWeek = new Date((new Date(startOfWeek).getTime() + new Date(endOfWeek).getTime()) / 2).toISOString().split('T')[0];
      
  //     return {date: middleOfWeek, count: runningTotal};
  // });


//   let groupedByMonth: Record<string, typeof flatArray> = flatArray.reduce((acc, cur) => {
//     const yearMonth = `${moment(cur.date).year()}-${moment(cur.date).month() + 1}`;
  
//     if (!acc[yearMonth]) {
//        acc[yearMonth] = [];
//     }
  
//     acc[yearMonth].push(cur);
   
//     return acc;
//   }, {} as Record<string, typeof flatArray>);
//   console.log("Array grouped by month: ", groupedByMonth);

//   let runningTotal = 0;
//   let summedCounts: {date: string, count: number}[] = Object.entries(groupedByMonth).map(([month, records]: [string, typeof flatArray]) => {
//     let totalCount = records.reduce((sum, record) => sum + record.count, 0);
//     runningTotal += totalCount;
    
//     // Calculate the middle date of the month
//     let year = parseInt(month.split('-')[0]);
//     let monthNumber = parseInt(month.split('-')[1]);
//     let startOfMonth = moment().year(year).month(monthNumber - 1).startOf('month').format();
//     let endOfMonth = moment().year(year).month(monthNumber - 1).endOf('month').format();
//     let middleOfMonth = new Date((new Date(startOfMonth).getTime() + new Date(endOfMonth).getTime()) / 2).toISOString().split('T')[0];
    
//     return {date: middleOfMonth, count: totalCount};
// });

  const transformObject = obj => {
 return Object.entries(obj)
    .map(([date, count]) => ({ date, count }));
};
  const summedCounts = transformObject(tempSummedCounts)
  console.log("Summed counts: ", summedCounts)

  repoDataCacheMap.set(repo, { orgName: repo, star: summedCounts, logo: reposStarData[0]["logoUrl"] });

  

  }

  let finalreposStarData: RepoData[] = [];
  for (const repo of repos) {
    const records = repoDataCacheMap.get(repo);
    if (records) {
      console.log("Records exist");
      finalreposStarData.push({
        repo,
        starRecords: records.star,
        logoUrl: records.logo,
      });
    }
  }

 
  

  // console.log("repoStarData before changing: ", reposStarData[0]);
  // // Needs updating to dynamic logo URL and repo
  // console.log("Summed counts of stars: ", summedCounts);
  // reposStarData.push({
  //   logoUrl: reposStarData[0]['logoUrl'],
  //   repo: reposStarData[0]['repo'].split('/')[0], 
  //   starRecords: summedCounts, 
  // });


  console.log("finalreposStarData: ", finalreposStarData);
  console.log("Return data for repoStarData: ", finalreposStarData.sort((d1, d2) => {
    return (
      Math.max(...d2.starRecords.map((s) => s.count)) -
      Math.max(...d1.starRecords.map((s) => s.count))
    );
  }));

  return finalreposStarData.sort((d1, d2) => {
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
