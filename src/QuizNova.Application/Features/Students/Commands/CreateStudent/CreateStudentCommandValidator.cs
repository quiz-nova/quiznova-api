using FluentValidation;

using QuizNova.Domain.Entities.Identity;

namespace QuizNova.Application.Features.Students.Commands.CreateStudent;

public sealed class CreateStudentCommandValidator : AbstractValidator<CreateStudentCommand>
{
    public static class ErrorMessages
    {
        public const string NameRequired = "Name is required.";
        public const string NameMinLength = "Name must be at least 3 characters.";
        public const string EmailRequired = "Email is required.";
        public const string EmailInvalid = "A valid email address is required.";
        public const string PasswordRequired = "Password is required.";
        public const string PasswordMinLength = "Password must be at least 8 characters.";
        public const string PasswordUppercase = "Password must contain at least one uppercase letter.";
        public const string PasswordLowercase = "Password must contain at least one lowercase letter.";
        public const string PasswordDigit = "Password must contain at least one number.";
        public const string PasswordSpecial = "Password must contain at least one special character.";
        public const string PhoneNumberRequired = "Phone number is required.";
        public const string PhoneNumberLength = "Phone number must be between 7 and 15 characters.";
        public const string RoleRequired = "Role is required.";
        public static readonly string RoleInvalid = $"Role must be '{UserRole.Student}'.";
    }

    public CreateStudentCommandValidator()
    {
        RuleFor(command => command.PersonalInformation.Name)
            .NotEmpty().WithMessage(ErrorMessages.NameRequired)
            .MinimumLength(3).WithMessage(ErrorMessages.NameMinLength);

        RuleFor(command => command.PersonalInformation.Email)
            .NotEmpty().WithMessage(ErrorMessages.EmailRequired)
            .EmailAddress().WithMessage(ErrorMessages.EmailInvalid);

        RuleFor(command => command.Password)
            .NotEmpty().WithMessage(ErrorMessages.PasswordRequired)
            .MinimumLength(8).WithMessage(ErrorMessages.PasswordMinLength)
            .Matches("[A-Z]").WithMessage(ErrorMessages.PasswordUppercase)
            .Matches("[a-z]").WithMessage(ErrorMessages.PasswordLowercase)
            .Matches("[0-9]").WithMessage(ErrorMessages.PasswordDigit)
            .Matches("[^a-zA-Z0-9]").WithMessage(ErrorMessages.PasswordSpecial);

        RuleFor(command => command.PersonalInformation.PhoneNumber)
            .NotEmpty().WithMessage(ErrorMessages.PhoneNumberRequired)
            .Length(7, 15).WithMessage(ErrorMessages.PhoneNumberLength);

        RuleFor(command => command.Role)
            .NotEmpty().WithMessage(ErrorMessages.RoleRequired)
            .Must(role => string.Equals(role,
                nameof(UserRole.Student),
                StringComparison.OrdinalIgnoreCase))
            .WithMessage(ErrorMessages.RoleInvalid);
    }
}

