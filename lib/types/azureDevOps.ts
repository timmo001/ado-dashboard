export interface ODataResponse<T> {
  "@odata.context": string;
  count?: number;
  value: Array<T>;
}

// Analytics
export interface AnalyticsLeadCycleTime {
  WorkItemId: number;
  LeadTimeDays: number;
  CycleTimeDays: number;
  CompletedDateSK: number;
  AreaSK: string;
  Title: string;
  WorkItemType: string;
  State: string;
  Priority: number;
  Severity: null;
  TagNames: null;
  AssignedTo: AnalyticsAssignedTo;
  Iteration: AnalyticsWorkItemIteration;
  Area: AnalyticsWorkItemArea;
}

export interface AnalyticsWorkItem {
  "@odata.id": string;
  CreatedDate: string;
  Priority: number;
  WorkItemType: string;
  State: string;
  DateValue: Date;
  Title: string;
  WorkItemId: number;
  TotalStoryPoints: number;
  Count: number;
  Iteration: AnalyticsWorkItemIteration;
  Area: AnalyticsWorkItemArea;
  daysSinceCreated: number;
}

export interface AnalyticsWorkItemArea {
  "@odata.id": string;
  AreaPath: string;
}

export interface AnalyticsWorkItemIteration {
  "@odata.id": string;
  IterationPath: string;
}

export interface AnalyticsAssignedTo {
  UserName: string;
}

// Iteration
export interface Iteration {
  id: string;
  name: string;
  path: string;
  attributes: IterationAttributes;
  url: string;
}

export interface IterationAttributes {
  startDate: string;
  finishDate: string;
  timeFrame: string;
}

// Iteration Work Items
export interface IterationWorkItems {
  workItemRelations: Array<IterationWorkItemWorkItemRelation>;
  url: string;
  _links: IterationWorkItemsLinks;
}

export interface IterationWorkItemsLinks {
  self: IterationWorkItemsProject;
  project: IterationWorkItemsProject;
  team: IterationWorkItemsProject;
  teamIteration: IterationWorkItemsProject;
}

export interface IterationWorkItemsProject {
  href: string;
}

export interface IterationWorkItemWorkItemRelation {
  rel: null;
  source: null;
  target: IterationWorkItemWorkItemTarget;
}

export interface IterationWorkItemWorkItemTarget {
  id: number;
  url: string;
}

// State
export interface State {
  id: string;
  name: string;
  color: string;
  stateCategory: string;
  order: number;
  url: string;
  hidden?: boolean;
}

// Query
export interface Query {
  queryType: string;
  queryResultType: string;
  asOf: Date;
  columns: QueryColumn[];
  sortColumns: QuerySortColumn[];
  workItems: QueryWorkItem[];
}

export interface QueryColumn {
  referenceName: string;
  name: string;
  url: string;
}

export interface QuerySortColumn {
  field: QueryColumn;
  descending: boolean;
}

export interface QueryWorkItem {
  id: number;
  url: string;
}

// Work Item
export interface WorkItem {
  id: number;
  rev: number;
  fields: WorkItemFields;
  url: string;
}

export interface WorkItemExpanded extends WorkItemFields {
  id: number;
  rev: number;
  url: string;
  iteration: string;
  order: number;
}

export interface WorkItemFields {
  "System.AreaPath": string;
  "System.TeamProject": string;
  "System.IterationPath": string;
  "System.WorkItemType": string;
  "System.State": string;
  "System.Reason": string;
  "System.CreatedDate": Date;
  "System.CreatedBy": User;
  "System.ChangedDate": Date;
  "System.ChangedBy": User;
  "System.CommentCount": number;
  "System.Title": string;
  "System.BoardColumn": string;
  "System.BoardColumnDone": boolean;
  "Microsoft.VSTS.Scheduling.StoryPoints"?: number;
  "Microsoft.VSTS.Common.StateChangeDate": Date;
  "Microsoft.VSTS.Common.ActivatedDate"?: Date;
  "Microsoft.VSTS.Common.ActivatedBy"?: User;
  "Microsoft.VSTS.Common.Priority": number;
  "Microsoft.VSTS.Common.StackRank": number;
  "Microsoft.VSTS.Common.ValueArea": string;
  "Microsoft.VSTS.CMMI.Blocked"?: string;
  "WEF_A32D92E82F644A1991D91FEFDC607DC1_Kanban.Column": string;
  "WEF_A32D92E82F644A1991D91FEFDC607DC1_Kanban.Column.Done": boolean;
  "System.Description": string;
  "Custom.Components"?: string;
  "Custom.ExportList"?: string;
  "Custom.Fields"?: string;
  "Custom.Files"?: string;
  "Custom.Functions"?: string;
  "Custom.Misc"?: string;
  "Custom.ReleaseDetails"?: string;
  "Custom.Scripts"?: string;
  "Custom.Source"?: string;
  "Custom.Tables"?: string;
  "System.Tags": string;
  "System.AssignedTo"?: User;
  "Microsoft.VSTS.Common.ResolvedDate"?: Date;
  "Microsoft.VSTS.Common.ResolvedBy"?: User;
  "Microsoft.VSTS.Common.ClosedDate"?: Date;
  "Microsoft.VSTS.Common.ClosedBy"?: User;
  "Microsoft.VSTS.Common.Severity"?: string;
  "Microsoft.VSTS.TCM.ReproSteps"?: string;
}

export interface User {
  displayName: string;
  url: string;
  _links: UserLinks;
  id: string;
  uniqueName: string;
  imageUrl: string;
  descriptor: string;
}

export interface UserLinks {
  avatar: UserAvatar;
}

export interface UserAvatar {
  href: string;
}

// Work Item Revision
export interface WorkItemRevision {
  op: string;
  path: string;
  value: string;
}
