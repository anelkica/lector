using System.ComponentModel.DataAnnotations;

namespace Lector.API.Dtos;

public record ChangePasswordRequest(
    [Required] string OldPassword,
    [Required][MinLength(8)] string NewPassword
);

public record ChangeEmailRequest(
    [Required][EmailAddress] string NewEmail
);