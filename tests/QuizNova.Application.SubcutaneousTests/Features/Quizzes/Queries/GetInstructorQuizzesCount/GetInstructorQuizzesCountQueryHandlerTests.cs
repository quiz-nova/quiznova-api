using FluentAssertions;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Quizzes.Commands.CreateQuiz;
using QuizNova.Application.Features.Quizzes.Queries.GetInstructorQuizzesCount;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Infrastructure.Identity;
using QuizNova.Tests.Common.Security;

namespace QuizNova.Application.SubcutaneousTests.Features.Quizzes.Queries.GetInstructorQuizzesCount;

public class GetInstructorQuizzesCountQueryHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    // --- Validation tests ---
    [Fact]
    public async Task Handle_WithEmptyInstructorId_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var query = new GetInstructorQuizzesCountQuery(Guid.Empty);

        var result = await mediator.Send(query);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetInstructorQuizzesCountQuery>(x => x.InstructorId) &&
            e.Description == GetInstructorQuizzesCountQueryValidator.ErrorMessages.InstructorIdRequired);
    }

    // --- Domain tests ---
    [Fact]
    public async Task Handle_WithNonExistentInstructor_ShouldReturnNotFoundError()
    {
        var mediator = factory.CreateMediator();
        var query = new GetInstructorQuizzesCountQuery(Guid.NewGuid());

        var result = await mediator.Send(query);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e => e.Code == "Instructor_NotFound");
    }

    [Fact]
    public async Task Handle_WithInstructorHavingQuizzes_ShouldReturnCorrectCount()
    {
        var mediator = factory.CreateMediator();

        Guid courseId;
        Guid instructorId;
        int initialCount;
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var course = await mongoContext.Courses.Find(_ => true).FirstAsync();
            courseId = course.Id;
            instructorId = course.InstructorId!.Value;

            initialCount = (int)await mongoContext.Quizzes.CountDocumentsAsync(q => q.InstructorId == instructorId);
        }

        var questions = new List<CreateQuestionCommand>
        {
            new CreateTfCommand("Question 1", 1, true),
            new CreateTfCommand("Question 2", 1, false),
            new CreateTfCommand("Question 3", 1, true),
        };

        TestCurrentUser.Set(new AppUser { Id = instructorId.ToString() });

        await mediator.Send(new CreateQuizCommand("Count Quiz 1", courseId,
            DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(1).AddHours(1), questions));

        var query = new GetInstructorQuizzesCountQuery(instructorId);

        var result = await mediator.Send(query);

        result.IsSuccess.Should().BeTrue();
        result.Value.QuizzesCount.Should().Be(initialCount + 1);
    }
}
