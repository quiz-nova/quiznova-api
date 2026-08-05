using FluentValidation;

namespace QuizNova.Application.Features.Courses.Commands.UpdateCourseInstructor;

public sealed class UpdateCourseInstructorCommandValidator : AbstractValidator<UpdateCourseInstructorCommand>
{
    public static class ErrorMessages
    {
        public const string CourseIdRequired = "Course ID is required.";
        public const string InstructorIdInvalid = "Instructor ID must be valid when provided.";
    }

    public UpdateCourseInstructorCommandValidator()
    {
        RuleFor(command => command.CourseId)
            .NotEmpty()
            .WithMessage(ErrorMessages.CourseIdRequired);

        RuleFor(command => command.InstructorId)
            .NotEqual(Guid.Empty)
            .When(command => command.InstructorId.HasValue)
            .WithMessage(ErrorMessages.InstructorIdInvalid);
    }
}

