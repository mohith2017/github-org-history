import axios, { AxiosResponse } from "axios";
import { HttpProxyAgent } from 'http-proxy-agent';
import {HttpsProxyAgentOptions} from 'https-proxy-agent'
import utils from "./utils";
import { DownloadRecord } from "../types/chart";


const DEFAULT_PER_PAGE = 30;

namespace api {
  export async function getOrgRepos(
    org: string,
    token?: string,
  ): Promise<string[]> {
  //   let repoNames: string[];
  //   let url = `https://api.github.com/orgs/${org}/repos`;
  //   console.log("URL for fetching repos: ", url);
    

  //   try {
  //     const response = await axios.get(url);
  //     const data = response.data;
  //     console.log("Data response:", data);
  //     repoNames = data.map((repo: any) => repo.name);
  //     console.log(repoNames);
  //  } catch (error) {
  //     console.log(`Failed to fetch repos: ${error}`);
  //     return [];
  //  }

  //   return repoNames;
  let repoNames: string[] = [];
  let url = `https://api.github.com/orgs/${org}/repos`;
  console.log("URL for fetching repos: ", url);

  try {
  let currentPageUrl = url; // Start with the initial URL
  while (currentPageUrl) {
      const response = await axios.get(currentPageUrl, {
        headers: {
          Accept: "application/vnd.github.v3.star+json",
          Authorization: token ? `token ${token}` : "",
        },
      });
      const data = response.data;
      console.log("Data response:", data);
      repoNames = repoNames.concat(data.map((repo: any) => repo.name));
      
      // Extract the 'next' link from the Link header
      const linkHeader = response.headers.link;
      const nextLinkMatch = linkHeader && linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      currentPageUrl = nextLinkMatch ? nextLinkMatch[1] : null;
  }
  } catch (error) {
  console.log(`Failed to fetch repos: ${error}`);
  return [];
  }

  return repoNames;

  }

  export async function getDownloadData(
    repo: string
  ) {
    let data: {};
    
    let url = `/api/v2/projects/${repo}` ;
    const headers = {
      'X-Api-Key': '/Md29pyAyCS72om329LRZJL+QA/+Cwen',
    };
    console.log("URL for fetching repos: ", url);
  

    try {
      const response = await axios.get(url, {headers});
      data = response.data;
      

      console.log("Direct API data: ", data);
      
   } catch (error) {
      console.log(`Failed to fetch repos: ${error}`);
      return undefined;
   }

  //  console.log("Output: ", output);

  //  let prevCount = 0;
  //   for(const record in output){
  //     const temp = output[record]["count"];
  //     output[record]["count"] -= prevCount;
  //     if (output[record]["count"] == 0){
  //       delete output[record];
  //     }
  //     prevCount = temp;
  //   }

    return data;
  }

