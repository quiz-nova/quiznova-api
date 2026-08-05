using FluentValidation;

using QuizNova.Application.Common.Validation;

namespace QuizNova.Application.Features.Courses.Queries.GetAllCourses;

public sealed class GetAllCoursesQueryValidator : AbstractValidator<GetAllCoursesQuery>
{
    public static class ErrorMessages
    {
        public const string InstructorIdInvalid = "Instructor ID must be a valid GUID.";
        public const string StudentIdInvalid = "Student ID must be a valid GUID.";
        public const string EnrolledStudentsCountMin = "Enrolled students count cannot be negative.";
        public const string QuizzesCountMin = "Quizzes count cannot be negative.";
    }

    public GetAllCoursesQueryValidator()
    {
        RuleFor(query => query.PageNumber)
            .GreaterThan(0).WithMessage(ValidationMessages.Pagination.PageNumberMin);

        RuleFor(query => query.PageSize)
            .GreaterThan(0).WithMessage(ValidationMessages.Pagination.PageSizeMin)
            .LessThanOrEqualTo(100).WithMessage(ValidationMessages.Pagination.PageSizeMax(100));

        RuleFor(query => query.InstructorId)
            .NotEqual(Guid.Empty).WithMessage(ErrorMessages.InstructorIdInvalid)
            .When(query => query.InstructorId.HasValue);

        RuleFor(query => query.StudentId)
            .NotEqual(Guid.Empty).WithMessage(ErrorMessages.StudentIdInvalid)
            .When(query => query.StudentId.HasValue);

        RuleFor(query => query.EnrolledStudentsCount)
            .GreaterThanOrEqualTo(0).WithMessage(ErrorMessages.EnrolledStudentsCountMin)
            .When(query => query.EnrolledStudentsCount.HasValue);

        RuleFor(query => query.QuizzesCount)
            .GreaterThanOrEqualTo(0).WithMessage(ErrorMessages.QuizzesCountMin)
            .When(query => query.QuizzesCount.HasValue);

        RuleFor(query => query.SearchTerm)
            .MaximumLength(200).WithMessage(ValidationMessages.Pagination.SearchTermMax(200))
            .When(query => !string.IsNullOrWhiteSpace(query.SearchTerm));
    }
}

