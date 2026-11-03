# ---------- Estágio 1: compilar ----------
# Imagem com o SDK completo do .NET 
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copia só o .csproj e restaura os pacotes primeiro.
# Assim o Docker reaproveita essa etapa se você só mudar o código.
COPY *.csproj ./
RUN dotnet restore

# Copia o restante do código e gera a versão final (Release)
COPY . ./
RUN dotnet publish -c Release -o /app/publish --no-restore

# ---------- Estágio 2: executar ----------
# Imagem enxuta, só com o necessário para rodar a API
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish ./

ENTRYPOINT ["dotnet", "CentroBeneficios.api.dll"]