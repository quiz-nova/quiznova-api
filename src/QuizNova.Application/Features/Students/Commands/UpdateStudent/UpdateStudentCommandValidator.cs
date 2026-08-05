using FluentValidation;

namespace QuizNova.Application.Features.Students.Commands.UpdateStudent;

public sealed class UpdateStudentCommandValidator : AbstractValidator<UpdateStudentCommand>
{
    public static class ErrorMessages
    {
        public const string IdRequired = "Student ID is required.";
        public const string NameRequired = "Name is required.";
        public const string NameMinLength = "Name must be at least 3 characters.";
        public const string EmailRequired = "Email is required.";
        public const string EmailInvalid = "A valid email address is required.";
        public const string PhoneNumberRequired = "Phone number is required.";
        public const string PhoneNumberLength = "Phone number must be between 7 and 15 characters.";
    }

    public UpdateStudentCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty().WithMessage(ErrorMessages.IdRequired);

        RuleFor(command => command.PersonalInformation.Name)
            .NotEmpty().WithMessage(ErrorMessages.NameRequired)
            .MinimumLength(3).WithMessage(ErrorMessages.NameMinLength);

        RuleFor(command => command.PersonalInformation.Email)
            .NotEmpty().WithMessage(ErrorMessages.EmailRequired)
            .EmailAddress().WithMessage(ErrorMessages.EmailInvalid);

        RuleFor(command => command.PersonalInformation.PhoneNumber)
            .NotEmpty().WithMessage(ErrorMessages.PhoneNumberRequired)
            .Length(7, 15).WithMessage(ErrorMessages.PhoneNumberLength);
    }
}

