using FluentValidation;

using QuizNova.Application.Common.Validation;

namespace QuizNova.Application.Features.Instructors.Queries.GetAllInstructors;

public sealed class GetAllInstructorsQueryValidator : AbstractValidator<GetAllInstructorsQuery>
{
    public static class ErrorMessages
    {
        public const string CoursesCountMin = "Courses count must be non-negative.";
        public const string QuizzesCountMin = "Quizzes count must be non-negative.";
    }

    public GetAllInstructorsQueryValidator()
    {
        RuleFor(query => query.PageNumber)
            .GreaterThan(0).WithMessage(ValidationMessages.Pagination.PageNumberMin);

        RuleFor(query => query.PageSize)
            .GreaterThan(0).WithMessage(ValidationMessages.Pagination.PageSizeMin)
            .LessThanOrEqualTo(100).WithMessage(ValidationMessages.Pagination.PageSizeMax(100));

        RuleFor(query => query.SearchTerm)
            .MaximumLength(100).WithMessage(ValidationMessages.Pagination.SearchTermMax(100))
            .When(query => !string.IsNullOrEmpty(query.SearchTerm));

        RuleFor(query => query.CoursesCount)
            .GreaterThanOrEqualTo(0).WithMessage(ErrorMessages.CoursesCountMin)
            .When(query => query.CoursesCount.HasValue);

        RuleFor(query => query.QuizzesCount)
            .GreaterThanOrEqualTo(0).WithMessage(ErrorMessages.QuizzesCountMin)
            .When(query => query.QuizzesCount.HasValue);
    }
}

