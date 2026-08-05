using FluentValidation;

namespace QuizNova.Application.Features.QuizAttempts.Queries.GetStudentQuizAttempts;

public sealed class GetStudentQuizAttemptsQueryValidator : AbstractValidator<GetStudentQuizAttemptsQuery>
{
    public static class ErrorMessages
    {
        public const string StudentIdRequired = "Student ID is required.";
    }

    public GetStudentQuizAttemptsQueryValidator()
    {
        RuleFor(query => query.StudentId)
            .NotEmpty().WithMessage(ErrorMessages.StudentIdRequired);
    }
}

