using FluentValidation;

using QuizNova.Application.Features.Quizzes.Commands.CreateQuiz;

namespace QuizNova.Application.Features.Quizzes.Commands.AddQuestion;

public sealed class AddQuestionCommandValidator : AbstractValidator<AddQuestionCommand>
{
    public static class ErrorMessages
    {
        public const string QuizIdRequired = "Quiz ID is required.";
        public const string QuestionRequired = "Question is required.";
    }

    public AddQuestionCommandValidator()
    {
        RuleFor(x => x.QuizId)
            .NotEmpty().WithMessage(ErrorMessages.QuizIdRequired);

        RuleFor(x => x.Question)
            .NotNull().WithMessage(ErrorMessages.QuestionRequired);

        RuleFor(x => x.Question).Custom((question, ctx) =>
        {
            var validationResult = question switch
            {
                CreateMcqCommand mcq => new CreateMcqCommandValidator().Validate(mcq),
                CreateTfCommand tf => new CreateTfCommandValidator().Validate(tf),
                CreateEssayCommand essay => new CreateEssayCommandValidator().Validate(essay),
                _ => null,
            };

            if (validationResult is null)
            {
                return;
            }

            foreach (var failure in validationResult.Errors)
            {
                ctx.AddFailure(failure);
            }
        });
    }
}

