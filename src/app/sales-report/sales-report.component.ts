import { isPlatformBrowser } from '@angular/common';
import SalesReport from './model/sales-report';
import { SalesReportService } from './service/sales-report.service';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray } from '@angular/forms';

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './sales-report.component.html',
  styleUrl: './sales-report.component.scss',
})
export class SalesReportComponent implements OnInit {
  optionsForm = this.fb.group({
    dateini: this.getFormattedDate(),
    datefin: this.getFormattedDate(),
    valueString: 'price',
    columns: this.fb.array(['category']),
  });
  salesReports: SalesReport[] = [];
  columns: string[] = [
    'category',
    'color',
    'customer',
    'provider',
    'country',
    'variety',
  ];
  values: string[] = ['stems', 'price'];
  showLoader: boolean = false;
  filteredData: any[] = [];
  startDate: Date = new Date();
  endDate: Date = new Date();
  dateRange: Date[] = [];
  units: string = '';

  constructor(
    private salesReportService: SalesReportService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.getAll();
  }

  async getAll() {
    this.units = this.isValueSelected('price') ? '$' : 'Un';
    this.showLoader = true;
    const dateini = this.optionsForm.get('dateini')!.value;
    const datefin = this.optionsForm.get('datefin')!.value;
    const value = this.optionsForm.get('valueString')!.value;
    const columns = this.optionsForm.get('columns')!.value;
    this.startDate = new Date(`${dateini}`);
    this.endDate = new Date(`${datefin}`);

    this.dateRange = this.getDateRange();

    let paramsStr = `dateini=${dateini}&datefin=${datefin}`;
    paramsStr += `&value=${value}`;

    if (columns.length) {
      columns.forEach((col) => {
        paramsStr += `&columns[]=${col}`;
      });
    }

    const params = new URLSearchParams(paramsStr);

    this.salesReportService
      .getReportFromApi(params)
      .then((sales) => {
        this.salesReports = sales;
        this.filteredData = this.groupBy();
      })
      .catch((error) => console.log(error))
      .finally(() => {
        this.showLoader = false;
      });
  }

  updateSelectedColumns(event: any) {
    const checkbox = event.target;
    const checkboxValue = checkbox.value;

    if (checkbox.checked) {
      this.addColumn(checkboxValue);
    } else {
      this.removeColumn(checkboxValue);
    }
    this.getAll();
  }

  updateValueSelected(event: any) {
    const radio = event.target;
    const radioValue = radio.value;
    this.optionsForm.value.valueString = radioValue;
    this.getAll();
  }

  get columnsSelected() {
    return this.optionsForm.get('columns') as FormArray;
  }

  isColumnSelected(column: string): boolean {
    return this.columnsSelected.value.includes(column);
  }

  isValueSelected(value: string): boolean {
    return this.optionsForm.value.valueString == value;
  }

  addColumn(column: string) {
    if (column == 'color' || column == 'variety') {
      this.columnsSelected.push(this.fb.control('category'));
    }
    this.columnsSelected.push(this.fb.control(column));
  }

  removeColumn(column: string) {
    const index = this.columnsSelected.value.indexOf(column);
    if (index !== -1) {
      this.columnsSelected.removeAt(index);
    }
  }

  onDateChange() {
    this.getAll();
  }

  async onSubmit() {
    await this.getAll();
  }

  getFormattedDate(): string {
    const today = new Date('oct 01 2023');
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  getDateRange(): Date[] {
    const dates = [];
    const currentDate = this.startDate;

    while (currentDate.getTime() <= this.endDate.getTime()) {
      currentDate.setDate(currentDate.getDate() + 1);
      dates.push(new Date(currentDate));
    }

    return dates;
  }

  groupBy() {
    const columns = this.optionsForm.get('columns')!.value;
    const map = new Map();

    this.salesReports.forEach((item: any) => {
      const key = columns.map((k: any) => item[k]).join('|');

      const collection = map.get(key);
      if (!collection) {
        map.set(key, [item]);
      } else {
        collection.push(item);
      }
    });

    return Array.from(map, ([key, values]) => {
      const tokens = key.split('|');

      const group: any = {};
      columns.forEach((col) => {
        if (col) {
          group[col] = tokens[columns.indexOf(col)];
        }
      });
      group.subtotal = [];
      group.total = 0;

      values.forEach((value: any) => {
        this.dateRange.forEach((date) => {
          if (this.formatDate(date) == value.date) {
            group.subtotal.push(
              parseFloat((value.stems || value.price).toFixed(2))
            );
            group.total += parseFloat((value.stems || value.price).toFixed(2));
          }
        });
      });

      return { ...group };
    });
  }

  getTotal() {
    const total = this.filteredData.reduce(
      (acc, element) => acc + element.total,
      0
    );
    return `${this.units} ${parseFloat(total.toFixed(2))} `;
  }

  getSubTotal() {
    const subTotal = this.filteredData.reduce(
      (acc, element) => acc + element.subtotal,
      0
    );
    return `${this.units} ${parseFloat(subTotal.toFixed(2))} `;
  }

  formatDate(date: Date) {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  getPartial(idx: number) {
    let subtotal = 0;
    this.filteredData.forEach((item) => {
      console.log(item.subtotal[idx]);
      if (item.subtotal[idx]) {
        subtotal += parseFloat(item.subtotal[idx]);
      }
    });
    return `${this.units} ${parseFloat(subtotal.toFixed(2))} `;
  }
}
