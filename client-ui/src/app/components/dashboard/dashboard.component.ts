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
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import * as moment from 'moment';
import { Moment } from 'moment';
import { CustomStepDefinition, LabelType, Options } from 'ng5-slider';
import { FormGroupState, NgrxValueConverter } from 'ngrx-forms';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { ExecutionEventControllerService } from 'src/app/generated/services';
import { AppState } from 'src/app/model/app-state';
import * as ExecutionEventsActions from 'src/app/store/actions/execution-events.actions';
import { Router } from '@angular/router';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['dashboard.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit {
  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {
    this.formState$ = store.select('dashboardFilters')
  }


  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent

  offset = 0
  totalCount = 0
  rows: any[] = []
  filteredRows = this.rows
  timestampStart = "0"
  timestampEnd = "0"
  asAtTime = moment().valueOf()
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

        this.timestampStart = state.sliderRange[0]
        this.timestampEnd = state.sliderRange[1]
        this.offset = 0
        const params: ExecutionEventControllerService.ExecutionEventUsingGETParams = {
          timestampStart: this.timestampStart,
          timestampEnd: this.timestampEnd,
          asAtTime: this.asAtTime.toString(),
          offset: "0"
        }
        this.store.dispatch(new ExecutionEventsActions.Get(params))
      })

    this.store.select('executionEvents').subscribe(executionEvents => {
      if (executionEvents) {
        this.rows = executionEvents.elements[1]
        this.offset = executionEvents.offset
        this.totalCount = executionEvents.totalCount
      }

    })
  }

  public onSelect(event): void {
    const appId = event.selected[0].applicationId
    const datasource = event.selected[0].datasource
    document.location.href = `/app/lineage-overview/?path=${datasource}&applicationId=${appId}`
    //this.router.navigate(['app/lineage-overview'], { queryParams: { "path": datasource, "applicationId": appId } })
  }

  public setPage(pageInfo): void {
    this.offset = pageInfo.offset
    const params: ExecutionEventControllerService.ExecutionEventUsingGETParams = {
      timestampStart: this.timestampStart,
      timestampEnd: this.timestampEnd,
      asAtTime: this.asAtTime.toString(),
      offset: this.offset.toString()
    }
    this.store.dispatch(new ExecutionEventsActions.Get(params))
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

  public getFrameworkImg(frameworkName: String) {
    if (frameworkName.toLowerCase().includes('spark')) {
      return "data:image/png;base64,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"
    } else {
      return ""
    }
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
