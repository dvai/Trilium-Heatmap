# Trilium-Heatmap
Display a note modification heatmap in your Trilium note, just like the Github contributions heatmap!
![](./Trilium-Heatmap.png)
Powered by [d3.js](https://d3js.org/).

## Features
- Display a heatmap of note edits in Trilium.
- View the number of edits per day for each note.
- Click to navigate to the corresponding date.

## Installation
1. Download the zip file from the latest Releases.
2. In the Trilium note, right-click to import, select the zip file, uncheck "Safe import," and then click the "Import" button.
3. If you don't have any note data for the first use, you need to restart Trilium or press F5 to refresh the frontend.
4. Enjoy it!

## Tips
If you have a Trilium server, you can schedule it to run on the server periodically to reduce the number of database queries.

You can download or copy the [runOnServer.js](./runOnServer.js) file into a note of type "JS backend" in Trilium and add the following tags: `#run=hourly #runAtHour=2 #runOnInstance=sync_server`, where you need to replace "sync_server" with your Trilium instance.

Note: If you are using `runOnServer.js`, you need to disable the `setHistoryCount` script (remove the `#run=frontendStartup` label).
