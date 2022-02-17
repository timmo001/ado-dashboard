import axios, { AxiosBasicCredentials } from "axios";
import moment from "moment";

import {
  Iteration,
  ODataResponse,
  AnalyticsWorkItem,
  QueryWorkItem,
  WorkItem,
  Query,
  State,
  WorkItemExpanded,
  AnalyticsLeadCycleTime,
  IterationWorkItems,
  IterationWorkItemWorkItemRelation as IterationWorkItemRelation,
  WorkItemRevision,
} from "./types/azureDevOps";

export class AzureDevOps {
  private auth: AxiosBasicCredentials;
  private organization: string;
  private project: string;

  constructor(
    organization: string,
    project: string,
    personalAccessToken: string
  ) {
    this.auth = { username: personalAccessToken, password: "" };
    this.organization = organization;
    this.project = project;
  }

  async getAnalyticsLeadCycleTime(): Promise<Array<AnalyticsLeadCycleTime>> {
    const response = await axios.get<ODataResponse<AnalyticsLeadCycleTime>>(
      `https://analytics.dev.azure.com/${this.organization}/${
        this.project
      }/_odata/v3.0-preview/WorkItems?
      $filter=StateCategory eq 'Completed' and WorkItemType ne 'Task' and CompletedDateSK gt ${moment()
        .subtract(1, "years")
        .format("YYYY")}0101
      &$select=WorkItemId,Title,WorkItemType,State,Priority,Severity,TagNames,AreaSK,CycleTimeDays,LeadTimeDays,CompletedDateSK
      &$expand=AssignedTo($select=UserName),Iteration($select=IterationPath),Area($select=AreaPath)`,
      { auth: this.auth }
    );
    if (response.status == 200) return response.data.value;
    throw new Error(`Error: ${response.status} - ${response.data}`);
  }

  async getAnalyticsWorkItemsCurrentIteration(): Promise<
    Array<AnalyticsWorkItem>
  > {
    const response = await axios.get<ODataResponse<AnalyticsWorkItem>>(
      `https://analytics.dev.azure.com/${this.organization}/${this.project}/_odata/v3.0-preview/WorkItemSnapshot?$apply=filter(
          WorkItemType ne 'Task'
          and StateCategory ne 'Completed'
          and DateValue ge Iteration/StartDate
          and DateValue le Iteration/EndDate
          and Iteration/StartDate le now()
          and Iteration/EndDate ge now()
      )
      /groupby(
          (WorkItemId,Title,DateValue,State,WorkItemType,Priority,CreatedDate,Area/AreaPath,Iteration/IterationPath),
          aggregate($count as Count, StoryPoints with sum as TotalStoryPoints)
      )`,
      { auth: this.auth }
    );
    if (response.status == 200) return response.data.value;
    throw new Error(`Error: ${response.status} - ${response.data}`);
  }

  async getAnalyticsWorkItems(): Promise<Array<AnalyticsWorkItem>> {
    const response = await axios.get<ODataResponse<AnalyticsWorkItem>>(
      `https://analytics.dev.azure.com/${this.organization}/${
        this.project
      }/_odata/v3.0-preview/WorkItemSnapshot?
      $apply=filter(
          WorkItemType ne 'Task'
          and DateValue ge ${moment()
            .subtract(1, "months")
            .format("YYYY-MM-")}01
      )
      /groupby(
          (WorkItemId,Title,DateValue,State,WorkItemType,Priority,CreatedDate,Area/AreaPath,Iteration/IterationPath),
          aggregate($count as Count, StoryPoints with sum as TotalStoryPoints)
      )`,
      { auth: this.auth }
    );
    if (response.status == 200) {
      const data = response.data.value;
      return data.map((workItem: AnalyticsWorkItem) => ({
        ...workItem,
        daysSinceCreated: moment(workItem.DateValue).diff(
          moment(workItem.CreatedDate),
          "days"
        ),
      }));
    }
    throw new Error(`Error: ${response.status} - ${response.data}`);
  }

