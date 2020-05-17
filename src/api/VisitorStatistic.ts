import VisitorResult from "./VisitorResult.ts";

/**
 * Statistic of the whole week.
 */
export type VisitorWeekStatistic = {
    monday: VisitorDayStatistic,
    tuesday: VisitorDayStatistic,
    wednesday: VisitorDayStatistic,
    thursday: VisitorDayStatistic,
    friday: VisitorDayStatistic,
    saturday: VisitorDayStatistic,
    sunday: VisitorDayStatistic,
}

/**
 * the statistic of the day aggreted hourly.
 */
export type VisitorDayStatistic = {
    aggregatedVisitorStatatistic: Map<number, VisitorResult>
}
