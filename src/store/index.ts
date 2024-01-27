import { createPinia, defineStore } from "pinia";
import storage from "../helpers/storage";
import { ChartMode } from "../../types/chart";

export const piniaInstance = createPinia();

interface AppState {
  isFetching: boolean;
  token: string;
  org: string[];
  chartMode: ChartMode;
  repoList: string[];
}

const useAppStore = defineStore("appStore", {
  state: (): AppState => {
    const { accessTokenCache } = storage.get(["accessTokenCache"]);
    const hash = window.location.hash.slice(1);
    const params = hash.split("&").filter((i) => Boolean(i));
    const org: string[] = [];
    const repoList: string[] = [];
    let chartMode: ChartMode = "Date";

    for (const value of params) {
      if (value === "Date" || value === "Timeline") {
        chartMode = value;
        continue;
      }
      if (!org.includes(value)) {
        org.push(value);
      }
    }

    return {
      isFetching: false,
      token: accessTokenCache || "",
      org: org,
      repoList: repoList,
      chartMode: chartMode,
    };
  },
  actions: {
    addOrg(orgInput: string) {
      if (!this.org.includes(orgInput)) {
      this.org.push(orgInput);
      }
      this.org = [...this.org];
      // this.repoList = orgInput;
    },
    delOrg(orgInput: string) {
      if (this.org.includes(orgInput)) {
        this.org.splice(this.org.indexOf(orgInput), 1);
      }
      this.org = [...this.org];
    },
    setOrg(orgInput: string[]) {
      this.org = orgInput;
    },
    setToken(token: string) {
      this.token = token;
    },
    setIsFetching(isFetching: boolean) {
      this.isFetching = isFetching;
    },
    setChartMode(chartMode: ChartMode) {
      this.chartMode = chartMode;
    },
  },
});

export default useAppStore;
