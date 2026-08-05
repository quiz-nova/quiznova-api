using FluentAssertions;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Quizzes.Commands.AddQuestion;
using QuizNova.Application.Features.Quizzes.Commands.CreateQuiz;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Tests.Common.Quizzes;

namespace QuizNova.Application.SubcutaneousTests.Features.Quizzes.Commands.AddQuestion;

public class AddQuestionCommandHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CreateQuestionCommand _validQuestion = new CreateTfCommand("Valid Tf Question", 1, true);

    // --- Validation tests ---
    [Fact]
    public async Task Handle_WithEmptyQuizId_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var command = new AddQuestionCommand(Guid.Empty, _validQuestion);

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<AddQuestionCommand>(x => x.QuizId) &&
            e.Description == AddQuestionCommandValidator.ErrorMessages.QuizIdRequired);
    }

    [Fact]
    public async Task Handle_WithInvalidQuestionText_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var invalidQuestion = new CreateTfCommand("ab", 1, true); // < 3 chars
        var command = new AddQuestionCommand(Guid.NewGuid(), invalidQuestion);

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateQuestionCommand>(x => x.QuestionText) &&
            e.Description == CreateQuestionCommandValidator.ErrorMessages.QuestionTextMin);
    }

    [Fact]
    public async Task Handle_WithInvalidMarks_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var invalidQuestion = new CreateTfCommand("Valid Question", 6, true); // marks > 5
        var command = new AddQuestionCommand(Guid.NewGuid(), invalidQuestion);

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateQuestionCommand>(x => x.Marks) &&
            e.Description == CreateQuestionCommandValidator.ErrorMessages.MarksRange);
    }

    // --- Domain tests ---
    [Fact]
    public async Task Handle_WithNonExistentQuiz_ShouldReturnQuizNotFoundError()
    {
        var mediator = factory.CreateMediator();
        var command = new AddQuestionCommand(Guid.NewGuid(), _validQuestion);

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.QuizNotFound(command.QuizId).Code);
    }

    [Fact]
    public async Task Handle_WithActiveQuiz_ShouldReturnCannotUpdateError()
    {
        var mediator = factory.CreateMediator();
        var fakeTime = factory.GetFakeTimeProvider();

        Guid quizId;
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var course = await mongoContext.Courses.Find(_ => true).FirstAsync();

            var quiz = QuizFactory.CreateQuiz(
                course: course,
                instructorId: course.InstructorId!.Value,
                title: "Active Quiz",
                startsAtUtc: fakeTime.GetUtcNow().AddMinutes(-10),
                endsAtUtc: fakeTime.GetUtcNow().AddHours(1)).Value;

            await mongoContext.Quizzes.InsertOneAsync(quiz);
            quizId = quiz.Id;
        }

        var command = new AddQuestionCommand(quizId, _validQuestion);

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be("Quiz_CannotUpdateStartedOrCompletedQuiz");
    }

    [Fact]
    public async Task Handle_WithCompletedQuiz_ShouldReturnCannotUpdateError()
    {
        var mediator = factory.CreateMediator();
        var fakeTime = factory.GetFakeTimeProvider();

        Guid quizId;
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var course = await mongoContext.Courses.Find(_ => true).FirstAsync();

            var quiz = QuizFactory.CreateQuiz(
                course: course,
                instructorId: course.InstructorId!.Value,
                title: "Completed Quiz",
                startsAtUtc: fakeTime.GetUtcNow().AddMinutes(-10),
                endsAtUtc: fakeTime.GetUtcNow().AddMinutes(30)).Value;

            await mongoContext.Quizzes.InsertOneAsync(quiz);
            quizId = quiz.Id;
        }

        fakeTime.Advance(TimeSpan.FromHours(1)); // Move past EndsAtUtc

        var command = new AddQuestionCommand(quizId, _validQuestion);

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be("Quiz_CannotUpdateStartedOrCompletedQuiz");
    }

    [Fact]
    public async Task Handle_WithValidDataOnScheduledQuiz_ShouldReturnSuccessAndStoreInDb()
    {
        var mediator = factory.CreateMediator();
        var fakeTime = factory.GetFakeTimeProvider();

        Guid quizId;
        int initialQuestionCount;
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var course = await mongoContext.Courses.Find(_ => true).FirstAsync();

            var quiz = QuizFactory.CreateQuiz(
                course: course,
                instructorId: course.InstructorId!.Value,
                title: "Future Quiz",
                startsAtUtc: fakeTime.GetUtcNow().AddDays(1),
                endsAtUtc: fakeTime.GetUtcNow().AddDays(1).AddHours(1)).Value;

            await mongoContext.Quizzes.InsertOneAsync(quiz);
            quizId = quiz.Id;
            initialQuestionCount = quiz.Questions.Count();
        }

        var command = new AddQuestionCommand(quizId, _validQuestion);

        var result = await mediator.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.QuestionText.Should().Be("Valid Tf Question");

        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var quiz = await mongoContext.Quizzes.Find(q => q.Id == quizId).FirstAsync();

            quiz.Questions.Count().Should().Be(initialQuestionCount + 1);
            quiz.Questions.Should().Contain(q => q.QuestionText == "Valid Tf Question");
        }
    }
}
