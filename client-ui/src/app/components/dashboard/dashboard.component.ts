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
import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { Options, LabelType, CustomStepDefinition } from 'ng5-slider';
import { FormGroup, FormControl } from '@angular/forms';
import { Moment } from 'moment';
import * as _ from 'lodash';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.less']
})
export class DashboardComponent implements OnInit {

  maxRange: Moment = moment().add(1, 'M')

  options: Options = {
    stepsArray: this.createStepArray(),
    translate: (value: number, label: LabelType): string => {
      return moment(value).format('DD/MM/YYYY, h:mm:ss A')
    },
    showTicks: true,
    enforceStep: false,
    enforceRange: false
  }

  formGroup = new FormGroup({
    sliderControl: new FormControl([this.options.stepsArray[0].value, this.options.stepsArray[1].value]),
    range: new FormControl([moment(this.options.stepsArray[0].value).toDate(), moment(this.options.stepsArray[1].value).toDate()]),
    minTimePicker: new FormControl(moment(this.options.stepsArray[0].value).toDate()),
    maxTimePicker: new FormControl(moment(this.options.stepsArray[1].value).toDate())
  })

  constructor() {

  }

  ngOnInit() {
    this.formGroup.controls['sliderControl'].valueChanges.subscribe(timestampRange => {
      this.formGroup.controls['range'].setValue(
        timestampRange.map(t => moment(t).toDate()),
        { onlySelf: true, emitEvent: false }
      )
      this.formGroup.controls['minTimePicker'].setValue(
        moment(timestampRange[0]).toDate(),
        { onlySelf: true, emitEvent: false }
      )
      this.formGroup.controls['maxTimePicker'].setValue(
        moment(timestampRange[1]).toDate(),
        { onlySelf: true, emitEvent: false }
      )
    })

    this.formGroup.controls['range'].valueChanges.subscribe((dateRange: Date[]) => {
      this.formGroup.controls['sliderControl'].setValue(
        dateRange.map(t => moment(t).valueOf()),
        { onlySelf: true, emitEvent: false }
      )
      this.updateDateRange(dateRange[0], dateRange[1])
    })

    this.formGroup.controls['minTimePicker'].valueChanges.subscribe(minDate => {
      this.updateTimestamp(this.formGroup.controls['sliderControl'].value[0], minDate.getTime())
      this.formGroup.controls['sliderControl'].setValue(
        [minDate.getTime(), this.formGroup.controls['sliderControl'].value[1]],
        { onlySelf: true, emitEvent: false }
      )
    })

    this.formGroup.controls['maxTimePicker'].valueChanges.subscribe(maxDate => {
      this.updateTimestamp(this.formGroup.controls['sliderControl'].value[1], maxDate.getTime())
      this.formGroup.controls['sliderControl'].setValue(
        [this.formGroup.controls['sliderControl'].value[0], maxDate.getTime()],
        { onlySelf: true, emitEvent: false }
      )
    })
  }


  createStepArray(startDate?: Date, endDate?: Date): CustomStepDefinition[] {
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

  updateTimestamp(timestampStepValue: number, newTimestamp: number): void {
    const indexToChange: number = this.options.stepsArray.findIndex(x => x.value === timestampStepValue)
    if (this.options.stepsArray[indexToChange]) {
      const replacementItem: CustomStepDefinition = { value: newTimestamp, legend: this.options.stepsArray[indexToChange].legend }
      const newSteps = Object.assign([], this.options.stepsArray, { [indexToChange]: replacementItem })
      const newOptions: Options = Object.assign({}, this.options)
      newOptions.stepsArray = newSteps
      this.options = newOptions
    }
  }

  updateDateRange(startDate: Date, endDate: Date): void {
    const newOptions: Options = Object.assign({}, this.options)
    newOptions.stepsArray = this.createStepArray(startDate, endDate)
    this.options = newOptions
  }

}
