using FluentValidation;

namespace QuizNova.Application.Features.Courses.Queries.GetCourseById;

public sealed class GetCourseByIdQueryValidator : AbstractValidator<GetCourseByIdQuery>
{
    public static class ErrorMessages
    {
        public const string CourseIdRequired = "Course ID is required.";
    }

    public GetCourseByIdQueryValidator()
    {
        RuleFor(x => x.CourseId)
            .NotEmpty()
            .WithMessage(ErrorMessages.CourseIdRequired);
    }
}

