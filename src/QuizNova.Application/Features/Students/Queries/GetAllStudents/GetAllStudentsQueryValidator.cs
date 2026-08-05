using FluentValidation;

using QuizNova.Application.Common.Validation;

namespace QuizNova.Application.Features.Students.Queries.GetAllStudents;

public sealed class GetAllStudentsQueryValidator : AbstractValidator<GetAllStudentsQuery>
{
    public static class ErrorMessages
    {
        public const string EnrolledCoursesCountMin = "Enrolled courses count cannot be negative.";
        public const string CourseIdInvalid = "Course ID must be a valid GUID.";
        public const string IsEnrolledInCourseRequired = "Enrollment filter is required when course ID is provided.";
    }

    public GetAllStudentsQueryValidator()
    {
        RuleFor(query => query.PageNumber)
            .GreaterThan(0).WithMessage(ValidationMessages.Pagination.PageNumberMin);

        RuleFor(query => query.PageSize)
            .GreaterThan(0).WithMessage(ValidationMessages.Pagination.PageSizeMin)
            .LessThanOrEqualTo(100).WithMessage(ValidationMessages.Pagination.PageSizeMax(100));

        RuleFor(query => query.EnrolledCoursesCount)
            .GreaterThanOrEqualTo(0).WithMessage(ErrorMessages.EnrolledCoursesCountMin)
            .When(query => query.EnrolledCoursesCount.HasValue);

        RuleFor(query => query.CourseId)
            .NotEqual(Guid.Empty).WithMessage(ErrorMessages.CourseIdInvalid)
            .When(query => query.CourseId.HasValue);

        RuleFor(query => query.IsEnrolledInCourse)
            .NotNull().WithMessage(ErrorMessages.IsEnrolledInCourseRequired)
            .When(query => query.CourseId.HasValue);

        RuleFor(query => query.SearchTerm)
            .MaximumLength(200).WithMessage(ValidationMessages.Pagination.SearchTermMax(200))
            .When(query => !string.IsNullOrWhiteSpace(query.SearchTerm));
    }
}

