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
import { Action } from '@ngrx/store';
import { LineageControllerService } from 'src/app/generated/services';
import { LineageOverviewVM } from 'src/app/model/viewModels/lineageOverview';

export enum LineageOverviewActionTypes {
    OVERVIEW_LINEAGE_GET = '[Overview Lineage] Get',
    OVERVIEW_LINEAGE_GET_GET_SUCCESS = '[Overview Lineage] Get Success'
}

export class Get implements Action {
    public readonly type = LineageOverviewActionTypes.OVERVIEW_LINEAGE_GET
    constructor(public payload: LineageControllerService.LineageUsingGET1Params) { }
}

export class GetSuccess implements Action {
    public readonly type = LineageOverviewActionTypes.OVERVIEW_LINEAGE_GET_GET_SUCCESS
    constructor(public payload: LineageOverviewVM) { }
}

export type LineageOverviewActions
    = Get
    | GetSuccess
