import { SalesReportComponent } from './sales-report/sales-report.component';
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'sales-report', component: SalesReportComponent },
  { path: '', redirectTo: '/sales-report', pathMatch: 'full' },
];
