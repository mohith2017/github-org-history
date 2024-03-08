# Open Source Tracker 🚀

> A platform for tracking and predicting the future trends of open-source projects using TimeGPT.


# Project

Task is to create a Website (dashboard) that tracks the performance of open-source projects, specifically focusing on the history of GitHub stars and Python package download statistics. This platform should enable users to:

1. **Add Entire GitHub Organizations:** Unlike the example website, which focuses only on individual repositories, your platform should display the cumulative star history for all repositories within a GitHub organization. For instance, to view the star history of the entire [Nixtla](https://github.com/Nixtla) organization, one should be able to input its URL directly, rather than adding each repository individually.

2. **Include Multiple Organizations/Repositories:** Users should be able to compare the star history of multiple organizations and repositories on a single dashboard, unlike the example website that limits comparison to individual repositories.

3. **Show Historical Download Stats:** The dashboard should also display historical download statistics for Python packages associated with the selected repositories or organizations, linking to sources like [pepy.tech](https://pepy.tech/). If a GitHub repository and its corresponding Python package have different names, the platform should appropriately indicate an error.

4. **Forecast Future Trends:** Incorporate our company’s forecasting API, TimeGPT, to predict future trends in star history and download statistics. Your dashboard should present both historical data and future forecasts generated using [our API](https://docs.nixtla.io/).


