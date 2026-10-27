namespace CentroBeneficios.Api.Entities;

public enum UserRole
{
    Employee = 1,
    Admin = 2
}

public enum ProductStatus
{
    Draft = 1,
    Published = 2,
    Inactive = 3
}

public enum PointTransactionType
{
    InitialBalance = 1,
    AdminAdjustment = 2,
    Redemption = 3
}

public enum GoalPeriod
{
    Day = 1,
    Week = 2,
    Month = 3
}