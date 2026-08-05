using FluentValidation;

using QuizNova.Application.Common.Validation;

namespace QuizNova.Application.Features.QuizAttempts.Queries.GetPendingManualAnswers;

public sealed class GetPendingManualAnswersQueryValidator : AbstractValidator<GetPendingManualAnswersQuery>
{
    public GetPendingManualAnswersQueryValidator()
    {
        RuleFor(query => query.PageNumber)
            .GreaterThan(0).WithMessage(ValidationMessages.Pagination.PageNumberMin);

        RuleFor(query => query.PageSize)
            .GreaterThan(0).WithMessage(ValidationMessages.Pagination.PageSizeMin)
            .LessThanOrEqualTo(100).WithMessage(ValidationMessages.Pagination.PageSizeMax(100));
    }
}