  export async function predictData(
    prevData: {[key: string]: number} 
  ) {

    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: 'Bearer 6oYHnLGJ5SUV4cD7N0iWmIO42x14tr3jyv3IjGqMb6lE3omOcBSGvAQrALf9uDOaMWEvj0wTWpM011EYcEgtFyfdNKNvl1RtrGIoCXsqWJa7bfPNVtnSIV6oz6VOefpHbxknABNcZJAMEBEhcB3WJrr0fQRPP49FTL6QNxmAaZ1M9U7xs7MOhUcbzaCJBhsBdD0V7CWXhehfYKWqmztJEaLLNB1pdMcVrPODPqimb7EitVVd05W8WLHNHa93oTX6'
      },
      body: JSON.stringify({
        model: 'timegpt-1',
        freq: 'D',
        fh: 7,
        y: prevData,
        clean_ex_first: true,
        finetune_steps: 0,
        finetune_loss: 'default'
      })
    };
    
    let output:any = undefined;
    const result = await fetch('https://dashboard.nixtla.io/api/timegpt', options)
    .then(response => output = response.json())
    .then(response => console.log(response))
    .catch(err => console.error(err));
    
    return output;

  }

  export async function getRepoStargazers(
    repo: string,
    token?: string,
    page?: number
  ) {
    let url = `https://api.github.com/repos/${repo}/stargazers?per_page=${DEFAULT_PER_PAGE}`;
    console.log("URL for stars: ", url);

    if (page !== undefined) {
      url = `${url}&page=${page}`;
    }
    return axios.get(url, {
      headers: {
        Accept: "application/vnd.github.v3.star+json",
        Authorization: token ? `token ${token}` : "",
      },
    });
  }

  export async function getRepoStargazersCount(repo: string, token?: string) {
    const { data } = await axios.get(`https://api.github.com/repos/${repo}`, {
      headers: {
        Accept: "application/vnd.github.v3.star+json",
        Authorization: token ? `token ${token}` : "",
      },
    });

    return data.stargazers_count;
  }

  export async function getRepoStarRecords(
    repo: string,
    token: string,
    maxRequestAmount: number
  ) {
    const patchRes = await getRepoStargazers(repo, token);

    const headerLink = patchRes.headers["link"] || "";

    let pageCount = 1;
    const regResult = /next.*&page=(\d*).*last/.exec(headerLink);

    if (regResult) {
      if (regResult[1] && Number.isInteger(Number(regResult[1]))) {
        pageCount = Number(regResult[1]);
      }
    }

    if (pageCount === 1 && patchRes?.data?.length === 0) {
      throw {
        status: patchRes.status,
        data: [],
      };
    }

    const requestPages: number[] = [];
    if (pageCount < maxRequestAmount) {
      requestPages.push(...utils.range(1, pageCount));
    } else {
      utils.range(1, maxRequestAmount).map((i) => {
        requestPages.push(Math.round((i * pageCount) / maxRequestAmount) - 1);
      });
      if (!requestPages.includes(1)) {
        requestPages.unshift(1);
      }
    }

    const resArray = await Promise.all(
      requestPages.map((page) => {
        return getRepoStargazers(repo, token, page);
      })
    );

    const starRecordsMap: Map<string, number> = new Map();

    if (requestPages.length < maxRequestAmount) {
      const starRecordsData: {
        starred_at: string;
      }[] = [];
      resArray.map((res) => {
        const { data } = res;
        starRecordsData.push(...data);
      });
      for (let i = 0; i < starRecordsData.length; ) {
        starRecordsMap.set(
          utils.getDateString(starRecordsData[i].starred_at),
          i + 1
        );
        i += Math.floor(starRecordsData.length / maxRequestAmount) || 1;
      }
    } else {
      resArray.map(({ data }, index) => {
        if (data.length > 0) {
          const starRecord = data[0];
          starRecordsMap.set(
            utils.getDateString(starRecord.starred_at),
            DEFAULT_PER_PAGE * (requestPages[index] - 1)
          );
        }
      });
    }

    const starAmount = await getRepoStargazersCount(repo, token);
    starRecordsMap.set(utils.getDateString(Date.now()), starAmount);

    const starRecords: {
      date: string;
      count: number;
    }[] = [];

    starRecordsMap.forEach((v, k) => {
      starRecords.push({
        date: k,
        count: v,
      });
    });

    let prevCount = 0;
    for(const record in starRecords){
      const temp = starRecords[record]["count"];
      starRecords[record]["count"] -= prevCount;
      prevCount = temp;
    }

    return starRecords;
  }

  export async function getRepoLogoUrl(
    repo: string,
    token?: string
  ): Promise<string> {
    const owner = repo.split("/")[0];
    const { data } = await axios.get(`https://api.github.com/users/${owner}`, {
      headers: {
        Accept: "application/vnd.github.v3.star+json",
        Authorization: token ? `token ${token}` : "",
      },
    });

    return data.avatar_url;
  }
}

export default api;
