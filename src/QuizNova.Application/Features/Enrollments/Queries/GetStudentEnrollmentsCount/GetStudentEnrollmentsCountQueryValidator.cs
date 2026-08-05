using FluentValidation;

namespace QuizNova.Application.Features.Enrollments.Queries.GetStudentEnrollmentsCount;

public sealed class GetStudentEnrollmentsCountQueryValidator : AbstractValidator<GetStudentEnrollmentsCountQuery>
{
    public static class ErrorMessages
    {
        public const string StudentIdRequired = "Student ID is required.";
    }

    public GetStudentEnrollmentsCountQueryValidator()
    {
        RuleFor(query => query.StudentId)
            .NotEmpty().WithMessage(ErrorMessages.StudentIdRequired);
    }
}

