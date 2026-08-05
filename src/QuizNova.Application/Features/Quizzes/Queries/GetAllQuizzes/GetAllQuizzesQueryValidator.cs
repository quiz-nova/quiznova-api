using FluentValidation;

using QuizNova.Application.Common.Validation;

namespace QuizNova.Application.Features.Quizzes.Queries.GetAllQuizzes;

public sealed class GetAllQuizzesQueryValidator : AbstractValidator<GetAllQuizzesQuery>
{
    public static class ErrorMessages
    {
        public const string MarksMin = "Marks count cannot be negative.";
    }

    public GetAllQuizzesQueryValidator()
    {
        RuleFor(query => query.PageNumber)
            .GreaterThan(0).WithMessage(ValidationMessages.Pagination.PageNumberMin);

        RuleFor(query => query.PageSize)
            .GreaterThan(0).WithMessage(ValidationMessages.Pagination.PageSizeMin)
            .LessThanOrEqualTo(100).WithMessage(ValidationMessages.Pagination.PageSizeMax(100));

        RuleFor(query => query.Marks)
            .GreaterThanOrEqualTo(0).WithMessage(ErrorMessages.MarksMin)
            .When(query => query.Marks.HasValue);

        RuleFor(query => query.SearchTerm)
            .MaximumLength(200).WithMessage(ValidationMessages.Pagination.SearchTermMax(200))
            .When(query => !string.IsNullOrWhiteSpace(query.SearchTerm));
    }
}

