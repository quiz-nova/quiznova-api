using FluentValidation;

using QuizNova.Application.Common.Validation;

namespace QuizNova.Application.Features.Admins.Queries.GetAllAdmins;

public sealed class GetAllAdminsQueryValidator : AbstractValidator<GetAllAdminsQuery>
{
    public GetAllAdminsQueryValidator()
    {
        RuleFor(query => query.PageNumber)
            .GreaterThan(0).WithMessage(ValidationMessages.Pagination.PageNumberMin);

        RuleFor(query => query.PageSize)
            .GreaterThan(0).WithMessage(ValidationMessages.Pagination.PageSizeMin)
            .LessThanOrEqualTo(100).WithMessage(ValidationMessages.Pagination.PageSizeMax(100));

        RuleFor(query => query.SearchTerm)
            .MaximumLength(200).WithMessage(ValidationMessages.Pagination.SearchTermMax(200))
            .When(query => !string.IsNullOrWhiteSpace(query.SearchTerm));
    }
}

