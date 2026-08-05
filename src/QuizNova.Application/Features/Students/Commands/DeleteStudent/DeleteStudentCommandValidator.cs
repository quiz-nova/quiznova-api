using FluentValidation;

namespace QuizNova.Application.Features.Students.Commands.DeleteStudent;

public sealed class DeleteStudentCommandValidator : AbstractValidator<DeleteStudentCommand>
{
    public static class ErrorMessages
    {
        public const string IdRequired = "Student ID is required.";
    }

    public DeleteStudentCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty().WithMessage(ErrorMessages.IdRequired);
    }
}

