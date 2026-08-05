using FluentValidation;

using QuizNova.Application.Common.Validation;

namespace QuizNova.Application.Features.QuizAttempts.Queries.GetAllQuizzesAttempts;

public sealed class GetAllQuizzesAttemptsQueryValidator : AbstractValidator<GetAllQuizzesAttemptsQuery>
{
    public static class ErrorMessages
    {
        public const string CorrectAnswersMin = "Correct answers count cannot be negative.";
    }

    public GetAllQuizzesAttemptsQueryValidator()
    {
        RuleFor(query => query.PageNumber)
            .GreaterThan(0).WithMessage(ValidationMessages.Pagination.PageNumberMin);

        RuleFor(query => query.PageSize)
            .GreaterThan(0).WithMessage(ValidationMessages.Pagination.PageSizeMin)
            .LessThanOrEqualTo(100).WithMessage(ValidationMessages.Pagination.PageSizeMax(100));

        RuleFor(query => query.CorrectAnswers)
            .GreaterThanOrEqualTo(0).WithMessage(ErrorMessages.CorrectAnswersMin)
            .When(query => query.CorrectAnswers.HasValue);

        RuleFor(query => query.SearchTerm)
            .MaximumLength(200).WithMessage(ValidationMessages.Pagination.SearchTermMax(200))
            .When(query => !string.IsNullOrWhiteSpace(query.SearchTerm));
    }
}

