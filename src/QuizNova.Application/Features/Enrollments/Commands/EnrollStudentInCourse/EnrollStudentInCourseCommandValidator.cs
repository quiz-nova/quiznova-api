using FluentValidation;

namespace QuizNova.Application.Features.Enrollments.Commands.EnrollStudentInCourse;

public sealed class EnrollStudentInCourseCommandValidator : AbstractValidator<EnrollStudentInCourseCommand>
{
    public static class ErrorMessages
    {
        public const string CourseIdRequired = "Course ID is required.";
        public const string StudentIdRequired = "Student ID is required.";
    }

    public EnrollStudentInCourseCommandValidator()
    {
        RuleFor(command => command.CourseId)
            .NotEmpty()
            .WithMessage(ErrorMessages.CourseIdRequired);

        RuleFor(command => command.StudentId)
            .NotEmpty()
            .WithMessage(ErrorMessages.StudentIdRequired);
    }
}

