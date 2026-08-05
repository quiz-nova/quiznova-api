using FluentValidation;

namespace QuizNova.Application.Features.Auth.Commands.Login;

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public static class ErrorMessages
    {
        public const string EmailRequired = "Email is required.";
        public const string EmailInvalid = "A valid email address is required.";
        public const string PasswordRequired = "Password is required.";
        public const string PasswordMinLength = "Password must be at least 8 characters long.";
        public const string PasswordUpper = "Password must contain at least one uppercase letter.";
        public const string PasswordLower = "Password must contain at least one lowercase letter.";
        public const string PasswordDigit = "Password must contain at least one digit.";
        public const string PasswordSpecial = "Password must contain at least one special character.";
    }

    public LoginCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage(ErrorMessages.EmailRequired)
            .EmailAddress().WithMessage(ErrorMessages.EmailInvalid);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage(ErrorMessages.PasswordRequired)
            .MinimumLength(8).WithMessage(ErrorMessages.PasswordMinLength)
            .Matches("[A-Z]").WithMessage(ErrorMessages.PasswordUpper)
            .Matches("[a-z]").WithMessage(ErrorMessages.PasswordLower)
            .Matches("[0-9]").WithMessage(ErrorMessages.PasswordDigit)
            .Matches("[^a-zA-Z0-9]").WithMessage(ErrorMessages.PasswordSpecial);
    }
}