  async getIterations(): Promise<Array<Iteration>> {
    const response = await axios.get<ODataResponse<Iteration>>(
      `https://dev.azure.com/${this.organization}/${this.project}/_apis/work/teamsettings/iterations?api-version=6.0`,
      { auth: this.auth }
    );
    if (response.status == 200) return response.data.value;
    throw new Error(`Error: ${response.status} - ${response.data}`);
  }

  async getStates(): Promise<Array<State>> {
    const response = await axios.get<ODataResponse<State>>(
      `https://dev.azure.com/${this.organization}/_apis/work/processdefinitions/34fdcce2-ba28-43e9-99ec-a1f126565612/workItemTypes/TechnicalTeamAgileDevOps.UserStory/states?api-version=6.0`,
      { auth: this.auth }
    );
    if (response.status == 200) {
      const data = response.data.value;
      data.unshift({
        id: "abc123",
        name: "New",
        color: "b2b2b2",
        stateCategory: "New",
        order: 0,
        url: "",
      });
      data.push({
        id: "zyx987",
        name: "Closed",
        color: "339933",
        stateCategory: "Closed",
        order: 999,
        url: "",
      });
      return data;
    }
    throw new Error(`Error: ${response.status} - ${response.data}`);
  }

  async getIterationWorkItemIds(iterationId: string): Promise<Array<number>> {
    const response = await axios.get<IterationWorkItems>(
      `https://dev.azure.com/${this.organization}/${this.project}/_apis/work/teamsettings/iterations/${iterationId}/workItems?api-version=6.0`,
      { auth: this.auth }
    );
    if (response.status == 200)
      return response.data.workItemRelations.map(
        (wir: IterationWorkItemRelation) => wir.target.id
      );
    throw new Error(`Error: ${response.status} - ${response.data}`);
  }

  async getWorkItemIds(query: string): Promise<Array<number>> {
    const response = await axios.get<Query>(
      `https://dev.azure.com/${this.organization}/${this.project}/_apis/wit/wiql/${query}?api-version=6.0`,
      { auth: this.auth }
    );
    if (response.status == 200)
      return response.data.workItems.map(
        (queryWorkItem: QueryWorkItem) => queryWorkItem.id
      );
    throw new Error(`Error: ${response.status} - ${response.data}`);
  }

  async getWorkItems(ids: Array<number>): Promise<Array<WorkItemExpanded>> {
    const data: Array<WorkItemExpanded> = [];
    let i: number,
      j: number,
      idsChunked: any,
      chunk = 200,
      order = 0;
    for (i = 0, j = ids.length; i < j; i += chunk) {
      idsChunked = ids.slice(i, i + chunk);
      const response = await axios.get<ODataResponse<WorkItem>>(
        `https://dev.azure.com/${this.organization}/${
          this.project
        }/_apis/wit/workItems?ids=${idsChunked.join(",")}`,
        { auth: this.auth }
      );
      if (response.status == 200)
        data.push(
          ...response.data.value.map((workItem: WorkItem) => {
            order += 1;
            return {
              id: workItem.id,
              rev: workItem.rev,
              url: workItem.url,
              ...workItem.fields,
              iteration:
                workItem.fields["System.IterationPath"] ===
                "Small Change Technical Team"
                  ? "Backlog"
                  : workItem.fields["System.IterationPath"].replace(
                      "Small Change Technical Team\\",
                      ""
                    ),
              order: order,
            };
          })
        );
      else throw new Error(`Error: ${response.status} - ${response.data}`);
    }
    return data;
  }

  async updateWorkItem(
    id: number,
    workItemRevision: Array<WorkItemRevision>,
    validateOnly: boolean = false
  ): Promise<void> {
    console.log("updateWorkItem:", id, workItemRevision);
    const response = await axios.patch<WorkItem>(
      `https://dev.azure.com/${this.organization}/${this.project}/_apis/wit/workItems/${id}?api-version=6.0&validateOnly=${validateOnly}`,
      workItemRevision,
      {
        auth: this.auth,
        headers: {
          "Content-Type": "application/json-patch+json",
        },
      }
    );
    if (response.status === 200) {
      console.log("Response: ", response.status, response.data);
    } else throw new Error(`Error: ${response.status} - ${response.data}`);
  }
}
