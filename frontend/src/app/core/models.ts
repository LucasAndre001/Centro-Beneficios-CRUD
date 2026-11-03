export type Role = 'Employee' | 'Admin';
export type GoalPeriod = 'Day' | 'Week' | 'Month';
export type ProductStatus = 'Draft' | 'Published' | 'Inactive';

export interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: UserInfo;
}

export interface PointTransaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export interface Redemption {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCostPoints: number;
  createdAt: string;
}

export interface GoalProgress {
  period: GoalPeriod;
  start: string;
  end: string;
  total: number;
  target: number | null;
  percent: number | null;
}

export interface EmployeeDashboard {
  name: string;
  pointsBalance: number;
  goals: GoalProgress[];
  recentTransactions: PointTransaction[];
  recentRedemptions: Redemption[];
}

export interface CatalogProduct {
  id: number;
  name: string;
  description: string;
  pointCost: number;
  stockQuantity: number;
  imageDataUrl: string | null;
}

export interface RedeemResult {
  redemption: Redemption;
  newBalance: number;
}

export interface AttendanceRankingItem {
  position: number;
  employeeId: number;
  name: string;
  total: number;
  percent: number | null;
}

export interface ValueRankingItem {
  position: number;
  employeeId: number;
  name: string;
  pointsBalance: number;
}

export interface AdminDashboard {
  period: GoalPeriod;
  start: string;
  end: string;
  target: number | null;
  attendanceRanking: AttendanceRankingItem[];
  valueRanking: ValueRankingItem[];
}

export interface Goals {
  day: number | null;
  week: number | null;
  month: number | null;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  pointsBalance: number;
  createdAt: string;
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  password: string;
  initialPoints: number;
}

export interface UpdateEmployeeRequest {
  name: string;
  email: string;
  password: string | null;
}

export interface AttendanceDay {
  date: string;
  total: number;
}

export interface ProductSummary {
  id: number;
  name: string;
  description: string;
  pointCost: number;
  stockQuantity: number;
  hasImage: boolean;
  status: ProductStatus;
}

export interface ProductDetail {
  id: number;
  name: string;
  description: string;
  pointCost: number;
  stockQuantity: number;
  imageDataUrl: string | null;
  status: ProductStatus;
}

export interface ProductRequest {
  name: string;
  description: string;
  pointCost: number;
  stockQuantity: number;
  imageDataUrl: string | null;
  publish: boolean;
}

export interface AdminRedemption {
  id: number;
  employeeId: number;
  employeeName: string;
  productId: number;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCostPoints: number;
  createdAt: string;
}

export interface AttendanceRow {
  employeeId: number;
  name: string;
  total: number;
}

export interface BatchResult {
  changed: number;
}

export interface GameInfo {
  key: string;
  name: string;
}

export interface GameRankingItem {
  position: number;
  userId: number;
  name: string;
  isAdmin: boolean;
  bestScore: number;
}

export interface MyGameStats {
  bestScore: number | null;
  plays: number;
  position: number | null;
}

export interface GameResult {
  score: number;
  bestScore: number;
  isNewRecord: boolean;
  position: number;
}

export interface ScoreSubmission {
  score: number;
  lines: number;
  level: number;
}
