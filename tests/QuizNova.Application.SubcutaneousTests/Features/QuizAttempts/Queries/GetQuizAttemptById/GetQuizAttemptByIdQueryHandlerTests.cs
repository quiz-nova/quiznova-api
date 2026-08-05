using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.QuizAttempts.Queries.GetQuizAttemptById;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Tests.Common.Courses;
using QuizNova.Tests.Common.QuizAttempts;
using QuizNova.Tests.Common.QuizAttempts.Answers;
using QuizNova.Tests.Common.Quizzes;
using QuizNova.Tests.Common.Users.Instructors;
using QuizNova.Tests.Common.Users.Students;

namespace QuizNova.Application.SubcutaneousTests.Features.QuizAttempts.Queries.GetQuizAttemptById;

public class GetQuizAttemptByIdQueryHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithEmptyId_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetQuizAttemptByIdQuery(Guid.Empty);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetQuizAttemptByIdQuery>(x => x.QuizAttemptId) &&
            e.Description == GetQuizAttemptByIdQueryValidator.ErrorMessages.QuizAttemptIdRequired);
    }

    [Fact]
    public async Task Handle_WithNonExistentId_ShouldReturnNotFoundError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetQuizAttemptByIdQuery(Guid.NewGuid());

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.QuizAttemptNotFound(Guid.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithExistingId_ShouldReturnQuizAttemptDto()
    {
        // Arrange
        var mediator = factory.CreateMediator();

        var student = StudentFactory.CreateStudent().Value;
        var instructor = InstructorFactory.CreateInstructor().Value;
        var course = CourseFactory.CreateCourse(instructorId: instructor.Id).Value;
        var quiz = QuizFactory.CreateQuiz(courseId: course.Id, instructorId: instructor.Id).Value;

        var attemptId = Guid.NewGuid();
        var questionId = quiz.Questions.First().Id;
        var answer = AnswerFactory.CreateTfAnswer(
            studentId: student.Id,
            questionId: questionId,
            quizAttemptId: attemptId).Value;

        var attempt = QuizAttemptFactory.CreateQuizAttempt(quizId: quiz.Id,
            id: attemptId, studentId: student.Id).Value;
        attempt.SubmitAnswer(answer);

        // Save directly to DB
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            await mongoContext.Users.InsertOneAsync(student);
            await mongoContext.Users.InsertOneAsync(instructor);
            await mongoContext.Courses.InsertOneAsync(course);

            await mongoContext.Quizzes.InsertOneAsync(quiz);
            await mongoContext.QuizAttempts.InsertOneAsync(attempt);
        }

        var query = new GetQuizAttemptByIdQuery(attempt.Id);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.QuizAttemptId.Should().Be(attempt.Id);
    }
}
