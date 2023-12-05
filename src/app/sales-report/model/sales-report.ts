export default interface SalesReport {
  date: string;
  category: string;
  color: string;
  customer: string;
  provider: string;
  country: string;
  variety: string;
  stems?: number;
  price?: number;
}
