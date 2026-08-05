using System.Net;

using FluentAssertions;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Quizzes.Commands.CreateQuiz;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Infrastructure.Identity;
using QuizNova.Tests.Common.Security;

namespace QuizNova.Application.SubcutaneousTests.Features.Quizzes.Commands.CreateQuiz;

public class CreateQuizCommandHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly List<CreateQuestionCommand> _validQuestions =
    [
        new CreateTfCommand("Q1 Tf", 1, true),
        new CreateTfCommand("Q2 Tf", 1, false),
        new CreateTfCommand("Q3 Tf", 1, true),
    ];

    // --- Validation layer tests ---
    [Fact]
    public async Task Handle_WithEmptyTitle_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var command = new CreateQuizCommand(string.Empty, Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddMinutes(10), DateTimeOffset.UtcNow.AddMinutes(30), _validQuestions);

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateQuizCommand>(x => x.Title) &&
            e.Description == CreateQuizCommandValidator.ErrorMessages.TitleRequired);
    }

    [Fact]
    public async Task Handle_WithTitleTooShort_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var command = new CreateQuizCommand("ab", Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddMinutes(10), DateTimeOffset.UtcNow.AddMinutes(30), _validQuestions);

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateQuizCommand>(x => x.Title) &&
            e.Description == CreateQuizCommandValidator.ErrorMessages.TitleMin);
    }

    [Fact]
    public async Task Handle_WithTitleTooLong_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var command = new CreateQuizCommand(new string('a', 31), Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddMinutes(10), DateTimeOffset.UtcNow.AddMinutes(30), _validQuestions);

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateQuizCommand>(x => x.Title) &&
            e.Description == CreateQuizCommandValidator.ErrorMessages.TitleMax);
    }

    [Fact]
    public async Task Handle_WithEmptyCourseId_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var command = new CreateQuizCommand("Valid Title", Guid.Empty,
            DateTimeOffset.UtcNow.AddMinutes(10), DateTimeOffset.UtcNow.AddMinutes(30), _validQuestions);

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateQuizCommand>(x => x.CourseId) &&
            e.Description == CreateQuizCommandValidator.ErrorMessages.CourseIdRequired);
    }

    [Fact]
    public async Task Handle_WithStartsAtUtcInPast_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var command = new CreateQuizCommand("Valid Title", Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddMinutes(-10), DateTimeOffset.UtcNow.AddMinutes(30), _validQuestions);

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateQuizCommand>(x => x.StartsAtUtc) &&
            e.Description == CreateQuizCommandValidator.ErrorMessages.StartsAtPast);
    }

    [Fact]
    public async Task Handle_WithEndsAtUtcBeforeStartsAtUtc_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var startsAt = DateTimeOffset.UtcNow.AddMinutes(10);
        var command = new CreateQuizCommand("Valid Title", Guid.NewGuid(),
            startsAt, startsAt.AddMinutes(-5), _validQuestions);

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateQuizCommand>(x => x.EndsAtUtc) &&
            e.Description == CreateQuizCommandValidator.ErrorMessages.EndsAtAfterStart);
    }

    [Fact]
    public async Task Handle_WithDurationLessThan10Minutes_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var startsAt = DateTimeOffset.UtcNow.AddMinutes(10);
        var command = new CreateQuizCommand("Valid Title", Guid.NewGuid(),
            startsAt, startsAt.AddMinutes(5), _validQuestions);

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateQuizCommand>(x => x.EndsAtUtc) &&
            e.Description == CreateQuizCommandValidator.ErrorMessages.QuizTimeApart);
    }

    [Fact]
    public async Task Handle_WithEmptyQuestionsList_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var command = new CreateQuizCommand("Valid Title", Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddMinutes(10), DateTimeOffset.UtcNow.AddMinutes(30),
            new List<CreateQuestionCommand>());

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateQuizCommand>(x => x.Questions) &&
            e.Description == CreateQuizCommandValidator.ErrorMessages.QuestionsRequired);
    }

    // --- Domain Rules / Handler level tests ---
    [Fact]
    public async Task Handle_WithZeroQuestions_ShouldReturnDomainError()
    {
        var mediator = factory.CreateMediator();

        Guid courseId;
        Guid instructorId;
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var course = await mongoContext.Courses.Find(_ => true).FirstAsync();
            courseId = course.Id;
            instructorId = course.InstructorId!.Value;
        }

        TestCurrentUser.Set(new AppUser { Id = instructorId.ToString() });

        var command = new CreateQuizCommand("Valid Title", courseId,
            DateTimeOffset.UtcNow.AddMinutes(10), DateTimeOffset.UtcNow.AddMinutes(30),
            []);

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e => e.Code == "Questions");
    }

    [Fact]
    public async Task Handle_WithNonExistentCourse_ShouldReturnCourseNotFoundError()
    {
        var mediator = factory.CreateMediator();
        TestCurrentUser.Set(TestUsers.Instructor1.User);

        var command = new CreateQuizCommand("Valid Title", Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddMinutes(10), DateTimeOffset.UtcNow.AddMinutes(30), _validQuestions);

        var result = await mediator.Send(command);

        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.QuizCourseNotFound(command.CourseId).Code);
    }

    [Fact]
    public async Task Handle_WithValidData_ShouldReturnSuccessAndStoreInDb()
    {
        var mediator = factory.CreateMediator();

        Guid courseId;
        Guid instructorId;
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var course = await mongoContext.Courses.Find(_ => true).FirstAsync();
            courseId = course.Id;
            instructorId = course.InstructorId!.Value;
        }

        TestCurrentUser.Set(new AppUser { Id = instructorId.ToString() });

        var command = new CreateQuizCommand("Brand New Quiz", courseId,
            DateTimeOffset.UtcNow.AddMinutes(10), DateTimeOffset.UtcNow.AddMinutes(30), _validQuestions);

        var result = await mediator.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.Title.Should().Be("Brand New Quiz");
        result.Value.CourseId.Should().Be(courseId);
        result.Value.InstructorId.Should().Be(instructorId);

        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var quiz = await mongoContext.Quizzes
                .Find(q => q.Id == result.Value.QuizId)
                .FirstOrDefaultAsync();

            quiz.Should().NotBeNull();
            quiz.Title.Should().Be("Brand New Quiz");
            quiz.Questions.Should().HaveCount(3);
        }
    }

    // --- Authorization testing via HTTP pipeline ---
    [Fact]
    public async Task CreateQuiz_AsAdmin_ShouldReturnForbidden()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        await client.AuthenticateAsync("admin@quiznova.local", "Admin123!", "Admin");

        var command = new CreateQuizCommand("Valid Title", Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddMinutes(10), DateTimeOffset.UtcNow.AddMinutes(30), _validQuestions);

        // Act
        var response = await client.PostAsJsonAsync("/quizzes", command);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CreateQuiz_AsStudent_ShouldReturnForbidden()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        await client.AuthenticateAsync("omar.yasser@quiznova.local", "Student123!", "Student");

        var command = new CreateQuizCommand("Valid Title", Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddMinutes(10), DateTimeOffset.UtcNow.AddMinutes(30), _validQuestions);

        // Act
        var response = await client.PostAsJsonAsync("/quizzes", command);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
