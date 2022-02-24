import axios, { AxiosBasicCredentials, AxiosResponse } from "axios";
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
  Process,
  ProcessWorkItemType,
  Project,
  ProcessWorkItemTypeExtended,
  ClassificationNode,
  AreaPath,
  StructureType,
  ClassificationNodeChild,
} from "./types/azureDevOps";

export class AzureDevOps {
  private auth: AxiosBasicCredentials;
  private organization: string;
  private project: string;

  constructor(
    personalAccessToken: string,
    organization: string,
    project?: string
  ) {
    this.auth = { username: personalAccessToken, password: "" };
    this.organization = organization;
    this.project = project;
  }

  async get<T>(url: string): Promise<AxiosResponse<T, any>> {
    try {
      return await axios.get<T>(url, { auth: this.auth });
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  }

  async patch<T>(url: string, data: unknown): Promise<AxiosResponse<T, any>> {
    try {
      return await axios.patch<T>(url, data, {
        auth: this.auth,
        headers: {
          "Content-Type": "application/json-patch+json",
        },
      });
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  }

  async post<T>(url: string, data: unknown): Promise<AxiosResponse<T, any>> {
    try {
      return await axios.post<T>(url, data, {
        auth: this.auth,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  }

  async getAnalyticsLeadCycleTime(): Promise<Array<AnalyticsLeadCycleTime>> {
    const response = await this.get<ODataResponse<AnalyticsLeadCycleTime>>(
      `https://analytics.dev.azure.com/${this.organization}/${
        this.project
      }/_odata/v3.0-preview/WorkItems?
      $filter=StateCategory eq 'Completed' and WorkItemType ne 'Task' and CompletedDateSK gt ${moment()
        .subtract(1, "years")
        .format("YYYY")}0101
      &$select=WorkItemId,Title,WorkItemType,State,Priority,Severity,TagNames,AreaSK,CycleTimeDays,LeadTimeDays,CompletedDateSK
      &$expand=AssignedTo($select=UserName),Iteration($select=IterationPath),Area($select=AreaPath)`
    );
    if (response.status == 200) return response.data.value;
    throw new Error(`Error: ${response.status} - ${response.data}`);
  }

  async getAnalyticsWorkItemsCurrentIteration(): Promise<
    Array<AnalyticsWorkItem>
  > {
    const response = await this.get<ODataResponse<AnalyticsWorkItem>>(
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
      )`
    );
    if (response.status == 200) return response.data.value;
    throw new Error(`Error: ${response.status} - ${response.data}`);
  }

  async getAnalyticsWorkItems(): Promise<Array<AnalyticsWorkItem>> {
    const response = await this.get<ODataResponse<AnalyticsWorkItem>>(
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
      )`
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
    const response = await this.get<ODataResponse<Iteration>>(
      `https://dev.azure.com/${this.organization}/${this.project}/_apis/work/teamsettings/iterations?api-version=6.0`
    );
    if (response.status == 200) {
      const data = response.data.value;
      data.unshift({
        id: "",
        name: "Backlog",
        path: data[0]?.path.substring(0, data[0].path.indexOf("\\")),
        attributes: {
          startDate: "",
          finishDate: "",
          timeFrame: "never",
        },
        url: "",
      });
      return data;
    }
    throw new Error(`Error: ${response.status} - ${response.data}`);
  }

  async getProjects(): Promise<Array<Project>> {
    const response = await this.get<ODataResponse<Project>>(
      `https://dev.azure.com/${this.organization}/_apis/projects?api-version=6.0`
    );
    if (response.status == 200) return response.data.value;
    throw new Error(`Error: ${response.status} - ${response.data}`);
  }

  async getProject(): Promise<Project> {
    const response = await this.get<Project>(
      `https://dev.azure.com/${this.organization}/_apis/projects/${this.project}?api-version=6.0&includeCapabilities=true`
    );
    if (response.status == 200) return response.data;
    throw new Error(`Error: ${response.status} - ${response.data}`);
  }

  getChildPath(node: ClassificationNodeChild): Array<AreaPath> {
    let childPaths: Array<AreaPath> = [];
    if (node.structureType === StructureType.Area) {
      childPaths.push({
        id: node.id,
        name: node.name,
        path: node.path.substring(1).replace("\\Area", ""),
        url: node.url,
      });
      if (node.hasChildren && node.children.length > 0) {
        for (const childNode of node.children) {
          childPaths = childPaths.concat(this.getChildPath(childNode));
        }
      }
    }
    return childPaths;
  }

  async getAreaPaths(): Promise<Array<AreaPath>> {
    const response = await this.get<ODataResponse<ClassificationNode>>(
      `https://dev.azure.com/${this.organization}/${this.project}/_apis/wit/classificationnodes?$depth=8&api-version=6.0`
    );
    if (response.status == 200) {
      let paths: Array<AreaPath> = [];
      for (const node of response.data.value) {
        paths = paths.concat(this.getChildPath(node));
      }
      return paths;
    }
    throw new Error(`Error: ${response.status} - ${response.data}`);
  }

  async getProcesses(): Promise<Array<Process>> {
    const response = await this.get<ODataResponse<Process>>(
      `https://dev.azure.com/${this.organization}/_apis/process/processes?api-version=6.0`
    );
    if (response.status == 200) return response.data.value;
    throw new Error(`Error: ${response.status} - ${response.data}`);
  }
  async getProcess(processId: string): Promise<Process> {
    const response = await this.get<Process>(
      `https://dev.azure.com/${this.organization}/_apis/process/processes/${processId}?api-version=6.0`
    );
    if (response.status == 200) return response.data;
    throw new Error(`Error: ${response.status} - ${response.data}`);
  }

  async getProcessTypes(
    processId: string
  ): Promise<Array<ProcessWorkItemType>> {
    const response = await this.get<ODataResponse<ProcessWorkItemType>>(
      `https://dev.azure.com/${this.organization}/_apis/work/processdefinitions/${processId}/workItemTypes?api-version=6.0`
    );
    if (response.status == 200) return response.data.value;
    throw new Error(`Error: ${response.status} - ${response.data}`);
  }

  async getStates(
    processId: string,
    processWorkItemTypeId: string
  ): Promise<Array<State>> {
    const response = await this.get<ODataResponse<State>>(
      `https://dev.azure.com/${this.organization}/_apis/work/processdefinitions/${processId}/workItemTypes/${processWorkItemTypeId}/states?api-version=6.0`
    );
    if (response.status == 200) {
      const data = response.data.value;
      data.unshift({
        id: "abc000",
        name: "New",
        color: "eeeeee",
        stateCategory: "New",
        order: 0,
        url: "",
      });
      data.push({
        id: "zyx987",
        name: "Closed",
        color: "339933",
        stateCategory: "Completed",
        order: 999,
        url: "",
      });
      return data.filter((state: State) => !state.hidden);
    }
    throw new Error(`Error: ${response.status} - ${response.data}`);
  }

  async getStatesFromProject(): Promise<{
    states: Array<State>;
    processWorkItemTypes: Array<ProcessWorkItemTypeExtended>;
  }> {
    const proj: Project = await this.getProject();
    const process: Process = await this.getProcess(
      proj.capabilities.processTemplate.templateTypeId
    );

    let s: Array<State> = [];
    let pwts: Array<ProcessWorkItemTypeExtended> = [];
    for (const processWorkItemType of await this.getProcessTypes(process.id)) {
      for (const state of await this.getStates(
        process.id,
        processWorkItemType.id
      )) {
        const sId = s.findIndex((st: State) => st.name === state.name);
        if (sId < 0)
          s.push({
            ...state,
            order:
              state.stateCategory === "Completed"
                ? Number(`9${state.order}`)
                : state.order,
          });
        else if (processWorkItemType.name === "User Story") s[sId] = state;

        const pwtId = pwts.findIndex(
          (pwt: ProcessWorkItemTypeExtended) =>
            pwt.id === processWorkItemType.id
        );
        if (pwtId < 0)
          pwts.push({
            ...processWorkItemType,
            process,
            states: [state],
          });
        else pwts[pwtId].states.push(state);
      }
    }
    return {
      states: s.sort((a: State, b: State) => (a.order > b.order ? 1 : -1)),
      processWorkItemTypes: pwts,
    };
  }

  async getIterationWorkItemIds(iterationId: string): Promise<Array<number>> {
    const response = await this.get<IterationWorkItems>(
      `https://dev.azure.com/${this.organization}/${this.project}/_apis/work/teamsettings/iterations/${iterationId}/workItems?api-version=6.0`
    );
    if (response.status == 200)
      return response.data.workItemRelations.map(
        (wir: IterationWorkItemRelation) => wir.target.id
      );
    throw new Error(`Error: ${response.status} - ${response.data}`);
  }

  async getWorkItemIds(
    areaPath: string = this.project,
    removeClosed: boolean = false,
    removeRemoved: boolean = false,
    removeDone: boolean = false
  ): Promise<Array<number>> {
    const response = await this.post<Query>(
      `https://dev.azure.com/${this.organization}/${this.project}/_apis/wit/wiql?api-version=6.0`,
      {
        query: `Select [System.Id] From WorkItems Where [System.TeamProject] = '${
          this.project
        }' AND [System.AreaPath] = '${areaPath}' ${
          removeClosed ? "AND [State] <> 'Closed'" : ""
        } ${removeRemoved ? "AND [State] <> 'Removed'" : ""} ${
          removeDone ? "AND [State] <> 'Done'" : ""
        }`,
      }
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
      const response = await this.get<ODataResponse<WorkItem>>(
        `https://dev.azure.com/${this.organization}/${
          this.project
        }/_apis/wit/workItems?ids=${idsChunked.join(",")}`
      );
      if (response.status == 200)
        data.push(
          ...response.data.value.map((workItem: WorkItem) => {
            order += 1;
            const iterationIndex =
              workItem.fields["System.IterationPath"].indexOf("\\");
            return {
              id: workItem.id,
              rev: workItem.rev,
              url: workItem.url,
              ...workItem.fields,
              iteration:
                iterationIndex > -1
                  ? workItem.fields["System.IterationPath"].substring(
                      iterationIndex + 1
                    )
                  : "Backlog",
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
    const response = await this.patch<WorkItem>(
      `https://dev.azure.com/${this.organization}/${this.project}/_apis/wit/workItems/${id}?api-version=6.0&validateOnly=${validateOnly}`,
      workItemRevision
    );
    if (response.status === 200) {
      console.log("Response: ", response.status, response.data);
    } else throw new Error(`Error: ${response.status} - ${response.data}`);
  }
}
