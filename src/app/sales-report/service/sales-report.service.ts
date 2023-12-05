import { Injectable } from '@angular/core';
import SalesReport from '../model/sales-report';

@Injectable({
  providedIn: 'root',
})
export class SalesReportService {
  private baseUrl = 'https://apitest.ikbo.co';

  async getReportFromApi(params: any): Promise<SalesReport[]> {
    const query = new URLSearchParams(params);
    const data = await fetch(`${this.baseUrl}/sales?${query}`);
    return (await data.json()) ?? [];
  }
}
