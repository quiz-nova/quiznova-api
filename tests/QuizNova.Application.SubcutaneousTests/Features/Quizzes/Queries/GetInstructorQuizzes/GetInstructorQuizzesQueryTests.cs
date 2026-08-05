using FluentAssertions;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Quizzes.Commands.CreateQuiz;
using QuizNova.Application.Features.Quizzes.Queries.GetInstructorQuizzes;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Infrastructure.Identity;
using QuizNova.Tests.Common.Security;

namespace QuizNova.Application.SubcutaneousTests.Features.Quizzes.Queries.GetInstructorQuizzes;

public class GetInstructorQuizzesQueryTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithEmptyInstructorId_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var query = new GetInstructorQuizzesQuery(Guid.Empty);

        var result = await mediator.Send(query);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetInstructorQuizzesQuery>(x => x.InstructorId) &&
            e.Description == GetInstructorQuizzesQueryValidator.ErrorMessages.InstructorIdRequired);
    }

    [Fact]
    public async Task Handle_WithNonExistentInstructorId_ShouldReturnNotFoundError()
    {
        var mediator = factory.CreateMediator();
        var query = new GetInstructorQuizzesQuery(Guid.NewGuid());

        var result = await mediator.Send(query);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e => e.Code == "Instructor_NotFound");
    }

    [Fact]
    public async Task Handle_WithValidInstructorAndQuizzes_ShouldReturnInstructorQuizzes()
    {
        var mediator = factory.CreateMediator();

        Guid instructorId;
        Guid courseId;
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var course = await mongoContext.Courses.Find(_ => true).FirstAsync();
            courseId = course.Id;
            instructorId = course.InstructorId!.Value;
        }

        TestCurrentUser.Set(new AppUser { Id = instructorId.ToString() });

        var questions = new List<CreateQuestionCommand>
        {
            new CreateTfCommand("Question 1", 1, true),
            new CreateTfCommand("Question 2", 2, false),
            new CreateTfCommand("Question 3", 3, true),
        };
        var quizTitle = $"Quiz {Guid.NewGuid().ToString()[..8]}";
        var quizResult = await mediator.Send(new CreateQuizCommand(quizTitle, courseId,
            DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(2), questions));
        quizResult.IsSuccess.Should().BeTrue();

        var query = new GetInstructorQuizzesQuery(instructorId);

        var result = await mediator.Send(query);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.Should().Contain(q => q.Title == quizTitle);
    }
}
