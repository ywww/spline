/*
 * Copyright 2019 ABSA Group Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { Moment } from 'moment';
import { CustomStepDefinition, LabelType, Options } from 'ng5-slider';
import { FormGroupState, NgrxValueConverter } from 'ngrx-forms';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { AppState } from 'src/app/model/app-state';
import { DatatableComponent } from '@swimlane/ngx-datatable';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['dashboard.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit {

  tablePageSize: number = 10

  rows = [
    { frameworkName: 'Spark', applicationName: 'Conformance', applicationId: '1', timestamp: '1565190853101', datasource: 'hdfs://blabla/bloblo', datasourceType: 'csv', writeMode: 'append' },
    { frameworkName: 'Spark', applicationName: 'Standarisation', applicationId: '1', timestamp: '1565190853101', datasource: 'hdfs://test', datasourceType: 'parquet', writeMode: '' },
    { frameworkName: 'Spark', applicationName: 'Conformance', applicationId: '2', timestamp: '1565190853101', datasource: 'hdfs://blabla/bloblo', datasourceType: 'csv', writeMode: 'append' },
    { frameworkName: 'Spark', applicationName: 'Standarisation', applicationId: '2', timestamp: '1565190853101', datasource: 'hdfs://test', datasourceType: 'parquet', writeMode: '' },
    { frameworkName: 'Spark', applicationName: 'Conformance', applicationId: '3', timestamp: '1565190853101', datasource: 'hdfs://blabla/bloblo', datasourceType: 'csv', writeMode: 'append' },
    { frameworkName: 'Spark', applicationName: 'Standarisation', applicationId: '3', timestamp: '1565190853101', datasource: 'hdfs://test', datasourceType: 'parquet', writeMode: '' },
    { frameworkName: 'Spark', applicationName: 'Conformance', applicationId: '4', timestamp: '1565190853101', datasource: 'hdfs://blabla/bloblo', datasourceType: 'csv', writeMode: 'append' },
    { frameworkName: 'Spark', applicationName: 'Standarisation', applicationId: '4', timestamp: '1565190853101', datasource: 'hdfs://test', datasourceType: 'parquet', writeMode: '' },
    { frameworkName: 'Spark', applicationName: 'Conformance', applicationId: '5', timestamp: '1565190853101', datasource: 'hdfs://blabla/bloblo', datasourceType: 'csv', writeMode: 'append' },
    { frameworkName: 'Spark', applicationName: 'Standarisation', applicationId: '5', timestamp: '1565190853101', datasource: 'hdfs://test', datasourceType: 'parquet', writeMode: 'append' },
    { frameworkName: 'Spark', applicationName: 'Conformance', applicationId: '6', timestamp: '1565190853101', datasource: 'hdfs://blabla/bloblo', datasourceType: 'csv', writeMode: '' },
    { frameworkName: 'Spark', applicationName: 'Standarisation', applicationId: '6', timestamp: '1565190853101', datasource: 'hdfs://test', datasourceType: 'parquet', writeMode: 'append' },
    { frameworkName: 'Spark', applicationName: 'Conformance', applicationId: '7', timestamp: '1565190853101', datasource: 'hdfs://blabla/bloblo', datasourceType: 'csv', writeMode: '' },
    { frameworkName: 'Spark', applicationName: 'Standarisation', applicationId: '7', timestamp: '1565190853101', datasource: 'hdfs://test', datasourceType: 'parquet', writeMode: 'append' },
  ];
  filteredRows = this.rows;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent

  formState$: Observable<FormGroupState<any>>

  maxRange: Moment = moment().add(1, 'M')

  options: Options = {
    stepsArray: this.createStepArray(),
    translate: (value: number, label: LabelType): string => {
      return moment(value).format('DD/MM/YYYY, h:mm:ss A')
    },
    showTicks: true
  }


  rangeConverter = {
    convertViewToStateValue: dates => {
      return dates.map(d => this.dateConverter.convertViewToStateValue(d))
    },
    convertStateToViewValue: timestamps => {
      return timestamps.map(t => this.dateConverter.convertStateToViewValue(t))
    }
  } as NgrxValueConverter<Date[], number[]>

  dateConverter = {
    convertViewToStateValue: date => {
      return date.getTime()
    },
    convertStateToViewValue: timestamp => {
      return moment(timestamp).toDate()
    }
  } as NgrxValueConverter<Date, number>

  constructor(private store: Store<AppState>) {
    this.formState$ = store.select('dashboardFilters')
  }

  ngOnInit(): void {
    this.store
      .select('dashboardFilters', 'dashboardFilters', 'value', 'dateRange')
      .pipe(
        filter(state => state !== null && state !== undefined)
      )
      .subscribe(dateRange => {
        this.updateDateRange(moment(dateRange[0]).toDate(), moment(dateRange[1]).toDate())
      })

    this.store
      .select('dashboardFilters', 'dashboardFilters', 'value', 'minDate')
      .pipe(
        switchMap(minDate => {
          return this.store
            .select('dashboardFilters', 'dashboardFilters', 'value', 'sliderRange')
            .pipe(
              map(sliderRange => {
                return { sliderRange: sliderRange, minDate: minDate }
              })
            )
        }),
        switchMap(state => {
          return this.store
            .select('dashboardFilters', 'dashboardFilters', 'value', 'maxDate')
            .pipe(
              map(maxDate => {
                return { sliderRange: state.sliderRange, minDate: state.minDate, maxDate: maxDate }
              })
            )
        })
      )
      .subscribe(state => {
        this.updateTimestamp(state.sliderRange[0], state.minDate)
        this.updateTimestamp(state.sliderRange[1], state.maxDate)
      })
  }

  public updateFilter(event) {
    const value = event.target.value.toLowerCase();
    const filtered = this.filteredRows.filter(function (d) {
      return d.frameworkName.toLowerCase().indexOf(value) !== -1
        || d.applicationName.toLowerCase().indexOf(value) !== -1
        || d.applicationId.toLowerCase().indexOf(value) !== -1
        || d.timestamp.toLowerCase().indexOf(value) !== -1
        || d.datasource.toLowerCase().indexOf(value) !== -1
        || d.datasourceType.toLowerCase().indexOf(value) !== -1
        || d.writeMode.toLowerCase().indexOf(value) !== -1
        || !value
    })
    this.rows = filtered
    this.table.offset = 0
  }


  private createStepArray(startDate?: Date, endDate?: Date): CustomStepDefinition[] {
    const timestampSteps: number[] = []
    const start: Moment = startDate ? moment(startDate) : moment()
    const end: Moment = endDate ? startDate.valueOf() == endDate.valueOf() ? moment(endDate).add(2, 'days') : moment(endDate).add(1, 'days') : this.maxRange
    for (let m = start; m.isBefore(end); m.add(1, 'days')) {
      timestampSteps.push(m.valueOf())
    }

    const stepArray = timestampSteps.map((timestamp: number) => {
      if (moment(timestamp).format('DD') == "01") {
        return { value: timestamp, legend: `${moment(timestamp).format('DD')} \n ${moment(timestamp).format('MMMM')}` }
      }
      if (timestampSteps.length < 120) {
        return { value: timestamp, legend: moment(timestamp).format('DD') }
      } else {
        return { value: timestamp }
      }
    })
    return stepArray
  }

  private updateTimestamp(timestampStepValue: number, newTimestamp: number): void {
    const indexToChange: number = this.options.stepsArray.findIndex(x => moment(x.value).format('LL') === moment(timestampStepValue).format('LL'))
    if (this.options.stepsArray[indexToChange]) {
      const replacementItem: CustomStepDefinition = { value: newTimestamp, legend: this.options.stepsArray[indexToChange].legend }
      const newSteps = Object.assign([], this.options.stepsArray, { [indexToChange]: replacementItem })
      const newOptions: Options = Object.assign({}, this.options)
      newOptions.stepsArray = newSteps
      this.options = newOptions
    }
  }

  private updateDateRange(startDate: Date, endDate: Date): void {
    const newOptions: Options = Object.assign({}, this.options)
    newOptions.stepsArray = this.createStepArray(startDate, endDate)
    this.options = newOptions
  }

}
