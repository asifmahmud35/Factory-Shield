using System.Security.Cryptography;
using FactoryShield.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;

namespace FactoryShield.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _uploadsRoot;

    public LocalFileStorageService(IConfiguration config)
    {
        _uploadsRoot = config["FileStorage:UploadsPath"]
            ?? Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        Directory.CreateDirectory(_uploadsRoot);
    }

    public async Task<FileStorageResult> SaveAsync(Stream content, string fileName, string mimeType, CancellationToken ct = default)
    {
        var ext = Path.GetExtension(fileName);
        var key = $"{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(_uploadsRoot, key);

        using var ms = new MemoryStream();
        await content.CopyToAsync(ms, ct);

        ms.Position = 0;
        var hashBytes = await SHA256.HashDataAsync(ms, ct);
        var hash = Convert.ToHexString(hashBytes).ToLowerInvariant();

        ms.Position = 0;
        await using var fs = File.Create(fullPath);
        await ms.CopyToAsync(fs, ct);

        return new FileStorageResult(key, hash, ms.Length);
    }
}
