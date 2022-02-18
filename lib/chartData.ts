import moment from "moment";

import {
  AnalyticsLeadCycleTime,
  AnalyticsWorkItem,
  State,
} from "./types/azureDevOps";
import { groupByKey } from "./util";

export function getChartAnalyticsWorkItemsCurrentIteration(
  analyticsWorkItemsCurrentIteration: Array<AnalyticsWorkItem>
): Array<{ [key: string]: string | number }> | undefined {
  if (!analyticsWorkItemsCurrentIteration) return undefined;
  const dates = groupByKey<AnalyticsWorkItem>(
    analyticsWorkItemsCurrentIteration.sort(
      (a: AnalyticsWorkItem, b: AnalyticsWorkItem) =>
        a.DateValue > b.DateValue ? 1 : -1
    ),
    "DateValue"
  );
  return Object.keys(dates).map((date: string) => {
    let value = {
      Date: moment(date).format("Do MMM YYYY"),
    };
    const itemsByStates = groupByKey<AnalyticsWorkItem>(dates[date], "State");
    Object.keys(itemsByStates).forEach((state: string) => {
      value[state] = itemsByStates[state].length;
    });
    return value;
  });
}

export function getChartAnalyticsWorkItems(
  analyticsWorkItems: Array<AnalyticsWorkItem>,
  states: Array<State>
): Array<{ [key: string]: string | number }> | undefined {
  if (!analyticsWorkItems || !states) return undefined;
  const dates = groupByKey<AnalyticsWorkItem>(
    analyticsWorkItems
      .filter(
        (workItem: AnalyticsWorkItem) =>
          workItem.State !== "Removed" && workItem.State !== "Closed"
      )
      .sort((a: AnalyticsWorkItem, b: AnalyticsWorkItem) =>
        a.DateValue > b.DateValue ? 1 : -1
      ),
    "DateValue"
  );
  return Object.keys(dates).map((date: string) => {
    let value = {
      Date: moment(date).format("Do MMM YYYY"),
    };
    const itemsByStates = groupByKey<AnalyticsWorkItem>(dates[date], "State");
    Object.keys(itemsByStates).forEach((state: string) => {
      if (!value[state]) value[state] = 0;
      value[state] += itemsByStates[state].length;
    });
    return value;
  });
}

export function getChartAnalyticsWorkItemsAge(
  analyticsWorkItems: Array<AnalyticsWorkItem>,
  states: Array<State>
): Array<{ [key: string]: string | number }> | undefined {
  if (!analyticsWorkItems || !states) return undefined;
  const dates = groupByKey<AnalyticsWorkItem>(
    analyticsWorkItems
      .filter(
        (workItem: AnalyticsWorkItem) =>
          workItem.State !== "Removed" && workItem.State !== "Closed"
      )
      .sort((a: AnalyticsWorkItem, b: AnalyticsWorkItem) =>
        a.DateValue > b.DateValue ? 1 : -1
      ),
    "DateValue"
  );
  return Object.keys(dates).map((date: string) => {
    let value = {
      Date: moment(date).format("Do MMM YYYY"),
    };
    const sum: number = dates[date].reduce(
      (a: number, b: AnalyticsWorkItem) => a + b.daysSinceCreated,
      0
    );
    const avg: number = sum / dates[date].length || 0;
    value["Average Age"] = avg;
    value["Total Age"] = sum;

    const itemsByStates = groupByKey<AnalyticsWorkItem>(dates[date], "State");
    Object.keys(itemsByStates).forEach((state: string) => {
      const sumState: number = itemsByStates[state].reduce(
        (a: number, b: AnalyticsWorkItem) => a + b.daysSinceCreated,
        0
      );
      const avgState: number = sumState / itemsByStates[state].length || 0;
      value[`${state} Average Age`] = avgState;
      value[`${state} Total Age`] = sumState;
    });
    return value;
  });
}

export function getChartAnalyticsLeadCycleTime(
  analyticsLeadCycleTime: Array<AnalyticsLeadCycleTime>
): Array<{ [key: string]: string | number }> | undefined {
  if (!analyticsLeadCycleTime) return undefined;
  const dates = groupByKey<AnalyticsLeadCycleTime>(
    analyticsLeadCycleTime,
    "CompletedDateSK"
  );
  return Object.keys(dates).map((date: string) => {
    const sumCycleTime: number = dates[date].reduce(
      (a: number, b: AnalyticsLeadCycleTime) => a + b.CycleTimeDays,
      0
    );
    const avgCycleTime: number = sumCycleTime / dates[date].length || 0;

    const sumLeadTime: number = dates[date].reduce(
      (a: number, b: AnalyticsLeadCycleTime) => a + b.LeadTimeDays,
      0
    );
    const avgLeadTime: number = sumLeadTime / dates[date].length || 0;

    let value = {
      Date: moment(date).format("Do MMM YYYY"),
      "Average Cycle Time": avgCycleTime,
      "Total Cycle Time": sumCycleTime,
      "Average Lead Time": avgLeadTime,
      "Total Lead Time": sumLeadTime,
    };
    return value;
  });
}
