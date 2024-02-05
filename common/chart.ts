import { XYChartData, XYData } from "../packages/xy-chart";
import { ChartMode, RepoStarData, RepoData, RepoDownloadData, DownloadRecord } from "../types/chart";
import useAppStore from "../src/store";
import api from "./api";
import utils from "./utils";
import axios from 'axios';
import moment from 'moment';


export const DEFAULT_MAX_REQUEST_AMOUNT = 15;

const STAR_HISTORY_LOGO_URL =
  "https://avatars.githubusercontent.com/u/124480067";

const store = useAppStore();

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

export const getPredictData = async (starRecords: [{}]) =>
{

  let predictSummedCounts: {[key: string]: number} = {};
      let star:any = 0;
      for (star in starRecords ){
        const month = new Date(starRecords[star]["date"]).getMonth() + 1;
        const year = new Date(starRecords[star]["date"]).getFullYear();
        const day = "15";
        const predictDate = year.toString() + "-" + month.toString() + "-" + day;

        predictSummedCounts[predictDate] = starRecords[star]["count"];
      }
      console.log("Predict Temp Summed counts: ", predictSummedCounts);



      let predictedData = await api.predictData(predictSummedCounts);
      console.log("Predicted Data from TimeGPT: ", predictedData.data["timestamp"]);

      let index:any = starRecords.length;
      let predictedStarRecords = starRecords;
      for(const data in predictedData.data["timestamp"]){
        console.log(data);
        const month = new Date(predictedData.data["timestamp"][data]).getMonth() + 1;
        console.log(month);
        const year = new Date(predictedData.data["timestamp"][data]).getFullYear();
        const newPredictDate = year.toString() + "/" + month.toString();
        // console.log(predictedData.data["value"]);

        console.log("Star records prev value: ", predictedStarRecords[index-1]);
        predictedStarRecords[index] = {date: "", count: 0}
        // starRecords[index] = {date: newPredictDate, count: predictedData.data["count"][data]};
        console.log("Star records new value: ", predictedStarRecords[index]);
        predictedStarRecords[index]["date"] = newPredictDate; 
        predictedStarRecords[index]["count"] = predictedData.data["value"][data];
        console.log("Star records updated  value: ", predictedStarRecords[index]);
        index += 1;
      }

      console.log("New Predicted Star Records from TimeGPT: ", predictedStarRecords);
      return predictedStarRecords;
}

