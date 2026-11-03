import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AdminDashboard,
  AttendanceDay,
  AttendanceRow,
  BatchResult,
  CreateEmployeeRequest,
  Employee,
  GoalPeriod,
  Goals,
  ProductDetail,
  ProductRequest,
  ProductStatus,
  ProductSummary,
  UpdateEmployeeRequest,
} from '../core/models';

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/admin`;

  dashboard(period: GoalPeriod): Observable<AdminDashboard> {
    const params = new HttpParams().set('period', period);
    return this.http.get<AdminDashboard>(`${this.baseUrl}/dashboard`, { params });
  }

  goals(): Observable<Goals> {
    return this.http.get<Goals>(`${this.baseUrl}/goals`);
  }

  updateGoals(goals: Goals): Observable<Goals> {
    return this.http.put<Goals>(`${this.baseUrl}/goals`, goals);
  }

  employees(search = '', includeInactive = false): Observable<Employee[]> {
    const params = new HttpParams().set('search', search).set('includeInactive', includeInactive);
    return this.http.get<Employee[]>(`${this.baseUrl}/employees`, { params });
  }

  createEmployee(request: CreateEmployeeRequest): Observable<Employee> {
    return this.http.post<Employee>(`${this.baseUrl}/employees`, request);
  }

  updateEmployee(id: number, request: UpdateEmployeeRequest): Observable<Employee> {
    return this.http.put<Employee>(`${this.baseUrl}/employees/${id}`, request);
  }

  setEmployeeStatus(id: number, isActive: boolean): Observable<Employee> {
    return this.http.patch<Employee>(`${this.baseUrl}/employees/${id}/status`, { isActive });
  }

  adjustPoints(id: number, amount: number, reason: string): Observable<Employee> {
    return this.http.post<Employee>(`${this.baseUrl}/employees/${id}/point-adjustments`, {
      amount,
      reason,
    });
  }

  attendanceOf(id: number, date: string): Observable<AttendanceDay> {
    const params = new HttpParams().set('date', date);
    return this.http.get<AttendanceDay>(`${this.baseUrl}/employees/${id}/attendance-entries`, {
      params,
    });
  }

  setAttendance(id: number, date: string, quantity: number): Observable<AttendanceDay> {
    return this.http.post<AttendanceDay>(`${this.baseUrl}/employees/${id}/attendance-entries`, {
      date,
      quantity,
    });
  }

  attendanceForDay(date: string): Observable<AttendanceRow[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<AttendanceRow[]>(`${this.baseUrl}/attendance`, { params });
  }

  saveAttendanceBatch(
    date: string,
    note: string,
    items: { employeeId: number; quantity: number }[],
  ): Observable<BatchResult> {
    return this.http.post<BatchResult>(`${this.baseUrl}/attendance/batch`, { date, note, items });
  }

  adjustPointsBatch(
    amount: number,
    reason: string,
    employeeIds: number[],
  ): Observable<BatchResult> {
    return this.http.post<BatchResult>(`${this.baseUrl}/point-adjustments/batch`, {
      amount,
      reason,
      employeeIds,
    });
  }

  products(search = '', includeInactive = false): Observable<ProductSummary[]> {
    const params = new HttpParams().set('search', search).set('includeInactive', includeInactive);
    return this.http.get<ProductSummary[]>(`${this.baseUrl}/products`, { params });
  }

  product(id: number): Observable<ProductDetail> {
    return this.http.get<ProductDetail>(`${this.baseUrl}/products/${id}`);
  }

  createProduct(request: ProductRequest): Observable<ProductDetail> {
    return this.http.post<ProductDetail>(`${this.baseUrl}/products`, request);
  }

  updateProduct(id: number, request: ProductRequest): Observable<ProductDetail> {
    return this.http.put<ProductDetail>(`${this.baseUrl}/products/${id}`, request);
  }

  setProductStatus(id: number, status: ProductStatus): Observable<ProductDetail> {
    return this.http.patch<ProductDetail>(`${this.baseUrl}/products/${id}/status`, { status });
  }
}
