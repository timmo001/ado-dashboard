import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import moment from "moment";

import { WorkItemExpanded } from "./types/azureDevOps";

export class XLSXExport {
  generateReleaseChecklist(workItems: Array<WorkItemExpanded>): void {
    const items = workItems.map((wi: WorkItemExpanded) => ({
      ID: wi.id,
      Title: wi["System.Title"],
      Tags: wi["System.Tags"],
      Status: wi["System.State"],
      Components: wi["Custom.Components"],
      Functions: wi["Custom.Functions"],
      "Export List": wi["Custom.ExportList"],
      Tables: wi["Custom.Tables"],
      Fields: wi["Custom.Fields"],
      Scripts: wi["Custom.Scripts"],
      Files: wi["Custom.Fields"],
      Misc: wi["Custom.Misc"],
      "Release Details": wi["Custom.ReleaseDetails"],
      "Backed up": "",
      "Deployed to Pre-Prod": "",
      "Deployed to Live": "",
      "Deployed to Training": "",
      Notes: "",
    }));
    console.log("generateReleaseChecklist:", items);

    const worksheet = XLSXUtils.json_to_sheet(items);
    worksheet["!cols"] = [
      { width: 6 },
      { width: 120 },
      { width: 30 },
      { width: 20 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 40 },
    ];
    const workbook = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(workbook, worksheet, "Release Checklist");

    XLSXWriteFile(
      workbook,
      `Release Checklist - ${workItems[0].iteration} - ${moment().format(
        "YYYY-MM-DD"
      )}.xls`,
      {
        type: "binary",
        bookType: "xls",
      }
    );
  }
}
