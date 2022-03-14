import { saveAs } from "file-saver";
import { Workbook } from "exceljs";
import moment from "moment";

import { WorkItemExpanded } from "./types/azureDevOps";

export class XLSXExport {
  generateReleaseChecklist(workItems: Array<WorkItemExpanded>): void {
    const workbook = new Workbook();

    workbook.title = `Release Checklist - ${
      workItems[0].iteration
    } - ${moment().format("YYYY-MM-DD")}`;

    const worksheet = workbook.addWorksheet("Release Checklist");

    worksheet.columns = [
      {
        key: "ID",
        width: 8,
      },
      {
        key: "Title",
        width: 100,
      },
      {
        key: "Tags",
        width: 20,
      },
      {
        key: "Status",
        width: 20,
      },
      {
        key: "Components",
        width: 24,
      },
      {
        key: "Functions",
        width: 24,
      },
      {
        key: "Export List",
        width: 24,
      },
      {
        key: "Tables",
        width: 24,
      },
      {
        key: "Fields",
        width: 24,
      },
      {
        key: "Scripts",
        width: 24,
      },
      {
        key: "Files",
        width: 24,
      },
      {
        key: "Misc",
        width: 40,
        alignment: { wrapText: true },
      },
      {
        key: "Release Details",
        width: 60,
        alignment: { wrapText: true },
      },
      {
        key: "Backed up",
        width: 18,
      },
      {
        key: "Deployed to Pre-Production",
        width: 28,
      },
      {
        key: "Deployed to Production",
        width: 28,
      },
      {
        key: "Deployed to Training",
        width: 28,
      },
      {
        key: "Notes",
        width: 80,
      },
    ];

    const rows = [];
    for (const wi of workItems)
      rows.push([
        wi.id,
        wi["System.Title"],
        wi["System.Tags"],
        wi["System.State"],
        wi["Custom.Components"],
        wi["Custom.Functions"],
        wi["Custom.ExportList"],
        wi["Custom.Tables"],
        wi["Custom.Fields"],
        wi["Custom.Scripts"],
        wi["Custom.Fields"],
        wi["Custom.Misc"],
        wi["Custom.ReleaseDetails"],
        "",
        "",
        "",
        "",
        "",
      ]);

    worksheet
      .addTable({
        name: "Release_Checklist",
        ref: "A1",
        headerRow: true,
        style: {
          theme: "TableStyleMedium16",
          showRowStripes: true,
        },
        columns: [
          { name: "ID", filterButton: true },
          { name: "Title", filterButton: true },
          { name: "Tags", filterButton: true },
          { name: "Status", filterButton: true },
          { name: "Components", filterButton: true },
          { name: "Functions", filterButton: true },
          { name: "Export List", filterButton: true },
          { name: "Tables", filterButton: true },
          { name: "Fields", filterButton: true },
          { name: "Scripts", filterButton: true },
          { name: "Files", filterButton: true },
          { name: "Misc", filterButton: true },
          { name: "Release Details", filterButton: false },
          { name: "Backed up", filterButton: true },
          { name: "Deployed to Pre-Production", filterButton: true },
          { name: "Deployed to Production", filterButton: true },
          { name: "Deployed to Training", filterButton: true },
          { name: "Notes", filterButton: false },
        ],
        rows,
      })
      .commit();

    // Additional Formatting
    console.log("Cells", `A2:R${worksheet.rowCount}`);
    const cells = worksheet.getCell(`A2:R${worksheet.rowCount}`);
    cells.alignment = { wrapText: true, shrinkToFit: true };
    worksheet.getRow(0).height = 20;
    for (const row of worksheet.getRows(1, worksheet.rowCount)) row.height = 24;

    workbook.xlsx.writeBuffer().then((buffer: Buffer) => {
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `${workbook.title}.xlsx`
      );
    });
  }
}
