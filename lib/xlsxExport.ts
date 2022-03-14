import { saveAs } from "file-saver";
import { Workbook } from "exceljs";
import moment from "moment";

import { CustomFieldMap } from "components/WorkItems";
import { WorkItemExpanded } from "lib/types/azureDevOps";

export class XLSXExport {
  generateReleaseChecklist(
    workItems: Array<WorkItemExpanded>,
    customFieldMap: CustomFieldMap
  ): void {
    // Remove any custom "blocked" fields
    for (const key of Object.keys(customFieldMap))
      if (key.toLowerCase().includes("block")) delete customFieldMap[key];

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
      ...Object.values(customFieldMap).map((item) => ({
        key: item.title,
        width: 60,
      })),
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
        ...Object.keys(customFieldMap).map((key: string) =>
          typeof wi[key] === "string"
            ? String(wi[key]).replace(/<[^>]*>?/gm, "")
            : wi[key]
        ),
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
          ...Object.values(customFieldMap).map((value) => ({
            name: value.title,
            filterButton: true,
          })),
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
