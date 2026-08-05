using FluentValidation;

namespace QuizNova.Application.Features.Instructors.Commands.DeleteInstructor;

public sealed class DeleteInstructorCommandValidator : AbstractValidator<DeleteInstructorCommand>
{
    public static class ErrorMessages
    {
        public const string IdRequired = "Instructor ID is required.";
    }

    public DeleteInstructorCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty().WithMessage(ErrorMessages.IdRequired);
    }
}