export const getPredictDownloadData = async (downloadRecords: DownloadRecord[]) =>
{

  let predictSummedCounts: {[key: string]: number} = {};
      let download:any = 0;
      for (download in downloadRecords ){
        const month = new Date(downloadRecords[download]["date"]).getMonth() + 1;
        const year = new Date(downloadRecords[download]["date"]).getFullYear();
        const day = "15";
        const predictDate = year.toString() + "-" + month.toString() + "-" + day;

        predictSummedCounts[predictDate] = downloadRecords[download]["count"];
      }
      console.log("Predict Temp Summed counts for Download Data: ", predictSummedCounts);



      let predictedData = await api.predictData(predictSummedCounts);
      console.log("Predicted Data from TimeGPT for Download Data: ", predictedData.data["timestamp"]);

      let index:any = downloadRecords.length;
      let predictedDownloadRecords = downloadRecords;
      for(const data in predictedData.data["timestamp"]){
        console.log(data);
        const month = new Date(predictedData.data["timestamp"][data]).getMonth() + 1;
        console.log(month);
        const year = new Date(predictedData.data["timestamp"][data]).getFullYear();
        const newPredictDate = year.toString() + "/" + month.toString();
        // console.log(predictedData.data["value"]);

        console.log("Download records prev value: ", predictedDownloadRecords[index-1]);
        predictedDownloadRecords[index] = {date: "", count: 0}
        // starRecords[index] = {date: newPredictDate, count: predictedData.data["count"][data]};
        console.log("Download records new value: ", predictedDownloadRecords[index]);
        predictedDownloadRecords[index]["date"] = newPredictDate; 
        predictedDownloadRecords[index]["count"] = predictedData.data["value"][data];
        console.log("Download records updated  value: ", predictedDownloadRecords[index]);
        index += 1;
      }

      console.log("New Predicted Download Records from TimeGPT: ", predictedDownloadRecords);
      return predictedDownloadRecords;
}





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
  



  for (const repo of repos) {
    //Org repo names
    let reposStarData: RepoData[] = [];
    console.log("Org initial value: ", repo);
    let repoNames = await api.getOrgRepos(repo);
    console.log("Repo direct names: ", repoNames);

    // Python packages logic
    // for (const subrepo of repoNames){
    //   let downloadData: RepoDownloadData;
    //   const pythonPackageData = await api.getDownloadData(subrepo);
    //   if (pythonPackageData){
    //     console.log("Pepytech API result for ", subrepo, " : ", pythonPackageData); 
    //     const logo = await api.getRepoLogoUrl(`${repo}/${subrepo}`, token);
    //     downloadData = {repo: pythonPackageData["repo"], downloadRecords: pythonPackageData["downloadRecords"], logoUrl:logo};
    //     console.log("Download Data to be pushed: ", downloadData);
    //     store.setDownloadData(downloadData);
    //   }
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
    let flatArray: {date:string, count:number}[] = [];
    flatArray = reposStarData.flatMap(repo => 
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
      const day = new Date(flatArray[i]["date"]).getDay();
      const date = year.toString() + "/" + month.toString();

      if (date in tempSummedCounts){
        tempSummedCounts[date] += flatArray[i]["count"];
      }
      else{
        tempSummedCounts[date] = flatArray[i]["count"] + prevCount;
      }

      prevCount = tempSummedCounts[date];
    }
    console.log("Temp Summed counts: ", tempSummedCounts);

    const transformObject = obj => {
    return Object.entries(obj)
      .map(([date, count]) => ({ date, count }));
    };
    const summedCounts = transformObject(tempSummedCounts);
    console.log("Summed counts: ", summedCounts);

    if(summedCounts.length <= 0){ continue; }
    repoDataCacheMap.set(repo, { orgName: repo, star: summedCounts, logo: reposStarData[0]["logoUrl"] });
    console.log("Repo Data cache map: ", repoDataCacheMap);
  

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

export const getRepoDownloadData = async (
  repos: string[],
  token = "",
  maxRequestAmount = DEFAULT_MAX_REQUEST_AMOUNT
): Promise<RepoDownloadData[]> => {
  const repoDownloadDataCacheMap: Map<
    string,
    {
      orgName: string;
      downloadRecords: {date:string, count:any}[];
      logo: string;
    }
  > = new Map();

  console.log("Repos for download input value: ", repos);
  
  let downloadData: DownloadRecord;

  for (const repo of repos) {
    //Org repo names
    let reposDownloadData: RepoDownloadData[] = [];
    console.log("Org initial value: ", repo);
    let repoNames = await api.getOrgRepos(repo);
    console.log("Repo direct names: ", repoNames);

    // Python packages logic
    for (const subrepo of repoNames){
      
      let output: DownloadRecord[] = [];
    
      const data = await api.getDownloadData(subrepo);
      if (data){
        console.log("Pepytech API result for ", subrepo, " : ", data); 
        const logo = await api.getRepoLogoUrl(`${repo}/${subrepo}`, token);

        
        for(let value in data["downloads"]){
          // const version = data["versions"][0];
          const version = data["versions"];
          // console.log("At date: ", value, " versions are: ") 
          let count = 0;
          
          for (const v in version){
            // console.log("Data count at version: ", data["downloads"][value][data["versions"][v]]);
            if (data["downloads"][value][data["versions"][v]]){
              count += data["downloads"][value][data["versions"][v]];  
            }
          }
            output.push({
              date: value,
              count: count,
            });
        }
       
        reposDownloadData.push({repo: subrepo, logoUrl: logo, downloadRecords: output});
        
        // store.setDownloadData(downloadData);
      }

    }

    console.log("Download Data: ", reposDownloadData);

    repoNames = repoNames.map(item => `${repo}/${item}`)
    console.log("Repo Names: ", repoNames);
   
  console.log("Repo Download data: " , reposDownloadData);
  console.log("Repo Download data type: ", typeof reposDownloadData);


   //New logic - Before coming to this part, first make every value within a repositories star count = value - prevValue(increase from previous star value)
   // Then while going through each repo - isolate all of the objects and add it to another object.
   // sort it
   // incrementally add from one date to the next till it reaches the last, by adding its previous object's count value

  // Step 1: Flatten the array
  let flatArray = reposDownloadData.flatMap(repo => 
    repo.downloadRecords.map(record => ({date: record.date, count: record.count}))
  );
  console.log("Downloads Flat array: ", flatArray);
  
  // Step 2: Sort the array by date
  flatArray.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  console.log("Downloads Sorted Flat array: ", flatArray);


  let tempSummedCounts: {} = {};
  let prevCount = 0;
  console.log("Downloads Flat array first value: ", flatArray[0]);
  for (let i = 0; i<flatArray.length; i++ ){
    const month = new Date(flatArray[i]["date"]).getMonth() + 1;
    console.log("Month: ", month);
    const year = new Date(flatArray[i]["date"]).getFullYear();
    const day = new Date(flatArray[i]["date"]).getDay();
    const date = year.toString() + "/" + month.toString();

    if (date in tempSummedCounts){
      tempSummedCounts[date] += flatArray[i]["count"];
    }
    else{
      tempSummedCounts[date] = flatArray[i]["count"] + prevCount;
    }

    prevCount = tempSummedCounts[date];
  }
  console.log("Downloads Temp Summed counts: ", tempSummedCounts);

  const transformObject = obj => {
   return Object.entries(obj)
    .map(([date, count]) => ({ date, count }));
  };
  const summedCounts = transformObject(tempSummedCounts);
  console.log("Downloads Summed counts: ", summedCounts);

  if(summedCounts.length <= 0){ continue; }

  repoDownloadDataCacheMap.set(repo, { orgName: repo, downloadRecords: summedCounts, logo: reposDownloadData[0]["logoUrl"] });
  console.log("Download Repo data cache map 1: ", repoDownloadDataCacheMap);

  }

  console.log("Download Repo data cache map: ", repoDownloadDataCacheMap);

  let finalreposDownloadData: RepoDownloadData[] = [];
  for (const repo of repos) {
    const records = repoDownloadDataCacheMap.get(repo);
    if (records) {
      console.log("Records exist");
      finalreposDownloadData.push({
        repo,
        downloadRecords: records.downloadRecords,
        logoUrl: records.logo,
      });
    }
  }


  console.log("finalreposDownloadData: ", finalreposDownloadData);
  console.log("Return data for reposDownloadData: ", finalreposDownloadData.sort((d1, d2) => {
    return (
      Math.max(...d2.downloadRecords.map((s) => s.count)) -
      Math.max(...d1.downloadRecords.map((s) => s.count))
    );
  }));

  return finalreposDownloadData.sort((d1, d2) => {
    return (
      Math.max(...d2.downloadRecords.map((s) => s.count)) -
      Math.max(...d1.downloadRecords.map((s) => s.count))
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

//Function to convert data to Chart Data for Downloads
export const convertDataToDownloadChartData = (
  repoData: RepoDownloadData[],
  chartMode: ChartMode
): XYChartData => {
  if (chartMode === "Date") {
    const datasets: XYData[] = repoData.map(
      ({ repo, downloadRecords, logoUrl }) => ({
        label: repo,
        logo: logoUrl,
        data: downloadRecords.map((item) => {
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
      ({ repo, downloadRecords, logoUrl }) => ({
        label: repo,
        logo: logoUrl,
        data: downloadRecords.map((item) => {
          return {
            x:
              utils.getTimeStampByDate(new Date(item.date)) -
              utils.getTimeStampByDate(new Date(downloadRecords[0].date)),
            y: Number(item.count),
          };
        }),
      })
    );

    return { datasets };
  }
};