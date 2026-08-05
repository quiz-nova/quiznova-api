using FluentValidation;

namespace QuizNova.Application.Features.QuizAttempts.Queries.GetQuizAttemptById;

public sealed class GetQuizAttemptByIdQueryValidator : AbstractValidator<GetQuizAttemptByIdQuery>
{
    public static class ErrorMessages
    {
        public const string QuizAttemptIdRequired = "Quiz attempt ID is required.";
    }

    public GetQuizAttemptByIdQueryValidator()
    {
        RuleFor(x => x.QuizAttemptId)
            .NotEmpty()
            .WithMessage(ErrorMessages.QuizAttemptIdRequired);
    }
}

