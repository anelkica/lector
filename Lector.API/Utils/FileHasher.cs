using System.Security.Cryptography;

namespace Lector.API.Utils;

// used for hashing files so we save process calls and prevent deduplication
// Tesseract OCR especially can be finnicky, so if we can cut a corner that's great


public static class FileHasher
{
    // 4A-2B-9C-01 -> 4a2b9c01
    public static string ComputeSHA256(Stream stream) =>
        Convert.ToHexStringLower(SHA256.HashData(stream));
}
