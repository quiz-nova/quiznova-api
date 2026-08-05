using FluentValidation;

namespace QuizNova.Application.Features.Courses.Commands.CreateCourse;

public sealed class CreateCourseCommandValidator : AbstractValidator<CreateCourseCommand>
{
    public static class ErrorMessages
    {
        public const string NameRequired = "Course name is required.";
        public const string NameMinLength = "Course name must be at least 3 characters.";
        public const string NameMaxLength = "Course name must not exceed 30 characters.";
        public const string InstructorIdInvalid = "Instructor ID must be valid when provided.";
        public const string MinimumPassingMarksMin = "Minimum passing marks must be greater than zero.";
        public const string MaximumMarksMin = "Maximum marks must be greater than zero.";
        public const string MarksComparisonInvalid = "Minimum passing marks cannot exceed maximum marks.";
    }

    public CreateCourseCommandValidator()
    {
        RuleFor(command => command.Name)
            .NotEmpty()
            .WithMessage(ErrorMessages.NameRequired)
            .MinimumLength(3)
            .WithMessage(ErrorMessages.NameMinLength)
            .MaximumLength(30)
            .WithMessage(ErrorMessages.NameMaxLength);

        RuleFor(command => command.InstructorId)
            .NotEqual(Guid.Empty)
            .When(command => command.InstructorId.HasValue)
            .WithMessage(ErrorMessages.InstructorIdInvalid);

        RuleFor(command => command.MinimumPassingMarks)
            .GreaterThan(0)
            .WithMessage(ErrorMessages.MinimumPassingMarksMin);

        RuleFor(command => command.MaximumMarks)
            .GreaterThan(0)
            .WithMessage(ErrorMessages.MaximumMarksMin);

        RuleFor(command => command)
            .Must(command => command.MinimumPassingMarks <= command.MaximumMarks)
            .WithMessage(ErrorMessages.MarksComparisonInvalid);
    }
}

