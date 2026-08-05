using FluentValidation;

namespace QuizNova.Application.Features.QuizAttempts.Queries.GetStudentQuizAttemptsCount;

public sealed class GetStudentQuizAttemptsCountQueryValidator : AbstractValidator<GetStudentQuizAttemptsCountQuery>
{
    public static class ErrorMessages
    {
        public const string StudentIdRequired = "Student ID is required.";
    }

    public GetStudentQuizAttemptsCountQueryValidator()
    {
        RuleFor(query => query.StudentId)
            .NotEmpty().WithMessage(ErrorMessages.StudentIdRequired);
    }
}
