namespace FactoryShield.Application.Common.Interfaces;

public record FileStorageResult(string StorageKey, string Sha256Hash, long FileSize);

public interface IFileStorageService
{
    Task<FileStorageResult> SaveAsync(Stream content, string fileName, string mimeType, CancellationToken ct = default);
}
