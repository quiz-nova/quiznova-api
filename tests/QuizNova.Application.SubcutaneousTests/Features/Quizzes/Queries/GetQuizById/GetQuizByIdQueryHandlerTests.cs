using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Quizzes.Queries.GetQuizById;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Tests.Common.Courses;
using QuizNova.Tests.Common.Quizzes;
using QuizNova.Tests.Common.Users.Instructors;

namespace QuizNova.Application.SubcutaneousTests.Features.Quizzes.Queries.GetQuizById;

public class GetQuizByIdQueryHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithEmptyId_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetQuizByIdQuery(Guid.Empty);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetQuizByIdQuery>(x => x.QuizId) &&
            e.Description == GetQuizByIdQueryValidator.ErrorMessages.QuizIdRequired);
    }

    [Fact]
    public async Task Handle_WithNonExistentId_ShouldReturnNotFoundError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetQuizByIdQuery(Guid.NewGuid());

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.QuizNotFound(Guid.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithExistingId_ShouldReturnQuizDto()
    {
        // Arrange
        var mediator = factory.CreateMediator();

        var instructor = InstructorFactory.CreateInstructor().Value;
        var course = CourseFactory.CreateCourse(instructorId: instructor.Id).Value;
        var quiz = QuizFactory.CreateQuiz(course: course, instructorId: instructor.Id, title: "Special Quiz Title").Value;

        // Save directly to DB
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            await mongoContext.Users.InsertOneAsync(instructor);
            await mongoContext.Courses.InsertOneAsync(course);

            await mongoContext.Quizzes.InsertOneAsync(quiz);
        }

        var query = new GetQuizByIdQuery(quiz.Id);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.QuizId.Should().Be(quiz.Id);
        result.Value.Title.Should().Be("Special Quiz Title");
        result.Value.CourseId.Should().Be(course.Id);
        result.Value.InstructorId.Should().Be(instructor.Id);
    }
}
