// -- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2015 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See doc/COPYRIGHT.rdoc for more details.
// ++

import {Component, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {I18nService} from "app/modules/common/i18n/i18n.service";
import {WorkPackageTableFiltersService} from "app/components/wp-fast-table/state/wp-table-filters.service";
import {QueryFilterResource} from "app/modules/hal/resources/query-filter-resource";
import {componentDestroyed, untilComponentDestroyed} from "ng2-rx-componentdestroyed";
import {WorkPackageCacheService} from "app/components/work-packages/work-package-cache.service";
import {Subject} from "rxjs";
import {debounceTime, distinctUntilChanged} from "rxjs/operators";
import {DebouncedEventEmitter} from "core-components/angular/debounced-event-emitter";
import {IsolatedQuerySpace} from "core-app/modules/work_packages/query-space/isolated-query-space";
import {QueryFilterInstanceResource} from "core-app/modules/hal/resources/query-filter-instance-resource";

@Component({
  selector: 'wp-filter-by-text-input',
  templateUrl: './quick-filter-by-text-input.html'
})

export class WorkPackageFilterByTextInputComponent implements OnInit, OnDestroy {
  @Output() public filterChanged = new DebouncedEventEmitter<QueryFilterInstanceResource[]>(componentDestroyed(this));

  public text = {
    createWithDropdown: this.I18n.t('js.work_packages.create.button'),
    createButton: this.I18n.t('js.label_work_package'),
    explanation: this.I18n.t('js.label_create_work_package'),
    placeholder: this.I18n.t('js.work_packages.placeholder_filter_by_text')
  };

  public searchTerm:string;
  private searchTermChanged:Subject<string> = new Subject<string>();

  constructor(readonly I18n:I18nService,
              readonly querySpace:IsolatedQuerySpace,
              readonly wpTableFilters:WorkPackageTableFiltersService,
              readonly wpCacheService:WorkPackageCacheService) {
    this.searchTermChanged
      .pipe(
        untilComponentDestroyed(this),
        debounceTime(250),
        distinctUntilChanged()
      )
      .subscribe(term => {
        this.searchTerm = term;
        let filters = this.wpTableFilters.current;

        // Remove the current filter
        _.remove(filters, f => f.id === 'search');

        if (this.searchTerm.length > 0) {
          let searchFilter = this.wpTableFilters.instantiate('search');
          searchFilter.operator = searchFilter.findOperator('**')!;
          searchFilter.values = [this.searchTerm];
          filters.push(searchFilter);
        }

        this.filterChanged.emit(filters);
      });
  }

  public ngOnInit() {
    let self:WorkPackageFilterByTextInputComponent = this;

    this.wpTableFilters
      .observeUntil(
        componentDestroyed(this)
      )
      .subscribe(() => {
        const currentSearchFilter = this.wpTableFilters.find('search');
        if (currentSearchFilter) {
          this.searchTerm = currentSearchFilter.values[0] as string;
        } else {
          this.searchTerm = '';
        }
      });
  }

  public ngOnDestroy() {
    // Nothing to do
  }

  public valueChange(term:string) {
    this.searchTermChanged.next(term);
  }
}
