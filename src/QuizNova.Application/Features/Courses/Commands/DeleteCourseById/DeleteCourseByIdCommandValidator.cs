using FluentValidation;

namespace QuizNova.Application.Features.Courses.Commands.DeleteCourseById;

public sealed class DeleteCourseByIdCommandValidator : AbstractValidator<DeleteCourseByIdCommand>
{
    public static class ErrorMessages
    {
        public const string CourseIdRequired = "Course ID is required.";
    }

    public DeleteCourseByIdCommandValidator()
    {
        RuleFor(x => x.CourseId)
            .NotEmpty()
            .WithMessage(ErrorMessages.CourseIdRequired);
    }
}

