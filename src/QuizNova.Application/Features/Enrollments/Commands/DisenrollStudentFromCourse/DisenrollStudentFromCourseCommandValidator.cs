using FluentValidation;

namespace QuizNova.Application.Features.Enrollments.Commands.DisenrollStudentFromCourse;

public sealed class DisenrollStudentFromCourseCommandValidator : AbstractValidator<DisenrollStudentFromCourseCommand>
{
    public static class ErrorMessages
    {
        public const string EnrollmentIdRequired = "Enrollment ID is required.";
        public const string StudentIdRequired = "Student ID is required.";
    }

    public DisenrollStudentFromCourseCommandValidator()
    {
        RuleFor(command => command.EnrollmentId)
            .NotEmpty()
            .WithMessage(ErrorMessages.EnrollmentIdRequired);

        RuleFor(command => command.StudentId)
            .NotEmpty()
            .WithMessage(ErrorMessages.StudentIdRequired);
    }
}

