using FluentValidation;

namespace QuizNova.Application.Features.Enrollments.Queries.GetStudentEnrollmentsById;

public sealed class GetStudentEnrollmentsByIdQueryValidator : AbstractValidator<GetStudentEnrollmentsByIdQuery>
{
    public static class ErrorMessages
    {
        public const string StudentIdRequired = "Student ID is required.";
    }

    public GetStudentEnrollmentsByIdQueryValidator()
    {
        RuleFor(query => query.StudentId)
            .NotEmpty().WithMessage(ErrorMessages.StudentIdRequired);
    }
}

