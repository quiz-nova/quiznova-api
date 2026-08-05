using FluentValidation;

namespace QuizNova.Application.Features.Quizzes.Queries.GetQuizById;

public sealed class GetQuizByIdQueryValidator : AbstractValidator<GetQuizByIdQuery>
{
    public static class ErrorMessages
    {
        public const string QuizIdRequired = "Quiz ID is required.";
    }

    public GetQuizByIdQueryValidator()
    {
        RuleFor(query => query.QuizId)
            .NotEmpty().WithMessage(ErrorMessages.QuizIdRequired);
    }
}

