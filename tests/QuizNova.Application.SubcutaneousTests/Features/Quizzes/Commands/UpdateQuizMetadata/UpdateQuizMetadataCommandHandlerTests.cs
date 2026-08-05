using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Quizzes.Commands.UpdateQuizMetadata;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Tests.Common.Quizzes;

namespace QuizNova.Application.SubcutaneousTests.Features.Quizzes.Commands.UpdateQuizMetadata;

public class UpdateQuizMetadataCommandHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    // --- Validation tests ---
    [Fact]
    public async Task Handle_WithEmptyQuizId_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var command = new UpdateQuizMetadataCommand(Guid.Empty, "Valid Title", DateTimeOffset.UtcNow.AddMinutes(10),
            DateTimeOffset.UtcNow.AddMinutes(30));

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<UpdateQuizMetadataCommand>(x => x.QuizId) &&
            e.Description == UpdateQuizMetadataCommandValidator.ErrorMessages.QuizIdRequired);
    }

    [Fact]
    public async Task Handle_WithEmptyTitle_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var command = new UpdateQuizMetadataCommand(Guid.NewGuid(), string.Empty, DateTimeOffset.UtcNow.AddMinutes(10),
            DateTimeOffset.UtcNow.AddMinutes(30));

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<UpdateQuizMetadataCommand>(x => x.Title) &&
            e.Description == UpdateQuizMetadataCommandValidator.ErrorMessages.TitleRequired);
    }

    [Fact]
    public async Task Handle_WithTitleTooShort_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var command = new UpdateQuizMetadataCommand(Guid.NewGuid(), "ab", DateTimeOffset.UtcNow.AddMinutes(10),
            DateTimeOffset.UtcNow.AddMinutes(30));

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<UpdateQuizMetadataCommand>(x => x.Title) &&
            e.Description == UpdateQuizMetadataCommandValidator.ErrorMessages.TitleMin);
    }

    [Fact]
    public async Task Handle_WithTitleTooLong_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var command = new UpdateQuizMetadataCommand(Guid.NewGuid(), new string('a', 31),
            DateTimeOffset.UtcNow.AddMinutes(10), DateTimeOffset.UtcNow.AddMinutes(30));

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<UpdateQuizMetadataCommand>(x => x.Title) &&
            e.Description == UpdateQuizMetadataCommandValidator.ErrorMessages.TitleMax);
    }

    [Fact]
    public async Task Handle_WithEndsAtUtcBeforeStartsAtUtc_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var startsAt = DateTimeOffset.UtcNow.AddMinutes(10);
        var command = new UpdateQuizMetadataCommand(Guid.NewGuid(), "Valid Title", startsAt, startsAt.AddMinutes(-5));

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<UpdateQuizMetadataCommand>(x => x.EndsAtUtc) &&
            e.Description == UpdateQuizMetadataCommandValidator.ErrorMessages.EndsAtAfterStart);
    }

    // --- Domain tests ---
    [Fact]
    public async Task Handle_WithNonExistentQuiz_ShouldReturnQuizNotFoundError()
    {
        var mediator = factory.CreateMediator();
        var command = new UpdateQuizMetadataCommand(Guid.NewGuid(), "Valid Title", DateTimeOffset.UtcNow.AddMinutes(10),
            DateTimeOffset.UtcNow.AddMinutes(30));

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.QuizNotFound(command.QuizId).Code);
    }

    [Fact]
    public async Task Handle_WithActiveQuiz_ShouldReturnCannotUpdateError()
    {
        var mediator = factory.CreateMediator();

        Guid quizId;
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var course = await mongoContext.Courses.Find(_ => true).FirstAsync();

            // Create and save an active quiz
            var quiz = QuizFactory.CreateQuiz(
                courseId: course.Id,
                instructorId: course.InstructorId!.Value,
                title: "Active Quiz",
                startsAtUtc: DateTimeOffset.UtcNow.AddMinutes(-10),
                endsAtUtc: DateTimeOffset.UtcNow.AddHours(1)).Value;

            await mongoContext.Quizzes.InsertOneAsync(quiz);
            quizId = quiz.Id;
        }

        var command = new UpdateQuizMetadataCommand(quizId, "Updated Title", DateTimeOffset.UtcNow.AddMinutes(10),
            DateTimeOffset.UtcNow.AddMinutes(30));

        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be("Quiz_CannotUpdateStartedOrCompletedQuiz");
    }

    [Fact]
    public async Task Handle_WithCompletedQuiz_ShouldReturnCannotUpdateError()
    {
        var mediator = factory.CreateMediator();

        Guid quizId;
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var course = await mongoContext.Courses.Find(_ => true).FirstAsync();

            // Create a completed quiz
            var quiz = QuizFactory.CreateQuiz(
                courseId: course.Id,
                instructorId: course.InstructorId!.Value,
                title: "Completed Quiz",
                startsAtUtc: DateTimeOffset.UtcNow.AddMinutes(-30),
                endsAtUtc: DateTimeOffset.UtcNow.AddMinutes(-10)).Value;

            await mongoContext.Quizzes.InsertOneAsync(quiz);
            quizId = quiz.Id;
        }

        var command = new UpdateQuizMetadataCommand(quizId, "Updated Title", DateTimeOffset.UtcNow.AddMinutes(10),
            DateTimeOffset.UtcNow.AddMinutes(30));

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be("Quiz_CannotUpdateStartedOrCompletedQuiz");
    }

    [Fact]
    public async Task Handle_WithDurationLessThan10Minutes_ShouldReturnScheduleDurationError()
    {
        var mediator = factory.CreateMediator();
        var fakeTime = factory.GetFakeTimeProvider();

        Guid quizId;
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();

            // Find a course that isn't completed
            var course = await mongoContext.Courses.Find(_ => true).FirstAsync();

            // Create a scheduled quiz explicitly (future start date)
            var quiz = QuizFactory.CreateQuiz(
                courseId: course.Id,
                instructorId: course.InstructorId!.Value,
                title: "Future Quiz",
                startsAtUtc: fakeTime.GetUtcNow().AddDays(1),
                endsAtUtc: fakeTime.GetUtcNow().AddDays(1).AddHours(1)).Value;

            await mongoContext.Quizzes.InsertOneAsync(quiz);
            quizId = quiz.Id;
        }

        var startsAt = fakeTime.GetUtcNow().AddDays(2);
        var command =
            new UpdateQuizMetadataCommand(quizId, "Updated Title", startsAt, startsAt.AddMinutes(5)); // < 10 mins

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be("Quiz_Schedule_DurationTooShort");
    }

    [Fact]
    public async Task Handle_WithValidDataOnScheduledQuiz_ShouldReturnSuccessAndStoreInDb()
    {
        var mediator = factory.CreateMediator();
        var fakeTime = factory.GetFakeTimeProvider();

        Guid quizId;
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();

            // Find a course that isn't completed
            var course = await mongoContext.Courses.Find(_ => true).FirstAsync();

            // Create a scheduled quiz explicitly
            var quiz = QuizFactory.CreateQuiz(
                courseId: course.Id,
                instructorId: course.InstructorId!.Value,
                title: "Future Quiz",
                startsAtUtc: fakeTime.GetUtcNow().AddDays(1),
                endsAtUtc: fakeTime.GetUtcNow().AddDays(1).AddHours(1)).Value;

            await mongoContext.Quizzes.InsertOneAsync(quiz);
            quizId = quiz.Id;
        }

        var newStart = fakeTime.GetUtcNow().AddDays(2);
        var newEnd = newStart.AddHours(2);
        var command = new UpdateQuizMetadataCommand(quizId, "Awesome Updated Title", newStart, newEnd);

        var result = await mediator.Send(command);

        result.IsSuccess.Should().BeTrue();

        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var quiz = await mongoContext.Quizzes.Find(q => q.Id == quizId).FirstAsync();

            quiz.Title.Should().Be("Awesome Updated Title");
            quiz.StartsAtUtc.Should().BeCloseTo(newStart, TimeSpan.FromMilliseconds(1));
            quiz.EndsAtUtc.Should().BeCloseTo(newEnd, TimeSpan.FromMilliseconds(1));
        }
    }
}
