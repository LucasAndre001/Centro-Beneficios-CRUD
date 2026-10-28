namespace CentroBeneficios.Api.Dtos.Auth;

public record UserInfo(int Id, string Name, string Email, string Role);

public record LoginResponse(string Token, DateTime ExpiresAt, UserInfo User);