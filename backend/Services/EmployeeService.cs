using CentroBeneficios.Api.Data;
using CentroBeneficios.Api.Dtos.Employees;
using CentroBeneficios.Api.Entities;
using CentroBeneficios.Api.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace CentroBeneficios.Api.Services;

public class EmployeeService
{
    private readonly AppDbContext _db;

    public EmployeeService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<EmployeeDto>> ListAsync(string? search, bool includeInactive, CancellationToken ct)
    {
        var query = _db.Users.AsNoTracking().Where(u => u.Role == UserRole.Employee);

        if (!includeInactive)
        {
            query = query.Where(u => u.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search.Trim()}%";
            query = query.Where(u => EF.Functions.ILike(u.Name, pattern) || EF.Functions.ILike(u.Email, pattern));
        }

        return await query
            .OrderBy(u => u.Name)
            .Select(u => new EmployeeDto(u.Id, u.Name, u.Email, u.IsActive, u.PointsBalance, u.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<EmployeeDto> GetAsync(int id, CancellationToken ct)
    {
        return ToDto(await FindEmployeeAsync(id, ct));
    }

    public async Task<EmployeeDto> CreateAsync(CreateEmployeeRequest request, int adminId, CancellationToken ct)
    {
        var email = NormalizeEmail(request.Email);
        await EnsureEmailAvailableAsync(email, 0, ct);

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Employee,
            PointsBalance = request.InitialPoints
        };
        _db.Users.Add(user);

        if (request.InitialPoints > 0)
        {
            _db.PointTransactions.Add(new PointTransaction
            {
                User = user,
                Amount = request.InitialPoints,
                Type = PointTransactionType.InitialBalance,
                Description = "Saldo inicial",
                CreatedById = adminId
            });
        }

        await _db.SaveChangesAsync(ct);
        return ToDto(user);
    }

    public async Task<EmployeeDto> UpdateAsync(int id, UpdateEmployeeRequest request, CancellationToken ct)
    {
        var user = await FindEmployeeAsync(id, ct);
        var email = NormalizeEmail(request.Email);
        await EnsureEmailAvailableAsync(email, id, ct);

        user.Name = request.Name.Trim();
        user.Email = email;

        if (!string.IsNullOrEmpty(request.Password))
        {
            if (request.Password.Length < 6)
            {
                throw new AppException("A senha deve ter pelo menos 6 caracteres.");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        await _db.SaveChangesAsync(ct);
        return ToDto(user);
    }

    public async Task<EmployeeDto> SetStatusAsync(int id, bool isActive, CancellationToken ct)
    {
        var user = await FindEmployeeAsync(id, ct);
        user.IsActive = isActive;

        await _db.SaveChangesAsync(ct);
        return ToDto(user);
    }

    public async Task<EmployeeDto> AdjustPointsAsync(
        int id, PointAdjustmentRequest request, int adminId, CancellationToken ct)
    {
        if (request.Amount == 0)
        {
            throw new AppException("O ajuste não pode ser zero.");
        }

        var user = await FindEmployeeAsync(id, ct);
        var newBalance = user.PointsBalance + request.Amount;

        if (newBalance < 0)
        {
            throw new AppException("O saldo não pode ficar negativo.");
        }

        user.PointsBalance = newBalance;
        _db.PointTransactions.Add(new PointTransaction
        {
            UserId = user.Id,
            Amount = request.Amount,
            Type = PointTransactionType.AdminAdjustment,
            Description = $"Ajuste: {request.Reason.Trim()}",
            CreatedById = adminId
        });

        await _db.SaveChangesAsync(ct);
        return ToDto(user);
    }

    public async Task<AttendanceDayDto> GetAttendanceAsync(int id, DateOnly date, CancellationToken ct)
    {
        await FindEmployeeAsync(id, ct);
        return new AttendanceDayDto(date, await TotalForDayAsync(id, date, ct));
    }

    public async Task<AttendanceDayDto> SetAttendanceAsync(
        int id, SetAttendanceRequest request, int adminId, CancellationToken ct)
    {
        await FindEmployeeAsync(id, ct);

        if (request.Date > BrazilClock.Today)
        {
            throw new AppException("Não é possível lançar atendimentos em data futura.");
        }

        var current = await TotalForDayAsync(id, request.Date, ct);
        var delta = request.Quantity - current;

        if (delta == 0)
        {
            return new AttendanceDayDto(request.Date, current);
        }

        _db.AttendanceEntries.Add(new AttendanceEntry
        {
            UserId = id,
            Date = request.Date,
            Delta = delta,
            Note = request.Note?.Trim(),
            CreatedById = adminId
        });

        await _db.SaveChangesAsync(ct);
        return new AttendanceDayDto(request.Date, request.Quantity);
    }

    private async Task<User> FindEmployeeAsync(int id, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.Employee, ct);

        return user ?? throw new AppException("Funcionário não encontrado.", StatusCodes.Status404NotFound);
    }

    private async Task EnsureEmailAvailableAsync(string email, int ignoreUserId, CancellationToken ct)
    {
        var taken = await _db.Users.AnyAsync(u => u.Email == email && u.Id != ignoreUserId, ct);

        if (taken)
        {
            throw new AppException("E-mail já cadastrado.", StatusCodes.Status409Conflict);
        }
    }

    private async Task<int> TotalForDayAsync(int userId, DateOnly date, CancellationToken ct)
    {
        return await _db.AttendanceEntries
            .Where(a => a.UserId == userId && a.Date == date)
            .SumAsync(a => a.Delta, ct);
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private static EmployeeDto ToDto(User u) =>
        new(u.Id, u.Name, u.Email, u.IsActive, u.PointsBalance, u.CreatedAt);
}